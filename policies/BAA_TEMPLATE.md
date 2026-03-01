# HIPAA Business Associate Agreement — Template

**Document ID:** BAA-TEMPLATE-001
**Version:** 1.0
**Last Updated:** 2026-03-01
**Owner:** Billy E. Whited / DEAD APP CORP

---

> **IMPORTANT DISCLAIMER**
>
> This is a **template document** — it is not a signed or executed agreement. Atlas UX is **NOT currently HIPAA compliant**. No HIPAA Security Officer has been appointed, no PHI processing is active, and several mandatory Security Rule controls remain unimplemented (see `policies/HIPAA_COMPLIANCE.md`, Section 7). This template is prepared in anticipation of future HIPAA readiness and must be reviewed by qualified healthcare privacy counsel before execution.
>
> This document does not constitute legal advice. DEAD APP CORP recommends that both parties retain independent legal counsel before executing any BAA.

---

## BUSINESS ASSOCIATE AGREEMENT

This Business Associate Agreement ("Agreement" or "BAA") is entered into as of [EFFECTIVE DATE] ("Effective Date") by and between:

**Covered Entity:**
[COVERED ENTITY LEGAL NAME]
[ADDRESS LINE 1]
[ADDRESS LINE 2]
[CITY, STATE ZIP]
("Covered Entity")

**Business Associate:**
DEAD APP CORP, a Missouri closed corporation owned by THE DEAD APP CORP TRUST
[BUSINESS ADDRESS LINE 1]
[CITY, STATE ZIP]
Operating the Atlas UX platform at https://www.atlasux.cloud
("Business Associate" or "BA")

Collectively referred to as the "Parties" and individually as a "Party."

---

## ARTICLE I — DEFINITIONS

**1.1** Terms used but not otherwise defined in this Agreement shall have the meanings ascribed to them in the Health Insurance Portability and Accountability Act of 1996 ("HIPAA"), the Health Information Technology for Economic and Clinical Health Act of 2009 ("HITECH Act"), and their implementing regulations at 45 CFR Parts 160 and 164 (collectively, "HIPAA Rules"), as amended from time to time.

**1.2** The following definitions apply throughout this Agreement:

**(a) "Protected Health Information" or "PHI"** means individually identifiable health information, as defined in 45 CFR 160.103, that is created, received, maintained, or transmitted by Business Associate on behalf of Covered Entity. PHI includes information that relates to the past, present, or future physical or mental health condition of an individual; the provision of healthcare to an individual; or the past, present, or future payment for the provision of healthcare to an individual; and that identifies the individual or for which there is a reasonable basis to believe the information can be used to identify the individual.

**(b) "Electronic Protected Health Information" or "ePHI"** means PHI that is transmitted by or maintained in electronic media, as defined in 45 CFR 160.103. In the context of this Agreement, ePHI includes PHI stored in the Atlas UX platform's PostgreSQL database (hosted by Supabase), processed by Atlas UX backend services (hosted by Render), or transmitted via the Atlas UX API.

**(c) "Covered Entity"** means a health plan, healthcare clearinghouse, or healthcare provider who transmits any health information in electronic form in connection with a transaction covered by HIPAA, as defined in 45 CFR 160.103.

**(d) "Business Associate"** means DEAD APP CORP, operating the Atlas UX platform, which creates, receives, maintains, or transmits PHI on behalf of, or provides services to, the Covered Entity that involve the use or disclosure of PHI, as defined in 45 CFR 160.103.

**(e) "Security Incident"** means the attempted or successful unauthorized access, use, disclosure, modification, or destruction of information or interference with system operations in an information system, as defined in 45 CFR 164.304. For the purposes of this Agreement, Security Incidents include but are not limited to: unauthorized access to tenant data in the Atlas UX database, compromise of JWT authentication tokens, failure of tenant isolation (Row-Level Security bypass), unauthorized API access, and exfiltration of data from the platform.

**(f) "Breach"** means the acquisition, access, use, or disclosure of PHI in a manner not permitted under the HIPAA Privacy Rule that compromises the security or privacy of the PHI, as defined in 45 CFR 164.402. A Breach is presumed unless the Business Associate demonstrates that there is a low probability that the PHI has been compromised, based on the four-factor risk assessment set forth in 45 CFR 164.402(2).

