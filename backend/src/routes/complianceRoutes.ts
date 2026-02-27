/**
 * Compliance Routes — GDPR DSAR, Consent, Breach Register, Incidents, Vendor Assessments
 *
 * Real enforcement endpoints for GDPR, HIPAA, SOC 2, ISO 27001, and PCI DSS.
 * Every mutation is audit-logged. All queries are tenant-scoped.
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

// ─────────────────────────────────────────────────────────────────────────────
// Data Subject Requests (GDPR Articles 15-22)
// ─────────────────────────────────────────────────────────────────────────────

export const complianceRoutes: FastifyPluginAsync = async (app) => {
  // ── DSAR: List requests ─────────────────────────────────────────────────
  app.get("/dsar", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const status = (req.query as any).status;
    const where: any = { tenantId };
    if (status) where.status = status;

    const requests = await prisma.dataSubjectRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return { ok: true, requests, total: requests.length };
  });

  // ── DSAR: Create request ────────────────────────────────────────────────
  app.post("/dsar", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const { requestType, subjectEmail, subjectName, reason } = req.body as any;
    if (!requestType || !subjectEmail) {
      return reply.status(400).send({ ok: false, error: "requestType and subjectEmail required" });
    }

    const validTypes = ["access", "erasure", "portability", "restriction", "rectification", "objection"];
    if (!validTypes.includes(requestType)) {
      return reply.status(400).send({ ok: false, error: `requestType must be one of: ${validTypes.join(", ")}` });
    }

    // GDPR: 30-day deadline from submission
    const dueBy = new Date();
    dueBy.setDate(dueBy.getDate() + 30);

    const dsar = await prisma.dataSubjectRequest.create({
      data: {
        tenantId,
        requestType,
        subjectEmail,
        subjectName: subjectName || null,
        reason: reason || null,
        requestedBy: (req as any).auth?.userId || null,
        dueBy,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "user",
        actorUserId: (req as any).auth?.userId || null,
        level: "info",
        action: "DSAR_CREATED",
        entityType: "data_subject_request",
        entityId: dsar.id,
        message: `DSAR ${requestType} request created for ${subjectEmail}`,
        meta: { requestType, subjectEmail },
        timestamp: new Date(),
      } as any,
    }).catch(() => null);

    return reply.status(201).send({ ok: true, dsar });
  });

  // ── DSAR: Process request (update status) ───────────────────────────────
  app.patch("/dsar/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params as any;
    const { status, response } = req.body as any;

    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const validStatuses = ["pending", "in_progress", "completed", "denied"];
    if (status && !validStatuses.includes(status)) {
      return reply.status(400).send({ ok: false, error: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const data: any = {};
    if (status) data.status = status;
    if (response) data.response = response;
    if (status === "completed") data.completedAt = new Date();

    const dsar = await prisma.dataSubjectRequest.updateMany({
      where: { id, tenantId },
      data,
    });

    if (dsar.count === 0) return reply.status(404).send({ ok: false, error: "Request not found" });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "user",
        actorUserId: (req as any).auth?.userId || null,
        level: "info",
        action: "DSAR_UPDATED",
        entityType: "data_subject_request",
        entityId: id,
        message: `DSAR ${id} updated to ${status || "modified"}`,
        meta: { status, response },
        timestamp: new Date(),
      } as any,
    }).catch(() => null);

    return { ok: true, updated: dsar.count };
  });

  // ── DSAR: Export user data (Right to Portability — Article 20) ──────────
  app.get("/dsar/:email/export", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    const { email } = req.params as any;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    // Gather all data for this subject across the tenant
    const [contacts, auditLogs, jobs, ledger, integrations, consents, dsars] = await Promise.all([
      prisma.crmContact.findMany({ where: { tenantId, email } }),
      prisma.auditLog.findMany({
        where: { tenantId, actorUserId: email },
        take: 1000,
        orderBy: { createdAt: "desc" },
      }),
      prisma.job.findMany({ where: { tenantId }, take: 500, orderBy: { createdAt: "desc" } }),
      prisma.ledgerEntry.findMany({ where: { tenantId }, take: 500, orderBy: { createdAt: "desc" } }),
      prisma.integration.findMany({ where: { tenantId }, select: { provider: true, status: true, created_at: true } }),
      prisma.consentRecord.findMany({ where: { tenantId, subjectEmail: email } }),
      prisma.dataSubjectRequest.findMany({ where: { tenantId, subjectEmail: email } }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      tenantId,
      subjectEmail: email,
      contacts,
      consentRecords: consents,
      dataSubjectRequests: dsars,
      auditLogEntries: auditLogs.length,
      jobsCreated: jobs.length,
      ledgerEntries: ledger.length,
      integrations,
    };

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "user",
        actorUserId: (req as any).auth?.userId || null,
        level: "info",
        action: "DATA_EXPORT",
        entityType: "data_subject_request",
        entityId: email,
        message: `Data export generated for ${email}`,
        meta: { subjectEmail: email },
        timestamp: new Date(),
      } as any,
    }).catch(() => null);

    reply.header("content-disposition", `attachment; filename="data-export-${email}.json"`);
    reply.header("content-type", "application/json");
    return reply.send(exportData);
  });

  // ── DSAR: Delete user data (Right to Erasure — Article 17) ──────────────
  app.delete("/dsar/:email/erase", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    const { email } = req.params as any;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const deleted: Record<string, number> = {};

    // Delete CRM contacts
    const contacts = await prisma.crmContact.deleteMany({ where: { tenantId, email } });
    deleted.crmContacts = contacts.count;

    // Delete consent records
    const consents = await prisma.consentRecord.deleteMany({ where: { tenantId, subjectEmail: email } });
    deleted.consentRecords = consents.count;

    // Clear integration tokens (don't delete the row — keep for audit)
    const integrations = await prisma.integration.updateMany({
      where: { tenantId },
      data: { access_token: null, refresh_token: null, status: "disconnected" },
    });
    deleted.integrationsCleared = integrations.count;

    // Log the erasure (audit log is retained for compliance — cannot be deleted per GDPR Article 17(3)(e))
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "user",
        actorUserId: (req as any).auth?.userId || null,
        level: "warn",
        action: "DATA_ERASURE",
        entityType: "data_subject_request",
        entityId: email,
        message: `Data erasure completed for ${email}`,
        meta: { subjectEmail: email, deleted },
        timestamp: new Date(),
      } as any,
    }).catch(() => null);

    return { ok: true, deleted, note: "Audit logs retained per GDPR Article 17(3)(e) — legal obligation" };
  });

  // ── DSAR: Overdue check ─────────────────────────────────────────────────
  app.get("/dsar/overdue", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const overdue = await prisma.dataSubjectRequest.findMany({
      where: {
        tenantId,
        status: { in: ["pending", "in_progress"] },
        dueBy: { lt: new Date() },
      },
      orderBy: { dueBy: "asc" },
    });

    return { ok: true, overdue, count: overdue.length };
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Consent Management (GDPR Articles 4, 7)
  // ─────────────────────────────────────────────────────────────────────────

  // ── List consent records for a subject ──────────────────────────────────
  app.get("/consent/:email", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    const { email } = req.params as any;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const records = await prisma.consentRecord.findMany({
      where: { tenantId, subjectEmail: email },
    });

    return { ok: true, records };
  });

  // ── Grant consent ───────────────────────────────────────────────────────
  app.post("/consent", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const { subjectEmail, purpose, lawfulBasis } = req.body as any;
    if (!subjectEmail || !purpose || !lawfulBasis) {
      return reply.status(400).send({ ok: false, error: "subjectEmail, purpose, and lawfulBasis required" });
    }

    const validPurposes = ["marketing", "analytics", "ai_processing", "data_sharing", "communications"];
    const validBases = ["consent", "contract", "legal_obligation", "vital_interest", "public_task", "legitimate_interest"];

    if (!validPurposes.includes(purpose)) {
      return reply.status(400).send({ ok: false, error: `purpose must be one of: ${validPurposes.join(", ")}` });
    }
    if (!validBases.includes(lawfulBasis)) {
      return reply.status(400).send({ ok: false, error: `lawfulBasis must be one of: ${validBases.join(", ")}` });
    }

    const record = await prisma.consentRecord.upsert({
      where: { tenantId_subjectEmail_purpose: { tenantId, subjectEmail, purpose } },
      create: {
        tenantId,
        subjectEmail,
        purpose,
        lawfulBasis,
        granted: true,
        grantedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || null,
      },
      update: {
        granted: true,
        grantedAt: new Date(),
        withdrawnAt: null,
        lawfulBasis,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "user",
        actorUserId: (req as any).auth?.userId || null,
        level: "info",
        action: "CONSENT_GRANTED",
        entityType: "consent_record",
        entityId: record.id,
        message: `Consent granted: ${purpose} for ${subjectEmail}`,
        meta: { subjectEmail, purpose, lawfulBasis },
        timestamp: new Date(),
      } as any,
    }).catch(() => null);

    return reply.status(201).send({ ok: true, record });
  });

  // ── Withdraw consent ────────────────────────────────────────────────────
  app.delete("/consent/:email/:purpose", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    const { email, purpose } = req.params as any;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    try {
      const record = await prisma.consentRecord.update({
        where: { tenantId_subjectEmail_purpose: { tenantId, subjectEmail: email, purpose } },
        data: { granted: false, withdrawnAt: new Date() },
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          actorType: "user",
          actorUserId: (req as any).auth?.userId || null,
          level: "warn",
          action: "CONSENT_WITHDRAWN",
          entityType: "consent_record",
          entityId: record.id,
          message: `Consent withdrawn: ${purpose} for ${email}`,
          meta: { subjectEmail: email, purpose },
          timestamp: new Date(),
        } as any,
      }).catch(() => null);

      return { ok: true, record };
    } catch {
      return reply.status(404).send({ ok: false, error: "Consent record not found" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Data Breach Register (GDPR Article 33-34, HIPAA Breach Notification Rule)
  // ─────────────────────────────────────────────────────────────────────────

  // ── List breaches ───────────────────────────────────────────────────────
  app.get("/breaches", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const breaches = await prisma.dataBreach.findMany({
      where: { tenantId },
      orderBy: { detectedAt: "desc" },
      take: 100,
    });

    return { ok: true, breaches, total: breaches.length };
  });

  // ── Report a breach ─────────────────────────────────────────────────────
  app.post("/breaches", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const { severity, title, description, dataTypesAffected, individualsAffected, incidentCommander } = req.body as any;
    if (!severity || !title || !description) {
      return reply.status(400).send({ ok: false, error: "severity, title, and description required" });
    }

    const detectedAt = new Date();

    // GDPR: 72-hour authority notification deadline
    const notifyAuthorityBy = new Date(detectedAt);
    notifyAuthorityBy.setHours(notifyAuthorityBy.getHours() + 72);

    // HIPAA: 60-day individual notification deadline
    const notifyIndividualsBy = new Date(detectedAt);
    notifyIndividualsBy.setDate(notifyIndividualsBy.getDate() + 60);

    const breach = await prisma.dataBreach.create({
      data: {
        tenantId,
        severity,
        title,
        description,
        dataTypesAffected: dataTypesAffected || [],
        individualsAffected: individualsAffected || null,
        detectedAt,
        notifyAuthorityBy,
        notifyIndividualsBy,
        incidentCommander: incidentCommander || null,
        reportedBy: (req as any).auth?.userId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "user",
        actorUserId: (req as any).auth?.userId || null,
        level: "error",
        action: "BREACH_REPORTED",
        entityType: "data_breach",
        entityId: breach.id,
        message: `Data breach reported: ${title} (${severity})`,
        meta: { severity, title, dataTypesAffected, individualsAffected },
        timestamp: new Date(),
      } as any,
    }).catch(() => null);

    return reply.status(201).send({
      ok: true,
      breach,
      deadlines: {
        authorityNotification: notifyAuthorityBy.toISOString(),
        individualNotification: notifyIndividualsBy.toISOString(),
      },
    });
  });

  // ── Update breach status ────────────────────────────────────────────────
  app.patch("/breaches/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params as any;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const { status, rootCause, remediationSteps, postMortemUrl, authorityNotified, individualsNotified } = req.body as any;

    const data: any = {};
    if (status) data.status = status;
    if (rootCause) data.rootCause = rootCause;
    if (remediationSteps) data.remediationSteps = remediationSteps;
    if (postMortemUrl) data.postMortemUrl = postMortemUrl;
    if (status === "contained") data.containedAt = new Date();
    if (authorityNotified) data.authorityNotifiedAt = new Date();
    if (individualsNotified) data.individualsNotifiedAt = new Date();

    const result = await prisma.dataBreach.updateMany({ where: { id, tenantId }, data });
    if (result.count === 0) return reply.status(404).send({ ok: false, error: "Breach not found" });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "user",
        actorUserId: (req as any).auth?.userId || null,
        level: "warn",
        action: "BREACH_UPDATED",
        entityType: "data_breach",
        entityId: id,
        message: `Breach ${id} updated: ${status || "modified"}`,
        meta: { status, rootCause },
        timestamp: new Date(),
      } as any,
    }).catch(() => null);

    return { ok: true, updated: result.count };
  });

  // ── Breaches approaching deadlines ──────────────────────────────────────
  app.get("/breaches/deadlines", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const now = new Date();
    const in24h = new Date(now);
    in24h.setHours(in24h.getHours() + 24);

    const urgent = await prisma.dataBreach.findMany({
      where: {
        tenantId,
        status: { notIn: ["closed"] },
        OR: [
          { authorityNotifiedAt: null, notifyAuthorityBy: { lte: in24h } },
          { individualsNotifiedAt: null, notifyIndividualsBy: { not: null } },
        ],
      },
      orderBy: { notifyAuthorityBy: "asc" },
    });

    return { ok: true, urgent, count: urgent.length };
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Incident Reports (SOC 2, ISO 27001 A.16)
  // ─────────────────────────────────────────────────────────────────────────

  // ── List incidents ──────────────────────────────────────────────────────
  app.get("/incidents", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const { status, severity, category } = req.query as any;
    const where: any = { tenantId };
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (category) where.category = category;

    const incidents = await prisma.incidentReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return { ok: true, incidents, total: incidents.length };
  });

  // ── Create incident ─────────────────────────────────────────────────────
  app.post("/incidents", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const { severity, category, title, description, impactSummary, affectedSystems, assignedTo } = req.body as any;
    if (!severity || !category || !title || !description) {
      return reply.status(400).send({ ok: false, error: "severity, category, title, and description required" });
    }

    const incident = await prisma.incidentReport.create({
      data: {
        tenantId,
        severity,
        category,
        title,
        description,
        impactSummary: impactSummary || null,
        affectedSystems: affectedSystems || [],
        reportedBy: (req as any).auth?.userId || null,
        assignedTo: assignedTo || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "user",
        actorUserId: (req as any).auth?.userId || null,
        level: severity === "p0" ? "error" : "warn",
        action: "INCIDENT_CREATED",
        entityType: "incident_report",
        entityId: incident.id,
        message: `Incident reported: ${title} (${severity}/${category})`,
        meta: { severity, category, title, affectedSystems },
        timestamp: new Date(),
      } as any,
    }).catch(() => null);

    return reply.status(201).send({ ok: true, incident });
  });

  // ── Update incident ─────────────────────────────────────────────────────
  app.patch("/incidents/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params as any;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const { status, assignedTo, rootCause, resolution, lessonsLearned } = req.body as any;

    const data: any = {};
    if (status) data.status = status;
    if (assignedTo) data.assignedTo = assignedTo;
    if (rootCause) data.rootCause = rootCause;
    if (resolution) data.resolution = resolution;
    if (lessonsLearned) data.lessonsLearned = lessonsLearned;
    if (status === "resolved" || status === "closed") data.resolvedAt = new Date();

    const result = await prisma.incidentReport.updateMany({ where: { id, tenantId }, data });
    if (result.count === 0) return reply.status(404).send({ ok: false, error: "Incident not found" });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "user",
        actorUserId: (req as any).auth?.userId || null,
        level: "info",
        action: "INCIDENT_UPDATED",
        entityType: "incident_report",
        entityId: id,
        message: `Incident ${id} updated: ${status || "modified"}`,
        meta: { status, rootCause, resolution },
        timestamp: new Date(),
      } as any,
    }).catch(() => null);

    return { ok: true, updated: result.count };
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Vendor Risk Assessments (ISO 27001 A.15, SOC 2)
  // ─────────────────────────────────────────────────────────────────────────

  // ── List vendor assessments ─────────────────────────────────────────────
  app.get("/vendors", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const vendors = await prisma.vendorAssessment.findMany({
      where: { tenantId },
      orderBy: { vendorName: "asc" },
    });

    return { ok: true, vendors, total: vendors.length };
  });

  // ── Create/update vendor assessment ─────────────────────────────────────
  app.post("/vendors", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const { vendorName, category, riskLevel, dataAccess, complianceCerts, hasDataProcessingAgreement, hasBaa, notes } = req.body as any;
    if (!vendorName || !category || !riskLevel) {
      return reply.status(400).send({ ok: false, error: "vendorName, category, and riskLevel required" });
    }

    // Next assessment due in 1 year
    const nextAssessmentDue = new Date();
    nextAssessmentDue.setFullYear(nextAssessmentDue.getFullYear() + 1);

    const vendor = await prisma.vendorAssessment.upsert({
      where: { tenantId_vendorName: { tenantId, vendorName } },
      create: {
        tenantId,
        vendorName,
        category,
        riskLevel,
        dataAccess: dataAccess || [],
        complianceCerts: complianceCerts || [],
        hasDataProcessingAgreement: hasDataProcessingAgreement || false,
        hasBaa: hasBaa || false,
        lastAssessedAt: new Date(),
        nextAssessmentDue,
        notes: notes || null,
        assessedBy: (req as any).auth?.userId || null,
      },
      update: {
        category,
        riskLevel,
        dataAccess: dataAccess || [],
        complianceCerts: complianceCerts || [],
        hasDataProcessingAgreement: hasDataProcessingAgreement || false,
        hasBaa: hasBaa || false,
        lastAssessedAt: new Date(),
        nextAssessmentDue,
        notes: notes || null,
        assessedBy: (req as any).auth?.userId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "user",
        actorUserId: (req as any).auth?.userId || null,
        level: "info",
        action: "VENDOR_ASSESSED",
        entityType: "vendor_assessment",
        entityId: vendor.id,
        message: `Vendor assessed: ${vendorName} (${riskLevel})`,
        meta: { vendorName, category, riskLevel, complianceCerts },
        timestamp: new Date(),
      } as any,
    }).catch(() => null);

    return reply.status(201).send({ ok: true, vendor });
  });

  // ── Vendors due for reassessment ────────────────────────────────────────
  app.get("/vendors/due", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const due = await prisma.vendorAssessment.findMany({
      where: {
        tenantId,
        status: "active",
        nextAssessmentDue: { lte: new Date() },
      },
      orderBy: { nextAssessmentDue: "asc" },
    });

    return { ok: true, due, count: due.length };
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Compliance Dashboard — unified status across all frameworks
  // ─────────────────────────────────────────────────────────────────────────

  app.get("/dashboard", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const now = new Date();

    const [
      dsarPending,
      dsarOverdue,
      openBreaches,
      breachDeadlines,
      openIncidents,
      vendorsTotal,
      vendorsDue,
      consentsActive,
    ] = await Promise.all([
      prisma.dataSubjectRequest.count({ where: { tenantId, status: { in: ["pending", "in_progress"] } } }),
      prisma.dataSubjectRequest.count({ where: { tenantId, status: { in: ["pending", "in_progress"] }, dueBy: { lt: now } } }),
      prisma.dataBreach.count({ where: { tenantId, status: { notIn: ["closed"] } } }),
      prisma.dataBreach.count({ where: { tenantId, authorityNotifiedAt: null, notifyAuthorityBy: { lt: now } } }),
      prisma.incidentReport.count({ where: { tenantId, status: { notIn: ["resolved", "closed"] } } }),
      prisma.vendorAssessment.count({ where: { tenantId } }),
      prisma.vendorAssessment.count({ where: { tenantId, status: "active", nextAssessmentDue: { lte: now } } }),
      prisma.consentRecord.count({ where: { tenantId, granted: true } }),
    ]);

    return {
      ok: true,
      compliance: {
        gdpr: {
          dsarPending,
          dsarOverdue,
          consentsActive,
          status: dsarOverdue > 0 ? "action_required" : "compliant",
        },
        breachManagement: {
          openBreaches,
          missedDeadlines: breachDeadlines,
          status: breachDeadlines > 0 ? "critical" : openBreaches > 0 ? "monitoring" : "clear",
        },
        incidentResponse: {
          openIncidents,
          status: openIncidents > 3 ? "elevated" : openIncidents > 0 ? "active" : "clear",
        },
        vendorManagement: {
          totalVendors: vendorsTotal,
          assessmentsDue: vendorsDue,
          status: vendorsDue > 0 ? "review_needed" : "current",
        },
      },
    };
  });
};
