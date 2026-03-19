---
title: "Data Privacy & Tenant Isolation"
category: "Security & Privacy"
tags: ["privacy", "data", "tenant isolation", "GDPR", "CCPA", "data retention", "multi-tenant"]
related:
  - security-privacy/how-we-protect-your-data
  - security-privacy/audit-trail
  - security-privacy/caller-data-handling
  - integrations/stripe-payments
---

# Data Privacy & Tenant Isolation

Your business data belongs to you. Atlas UX is built from the ground up with privacy and data separation as core architectural principles, not afterthoughts. Here is what we collect, how we use it, and how we keep your data completely separate from every other business on the platform.

## What Data We Collect

Atlas UX collects only the data needed to provide the service:

**Account data:**
- Your name, email address, and business name.
- Login credentials (hashed, never stored in plain text).
- Billing information (processed and stored by Stripe -- we never see your full card number). See [Stripe Payments](../integrations/stripe-payments.md).

**Business configuration:**
- Services you offer, business hours, and calendar preferences.
- Integration credentials (encrypted at rest with AES-256-GCM). See [How We Protect Your Data](how-we-protect-your-data.md).
- Lucy's persona settings, greeting scripts, and escalation phone numbers.

**Operational data:**
- Appointment bookings made by Lucy.
- SMS messages sent (content and delivery status).
- Call metadata (when a call started, duration, outcome).
- Social media posts and engagement data (via Postiz).
- Audit trail entries (every action logged). See [Audit Trail](audit-trail.md).

**Caller data:**
- Information provided by callers during conversations with Lucy (name, phone number, reason for calling, appointment details). See [Caller Data Handling](caller-data-handling.md) for full details.

## How Your Data Is Used

Your data is used exclusively to provide Atlas UX services to you:

- **To run Lucy** -- Answer calls, book appointments, send confirmations.
- **To display your dashboard** -- Show analytics, audit logs, and appointment history.
- **To improve service quality** -- Aggregate, anonymized usage patterns may be analyzed to improve the platform. Your individual business data is never shared with other customers or used for advertising.

We do not sell your data. We do not share your data with third parties except as necessary to provide the services you have connected (Twilio for calls, ElevenLabs for voice, etc.), and those services receive only the minimum data needed.

## Tenant Isolation

Atlas UX uses a **multi-tenant architecture with strict data isolation**. Here is what that means:

- Every table in our database includes a `tenant_id` field that ties each row to a specific business.
- Every database query is automatically scoped to your tenant. When you load your dashboard, you see only your data. It is architecturally impossible to accidentally load another business's information.
- The backend enforces tenant isolation at the plugin level -- before any route handler runs, the system extracts and validates your tenant identity from the request headers.
- API credentials, call logs, appointments, audit entries, and all other data are completely partitioned.

**In plain terms:** Your data lives in the same database as other customers, but it is separated by fences that are enforced at every level of the application. Think of it like separate safe deposit boxes in the same bank vault -- each one can only be opened with its own key.

## Data Retention

- **Active accounts:** Your data is retained for as long as your account is active.
- **After cancellation:** When you cancel your subscription, your data is retained for 30 days in case you change your mind. After that, it is scheduled for deletion.
- **Audit trail:** Audit entries are retained for the life of the account for compliance purposes. See [Audit Trail](audit-trail.md).
- **Backups:** Database backups are maintained on AWS for disaster recovery. Backup retention follows AWS Lightsail's managed database backup policy.

If you need your data deleted sooner, contact support. See [Getting Help](../troubleshooting/getting-help.md).

## GDPR and CCPA Readiness

Atlas UX is designed with regulatory compliance in mind:

**GDPR (EU General Data Protection Regulation):**
- You can request a copy of all data we hold about you (data portability).
- You can request deletion of your data (right to erasure).
- We process data only for the purposes described above (lawful basis).
- Tenant isolation ensures data minimization by design.

**CCPA (California Consumer Privacy Act):**
- We do not sell personal information.
- You can request to know what data we collect and how it is used.
- You can request deletion of your data.

To exercise any of these rights, contact support with "DATA REQUEST" in the subject line.

## Third-Party Data Processing

Atlas UX integrates with third-party services that may process some of your data:

| Service | Data Shared | Purpose |
|---|---|---|
| **Twilio** | Caller phone numbers, SMS content | Phone calls and text messages |
| **ElevenLabs** | Conversation context | Voice generation during calls |
| **Stripe** | Billing email, payment method | Subscription billing |
| **Postiz** | Social media content | Social media posting |
| **Google** | Calendar events | Appointment booking |

Each of these providers has their own privacy policy and data handling practices. We select providers that meet industry security standards.

## Questions?

If you have questions about how your data is handled, see [Getting Help](../troubleshooting/getting-help.md) or email our team with "PRIVACY" in the subject line.


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