**(g) "Individual"** means the person who is the subject of the PHI, as defined in 45 CFR 160.103, and includes a person who qualifies as a personal representative under 45 CFR 164.502(g).

**(h) "Required by Law"** means a mandate contained in law that compels an entity to make a use or disclosure of PHI and that is enforceable in a court of law, as defined in 45 CFR 164.103.

**(i) "Secretary"** means the Secretary of the United States Department of Health and Human Services ("HHS") or any officer or employee of HHS to whom the authority involved has been delegated.

**(j) "Subcontractor"** means a person or entity to whom Business Associate delegates a function, activity, or service, other than in the capacity of a member of Business Associate's workforce.

**(k) "Designated Record Set"** means a group of records maintained by or for a Covered Entity that includes the medical records and billing records about individuals maintained by or for a covered healthcare provider, as defined in 45 CFR 164.501.

**(l) "Minimum Necessary Standard"** means the principle under 45 CFR 164.502(b) that, when using or disclosing PHI or when requesting PHI from another covered entity or business associate, a covered entity or business associate must make reasonable efforts to limit PHI to the minimum necessary to accomplish the intended purpose.

**(m) "Platform"** means the Atlas UX software-as-a-service application, including its frontend (hosted on Vercel), backend API services and worker processes (hosted on Render), database (hosted on Supabase), and any associated infrastructure used to provide services to the Covered Entity.

---

## ARTICLE II — PERMITTED USES AND DISCLOSURES

**2.1 Scope of Services.** Business Associate is permitted to use and disclose PHI solely to perform the services described in the underlying service agreement between the Parties (the "Service Agreement"), which may include:

- **(a)** Processing and storing data entered by Covered Entity into the Atlas UX platform, including CRM contact records, knowledge base documents, communications (email, messaging), and agent-processed content;
- **(b)** Providing AI agent services that analyze, organize, or act upon data on behalf of the Covered Entity's authorized users;
- **(c)** Maintaining audit logs of system activity for compliance and security purposes;
- **(d)** Providing data export, reporting, and analytics functions as part of the Platform's capabilities.

**2.2 Minimum Necessary Standard.** Business Associate shall limit its use, disclosure, and requests for PHI to the minimum necessary to accomplish the intended purpose of the use, disclosure, or request, in accordance with 45 CFR 164.502(b) and 164.514(d). Business Associate shall implement policies and procedures to identify the persons or classes of persons within its workforce who need access to PHI, the categories of PHI to which access is needed, and conditions appropriate to such access.

**2.3 Prohibited Uses and Disclosures.** Business Associate shall not use or disclose PHI except as permitted or required by this Agreement or as Required by Law. Without limiting the foregoing, Business Associate shall not:

- **(a)** Use or disclose PHI for marketing purposes without prior written authorization from the Covered Entity and the Individual, as required by 45 CFR 164.508(a)(3);
- **(b)** Sell PHI, as defined in 45 CFR 164.502(a)(5)(ii), without valid authorization from the Individual;
- **(c)** Use or disclose PHI in a manner that would violate Subpart E of 45 CFR Part 164 (the Privacy Rule) if done by Covered Entity, except as permitted under Sections 2.1 and 2.5 of this Agreement;
- **(d)** Use or disclose PHI for the purpose of training artificial intelligence or machine learning models, except where such use is strictly necessary to provide the contracted services to the Covered Entity and the PHI is not retained after processing beyond the minimum necessary for the immediate service request;
- **(e)** Aggregate PHI received from the Covered Entity with PHI of other customers or tenants for any purpose.

**2.4 Uses for Business Associate's Operations.** Business Associate may use PHI received from Covered Entity for Business Associate's proper management and administration or to carry out its legal responsibilities, provided that:

- **(a)** Such uses are necessary for the proper management and administration of the Business Associate; and
- **(b)** Business Associate obtains reasonable assurances from any person or entity to whom it discloses PHI for such purposes that the information will be held confidentially and used or further disclosed only as Required by Law or for the purposes for which it was disclosed, and that the recipient will notify Business Associate of any instances of which it becomes aware in which the confidentiality of the information has been compromised.

**2.5 Disclosure Required by Law.** Business Associate may disclose PHI as Required by Law, provided that Business Associate shall notify Covered Entity of any such required disclosure promptly and in any event no later than [NUMBER] business days after receiving the request or legal mandate, unless such notification is prohibited by law.

**2.6 De-identification.** Business Associate may de-identify PHI in accordance with 45 CFR 164.514(a)-(c). Once information is properly de-identified under either the expert determination method (164.514(b)) or the safe harbor method (164.514(b)(2)), it is no longer PHI and is not subject to the restrictions of this Agreement.

---

## ARTICLE III — SAFEGUARDS

**3.1 General Obligation.** Business Associate shall use appropriate administrative, technical, and physical safeguards to prevent the use or disclosure of PHI other than as provided for by this Agreement, and shall comply with the requirements of Subpart C of 45 CFR Part 164 (the Security Rule) with respect to ePHI, in accordance with 45 CFR 164.314(a)(2)(i) and 164.504(e)(2)(ii)(B).

**3.2 Technical Safeguards.** Business Associate shall implement and maintain the following technical safeguards for ePHI processed through the Platform:

**(a) Encryption at Rest.** All ePHI stored in the Platform's database shall be encrypted at rest. The database hosting provider (Supabase) provides disk-level encryption for PostgreSQL instances. Sensitive credential fields (OAuth tokens, API keys) are encrypted using AES-256-GCM via the application-layer token store (`backend/src/lib/tokenStore.ts`). Business Associate shall ensure that encryption keys are managed in accordance with industry best practices and are not stored alongside the encrypted data.

**(b) Encryption in Transit.** All ePHI transmitted between the Covered Entity's users and the Platform shall be encrypted using Transport Layer Security (TLS) 1.2 or higher. The backend hosting provider (Render) terminates TLS for all inbound HTTPS connections. The Platform enforces HTTP Strict Transport Security (HSTS) headers via security middleware (`@fastify/helmet`). Business Associate shall not transmit ePHI over unencrypted channels.

**(c) Audit Logging.** The Platform maintains comprehensive audit logs of all API requests and data mutations. The audit logging system (`backend/src/plugins/auditPlugin.ts`) records: HTTP method, URL, response status code, actor user ID, IP address, user agent, and request identifier for every API interaction. Compliance-specific operations (breach reports, DSAR processing, consent changes, vendor assessments) are logged with specific action codes. [When implemented: Audit logs shall be hash-chained using SHA-256 to provide tamper-evident integrity verification, verifiable via `GET /v1/compliance/audit/verify`.]

**(d) Tenant Isolation.** The Platform implements multi-tenant data isolation at both the application layer and database layer:

- **Application Layer:** The tenant isolation plugin (`backend/src/plugins/tenantPlugin.ts`) extracts the tenant identifier from request headers, validates UUID format, and verifies the requesting user's membership in the tenant organization. Non-member requests are rejected with HTTP 403.
- **Database Layer:** Row-Level Security (RLS) policies are applied to database tables containing tenant data. RLS policies restrict data access based on the current tenant session variable, ensuring that database queries return only data belonging to the authenticated tenant.

**(e) Access Controls.** The Platform implements access controls as follows:

- **Authentication:** Per-user authentication via Supabase Auth, which issues JSON Web Tokens (JWTs). The authentication plugin (`backend/src/plugins/authPlugin.ts`) validates bearer tokens on every API request by verifying the token with the identity provider. Invalid or missing tokens result in HTTP 401 rejection.
- **Authorization:** Role-based access control via tenant membership roles (e.g., `owner`). API usage is metered per user.
- **Session Management:** [When implemented: The Platform shall maintain a token revocation mechanism enabling server-side invalidation of compromised sessions.]

**(f) Unique User Identification.** Each user of the Platform is assigned a unique identifier upon authentication. All audit log entries are attributed to the specific authenticated user who performed the action.

**3.3 Administrative Safeguards.** Business Associate shall implement and maintain the following administrative safeguards:

- **(a)** Designate a HIPAA Security Officer responsible for the development and implementation of the policies and procedures required by the HIPAA Security Rule, as required by 45 CFR 164.308(a)(2). The current Security Officer is: [SECURITY OFFICER NAME, TITLE, CONTACT EMAIL].
- **(b)** Implement workforce security procedures, including background checks (where permitted by law) and termination procedures that revoke access to ePHI upon employment termination.
- **(c)** Conduct and document a comprehensive risk analysis at least annually, identifying potential risks and vulnerabilities to the confidentiality, integrity, and availability of ePHI, as required by 45 CFR 164.308(a)(1)(ii)(A).
- **(d)** Implement a security awareness and training program for all workforce members with access to ePHI, as required by 45 CFR 164.308(a)(5).
- **(e)** Implement a sanction policy for workforce members who violate security policies, as required by 45 CFR 164.308(a)(1)(ii)(C).

**3.4 Physical Safeguards.** The Platform is entirely cloud-hosted. Physical safeguards for servers, storage media, and data center facilities are delegated to the cloud infrastructure providers:

| Provider | Service | Certifications |
|---|---|---|
| Supabase | PostgreSQL database, authentication, file storage | SOC 2 Type II |
| Render | Backend API hosting, worker processes, TLS termination | SOC 2 Type II |
| Vercel | Frontend static hosting | SOC 2 Type II |

Business Associate shall ensure that each cloud infrastructure provider maintains appropriate physical safeguards and provides documentation of such safeguards upon request by the Covered Entity.

---

## ARTICLE IV — BREACH NOTIFICATION

**4.1 Discovery and Notification.** Following the discovery of a Breach of Unsecured PHI, Business Associate shall notify the Covered Entity without unreasonable delay and in no event later than **sixty (60) calendar days** after discovery of the Breach, as required by 45 CFR 164.410. A Breach shall be treated as discovered by Business Associate as of the first day on which such Breach is known to the Business Associate or, by exercising reasonable diligence, would have been known to the Business Associate. Business Associate shall be deemed to have knowledge of a Breach if the Breach is known, or by exercising reasonable diligence would have been known, to any person (other than the person committing the Breach) who is an employee, officer, or other agent of the Business Associate.

**4.2 Content of Notification.** The Breach notification to Covered Entity shall include, to the extent possible and as information becomes available:

- **(a)** The identification of each Individual whose Unsecured PHI has been, or is reasonably believed by the Business Associate to have been, accessed, acquired, used, or disclosed during the Breach;
- **(b)** A description of the nature of the Breach, including the types of Unsecured PHI involved (e.g., full name, Social Security number, date of birth, diagnosis, treatment information);
- **(c)** The date of the Breach and the date of its discovery;
- **(d)** A description of what the Business Associate is doing to investigate the Breach, mitigate harm to Individuals, and protect against further Breaches;
- **(e)** Contact information for the Business Associate, including a name, telephone number, and email address for the individual managing the Breach response;
- **(f)** Any other information the Covered Entity is required to include in notification to Individuals under 45 CFR 164.404(c).

**4.3 Risk Assessment.** Business Associate shall conduct a risk assessment following any potential Breach, evaluating at minimum the four factors specified in 45 CFR 164.402(2):

- **(a)** The nature and extent of the PHI involved, including the types of identifiers and the likelihood of re-identification;
- **(b)** The unauthorized person who used the PHI or to whom the disclosure was made;
- **(c)** Whether the PHI was actually acquired or viewed; and
- **(d)** The extent to which the risk to the PHI has been mitigated.

Business Associate shall document the risk assessment and provide a copy to the Covered Entity upon request.

**4.4 Cooperation.** Business Associate shall cooperate with the Covered Entity in the Covered Entity's obligations to notify affected Individuals and the Secretary of HHS, including providing information necessary for the notifications required by 45 CFR 164.404 (notification to individuals), 164.406 (notification to media), and 164.408 (notification to the Secretary).

**4.5 Security Incident Reporting.** Business Associate shall report to the Covered Entity any Security Incident of which it becomes aware. For unsuccessful Security Incidents (e.g., failed login attempts, port scans, unsuccessful attempts to access data), Business Associate shall provide a summary report on a [MONTHLY/QUARTERLY] basis. For successful Security Incidents, Business Associate shall notify the Covered Entity within [NUMBER] business days of discovery.

**4.6 Breach Register.** Business Associate maintains a programmatic breach register via the Platform's compliance system (`POST/GET/PATCH /v1/compliance/breaches`). The breach register tracks: severity classification, breach status, data types affected, number of individuals affected, detection and containment timestamps, notification deadlines, root cause, and remediation steps. The Covered Entity may request access to breach register entries pertaining to its tenant data at any time.

**4.7 Preservation of Evidence.** In the event of a Breach or Security Incident, Business Associate shall preserve all relevant evidence, including audit logs, system logs, access records, and forensic data, for a minimum of **six (6) years** or such longer period as required by applicable law or as necessary for any related investigation or litigation.

---

## ARTICLE V — SUBCONTRACTOR REQUIREMENTS

**5.1 Subcontractor Obligations.** In accordance with 45 CFR 164.502(e)(1)(ii) and 164.308(b)(2), Business Associate shall ensure that any Subcontractor that creates, receives, maintains, or transmits PHI on behalf of the Business Associate agrees to the same restrictions, conditions, and requirements that apply to the Business Associate under this Agreement with respect to such PHI.

**5.2 Written Agreements.** Business Associate shall enter into a written agreement with each Subcontractor that handles PHI, imposing at minimum the same obligations regarding the use, disclosure, and safeguarding of PHI as are imposed on the Business Associate under this Agreement. Business Associate shall ensure that each such agreement complies with 45 CFR 164.314(a)(2)(i) and 164.504(e)(2)-(5).

**5.3 Current Subcontractors.** As of the Effective Date, the following Subcontractors may create, receive, maintain, or transmit PHI in connection with the services provided under this Agreement:

| Subcontractor | Service | Data Access | BAA Status |
|---|---|---|---|
| Supabase, Inc. | PostgreSQL database hosting, authentication, file storage | ePHI at rest, authentication tokens | [EXECUTED / PENDING / NOT AVAILABLE] |
| Render Services, Inc. | Backend API hosting, worker process hosting, TLS termination | ePHI in transit, ePHI in processing memory | [EXECUTED / PENDING / NOT AVAILABLE] |
| Vercel, Inc. | Frontend static hosting | No PHI access (static assets only) | [N/A — no PHI access] |
| OpenAI, Inc. | AI inference API | ePHI submitted for AI processing (via API, no training) | [EXECUTED / PENDING / NOT AVAILABLE] |
| Stripe, Inc. | Payment processing | No PHI access (payment data only) | [N/A — no PHI access] |
| [ADDITIONAL SUBCONTRACTOR NAME] | [SERVICE DESCRIPTION] | [DATA ACCESS DESCRIPTION] | [STATUS] |

**5.4 Changes to Subcontractors.** Business Associate shall notify the Covered Entity in writing at least **thirty (30) days** prior to engaging any new Subcontractor that will create, receive, maintain, or transmit PHI. The notification shall include the identity of the Subcontractor, the services to be performed, and the categories of PHI to which the Subcontractor will have access. If the Covered Entity objects to the new Subcontractor, the Parties shall negotiate in good faith to resolve the objection.

**5.5 Subcontractor Compliance Monitoring.** Business Associate shall monitor the compliance of its Subcontractors with the terms of their respective agreements. Business Associate tracks Subcontractor compliance status, certifications, and BAA/DPA status via its vendor assessment system (`POST/GET /v1/compliance/vendors`). The Covered Entity may request a summary of Subcontractor compliance status at any time.

**5.6 Liability.** Business Associate shall be directly liable for the acts or omissions of its Subcontractors to the same extent as if Business Associate had committed the act or omission itself, to the extent required by the HIPAA Rules.

---

## ARTICLE VI — INDIVIDUAL RIGHTS

**6.1 Right of Access.** Business Associate shall make PHI maintained in a Designated Record Set available to the Covered Entity within **fifteen (15) business days** of a request from the Covered Entity, to enable the Covered Entity to fulfill its obligations under 45 CFR 164.524 to provide Individuals with access to their PHI. Business Associate shall provide the PHI in the form and format requested by the Covered Entity, if readily producible in such form and format, or in a readable hard copy form or such other form as agreed to by the Covered Entity. The Platform supports data export via `GET /v1/compliance/dsar/:email/export`.

**6.2 Right of Amendment.** Business Associate shall make PHI maintained in a Designated Record Set available to the Covered Entity for amendment within **fifteen (15) business days** of a request from the Covered Entity, and shall incorporate any amendments to PHI as directed by the Covered Entity, in order to enable the Covered Entity to fulfill its obligations under 45 CFR 164.526.

**6.3 Accounting of Disclosures.** Business Associate shall document and make available to the Covered Entity information required for the Covered Entity to provide an accounting of disclosures of PHI in accordance with 45 CFR 164.528. Business Associate shall maintain a record of each disclosure of PHI made to third parties (other than disclosures for treatment, payment, or healthcare operations, or disclosures authorized by the Individual) for a period of **six (6) years** from the date of the disclosure. Such records shall include: the date of the disclosure, the name and address of the recipient, a description of the PHI disclosed, and the purpose of the disclosure. The Platform's audit logging system records all API-level data access events and can be queried to produce accounting records.

**6.4 Restriction Requests.** Business Associate shall accommodate reasonable requests by the Covered Entity to restrict uses or disclosures of PHI, provided that such restrictions do not prevent Business Associate from performing its obligations under the Service Agreement. If Business Associate agrees to a restriction, Business Associate shall not use or disclose the PHI in violation of such restriction, except as Required by Law or in an emergency.

**6.5 Confidential Communications.** Business Associate shall accommodate reasonable requests by the Covered Entity to receive communications of PHI by alternative means or at alternative locations, to the extent that such accommodation is feasible and does not impose undue burden on Business Associate.

**6.6 DSAR Support.** The Platform includes a Data Subject Access Request (DSAR) management system (`POST/GET/PATCH /v1/compliance/dsar`) that tracks request lifecycle, supports data portability (export), and supports the right to erasure (`DELETE /v1/compliance/dsar/:email/erase`). Business Associate shall use this system to process Individual rights requests received from or through the Covered Entity.

---

## ARTICLE VII — RETURN OR DESTRUCTION OF PHI

**7.1 Upon Termination.** Upon termination of this Agreement for any reason, Business Associate shall, at the direction of the Covered Entity, either return or destroy all PHI received from the Covered Entity, or created or received by the Business Associate on behalf of the Covered Entity, within **thirty (30) calendar days** of the effective date of termination. This obligation includes PHI in the possession of Subcontractors of the Business Associate.

**7.2 Method of Destruction.** If the Covered Entity directs destruction, Business Associate shall destroy the PHI in a manner that renders it unreadable, indecipherable, and otherwise unable to be reconstructed, in accordance with the guidance issued by HHS regarding the destruction of PHI (as referenced in 45 CFR 164.402(2)(ii) and NIST Special Publication 800-88). For ePHI, acceptable methods include:

- **(a)** Cryptographic erasure (destruction of encryption keys rendering encrypted data irrecoverable);
- **(b)** Secure deletion from database records with verification that backup copies are also purged;
- **(c)** Certification from Subcontractors (Supabase, Render) that PHI has been destroyed from their systems.

**7.3 Method of Return.** If the Covered Entity directs return, Business Associate shall provide the PHI in a mutually agreed-upon format (e.g., encrypted archive, structured data export via the Platform's data export functionality, or secure file transfer). Business Associate shall confirm destruction of all retained copies after return is complete.

**7.4 Infeasibility Exception.** If Business Associate determines that the return or destruction of PHI is infeasible (e.g., PHI is embedded in backup archives maintained by Subcontractors with retention policies that prevent selective deletion), Business Associate shall:

- **(a)** Notify the Covered Entity in writing, explaining the specific reasons why return or destruction is infeasible;
- **(b)** Extend the protections of this Agreement to the retained PHI for as long as the PHI is retained;
- **(c)** Limit further uses and disclosures of the retained PHI to those purposes that make the return or destruction infeasible; and
- **(d)** Return or destroy the PHI when it becomes feasible to do so.

**7.5 Certification.** Upon completion of the return or destruction of PHI, Business Associate shall provide the Covered Entity with a written certification, signed by an authorized officer of Business Associate, confirming that all PHI has been returned or destroyed in accordance with this Article, or that the infeasibility exception in Section 7.4 applies with respect to specifically identified PHI.

**7.6 Survival.** The obligations of Business Associate under this Article VII shall survive the termination of this Agreement.

---

## ARTICLE VIII — TERM AND TERMINATION

**8.1 Term.** This Agreement shall be effective as of the Effective Date and shall continue in effect until the earlier of:

- **(a)** The date on which the Service Agreement between the Parties terminates or expires;
- **(b)** The date on which this Agreement is terminated in accordance with Section 8.2 or 8.3; or
- **(c)** [EXPIRATION DATE], unless renewed by mutual written agreement of the Parties.

**8.2 Termination for Material Breach.** Either Party may terminate this Agreement if the other Party materially breaches any provision of this Agreement and such breach is not cured within **thirty (30) calendar days** after written notice of the breach is provided to the breaching Party. The notice shall specify the nature of the breach and the actions required to cure it. If the breach is not susceptible to cure, the non-breaching Party may terminate this Agreement immediately upon written notice.

**8.3 Termination for Cause — Compliance Failure.** If Business Associate fails to comply with a material term of this Agreement and cure is not feasible, the Covered Entity may, at its sole discretion:

- **(a)** Immediately terminate this Agreement and the Service Agreement; or
- **(b)** If termination is not feasible, report the problem to the Secretary of HHS in accordance with 45 CFR 164.504(e)(1)(ii).

**8.4 Automatic Termination.** This Agreement shall automatically terminate without notice upon the dissolution of either Party, or upon a finding by a court of competent jurisdiction or HHS that Business Associate has engaged in a pattern of activity or practice that constitutes a material breach or violation of this Agreement or the HIPAA Rules.

**8.5 Effect of Termination.** Upon termination of this Agreement:

- **(a)** Business Associate shall comply with the return or destruction obligations in Article VII;
- **(b)** All rights of Business Associate to use or disclose PHI shall cease, except as provided in Section 7.4 (infeasibility exception);
- **(c)** Articles IV (Breach Notification), VI (Individual Rights, with respect to retained PHI), VII (Return/Destruction), and this Section 8.5 shall survive termination.

**8.6 No Termination Fee for Compliance-Based Termination.** No early termination fees or penalties under the Service Agreement shall apply when termination is made pursuant to Sections 8.2 or 8.3 of this Agreement due to a HIPAA compliance failure.

---

## ARTICLE IX — GENERAL PROVISIONS

**9.1 Regulatory References.** Any reference in this Agreement to a section of the HIPAA Rules means the section as in effect or as amended from time to time, and any successor provisions to such section.

**9.2 Amendment.** The Parties agree to take such action as is necessary to amend this Agreement from time to time to comply with the requirements of the HIPAA Rules and any other applicable law. No amendment to this Agreement shall be effective unless in writing and signed by both Parties. If either Party believes in good faith that any provision of this Agreement fails to comply with the then-current requirements of the HIPAA Rules, that Party shall promptly notify the other Party in writing, and the Parties shall address the identified issue in good faith and amend this Agreement as necessary.

**9.3 Interpretation.** Any ambiguity in this Agreement shall be resolved to permit compliance with the HIPAA Rules. In the event of a conflict between the terms of this Agreement and the HIPAA Rules, the HIPAA Rules shall control.

**9.4 No Third-Party Beneficiaries.** Nothing in this Agreement shall confer upon any person other than the Parties and their respective successors and assigns any rights, remedies, obligations, or liabilities whatsoever. Individuals whose PHI is subject to this Agreement are not intended third-party beneficiaries of this Agreement.

**9.5 Indemnification.** Business Associate shall indemnify, defend, and hold harmless the Covered Entity from and against any and all claims, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or in connection with any breach of this Agreement by Business Associate or its Subcontractors, including any Breach of Unsecured PHI caused by the acts or omissions of Business Associate or its Subcontractors.

**9.6 Limitation of Liability.** [THE PARTIES SHOULD NEGOTIATE AND INSERT APPROPRIATE LIMITATION OF LIABILITY PROVISIONS. NOTE: HIPAA DOES NOT REQUIRE OR PROHIBIT LIMITATIONS OF LIABILITY IN A BAA, BUT SUCH PROVISIONS SHOULD BE CAREFULLY DRAFTED TO ENSURE THEY DO NOT UNDERMINE THE PROTECTIONS REQUIRED BY THE HIPAA RULES.]

**9.7 Governing Law.** This Agreement shall be governed by and construed in accordance with federal law, including the HIPAA Rules. To the extent that state law applies, this Agreement shall be governed by the laws of the State of [STATE], without regard to its conflict of laws provisions.

**9.8 Notices.** All notices required or permitted under this Agreement shall be in writing and shall be delivered by hand, by overnight courier, by certified mail (return receipt requested), or by email with confirmed receipt, to the addresses set forth below:

**To Covered Entity:**
[CONTACT NAME]
[TITLE]
[EMAIL ADDRESS]
[MAILING ADDRESS]

**To Business Associate:**
Billy E. Whited
Owner, DEAD APP CORP
[EMAIL ADDRESS]
[MAILING ADDRESS]

Either Party may change its notice address by providing written notice to the other Party in accordance with this Section.

**9.9 Entire Agreement.** This Agreement, together with the Service Agreement, constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements, representations, and understandings, whether written or oral, relating to the subject matter of this Agreement.

**9.10 Severability.** If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect, and the invalid or unenforceable provision shall be modified to the minimum extent necessary to make it valid and enforceable.

**9.11 Waiver.** The failure of either Party to enforce any provision of this Agreement shall not constitute a waiver of that Party's right to enforce that provision or any other provision in the future.

**9.12 Counterparts.** This Agreement may be executed in counterparts, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument. Electronic signatures shall be deemed original signatures for all purposes.

---

## SIGNATURES

**COVERED ENTITY:**

Signature: ____________________________________

Print Name: [AUTHORIZED REPRESENTATIVE NAME]

Title: [TITLE]

Date: ____________________________________

**BUSINESS ASSOCIATE:**

Signature: ____________________________________

Print Name: Billy E. Whited

Title: Owner, DEAD APP CORP

Date: ____________________________________

---

## EXHIBIT A — DESCRIPTION OF SERVICES

[DESCRIBE THE SPECIFIC SERVICES BUSINESS ASSOCIATE PROVIDES TO COVERED ENTITY UNDER THE SERVICE AGREEMENT. INCLUDE:

1. Description of the Atlas UX services to be used by the Covered Entity
2. Categories of PHI that may be created, received, maintained, or transmitted
3. Specific Atlas UX features and modules the Covered Entity will use
4. Any restrictions on which Platform features may process PHI
5. Duration of PHI processing
6. Data residency requirements, if any]

---

## EXHIBIT B — TECHNICAL SAFEGUARDS SUMMARY

The following is a summary of technical safeguards implemented in the Atlas UX Platform as of the Effective Date. This exhibit is informational and does not limit Business Associate's obligations under Article III.

| Control Category | Implementation | Verification |
|---|---|---|
| Authentication | Per-user JWT via Supabase Auth | `backend/src/plugins/authPlugin.ts` |
| Tenant Isolation (App) | Tenant membership verification on every request | `backend/src/plugins/tenantPlugin.ts` |
| Tenant Isolation (DB) | PostgreSQL Row-Level Security policies | `backend/prisma/migrations/20260228120000_rls_policies/` |
| Audit Logging | All HTTP requests logged with actor attribution | `backend/src/plugins/auditPlugin.ts` |
| Encryption at Rest | AES-256-GCM (application), disk encryption (Supabase) | `backend/src/lib/tokenStore.ts` |
| Encryption in Transit | TLS 1.2+ (Render), HSTS headers | `backend/src/server.ts` |
| Input Sanitization | HTML tag stripping to prevent stored XSS | `backend/src/lib/sanitize.ts` |
| Rate Limiting | Per-IP and per-tenant request throttling | `backend/src/server.ts`, `backend/src/plugins/tenantRateLimit.ts` |
| CORS | Origin allowlist restricted to `atlasux.cloud` | `backend/src/server.ts` |
| CSRF Protection | DB-backed synchronizer token | `backend/src/plugins/csrfPlugin.ts` |
| Breach Management | Programmatic breach register with deadline tracking | `POST/GET /v1/compliance/breaches` |
| DSAR Processing | Create, process, export, erase lifecycle | `POST/GET /v1/compliance/dsar` |
| Vendor Tracking | Subcontractor risk assessment with BAA tracking | `POST/GET /v1/compliance/vendors` |

---

## EXHIBIT C — SUBCONTRACTOR LIST

[TO BE COMPLETED AT TIME OF EXECUTION. REFERENCE SECTION 5.3 FOR THE CURRENT LIST OF SUBCONTRACTORS AND THEIR BAA STATUS.]

---

*Template prepared by DEAD APP CORP. Version 1.0 — 2026-03-01.*
*This template must be reviewed by qualified healthcare privacy counsel before execution.*
