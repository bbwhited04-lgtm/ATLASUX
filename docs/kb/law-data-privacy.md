# Data Privacy Law

## Purpose
This document equips all Atlas UX agents — particularly Jenny (CLO), Larry (Auditor), and Atlas (CEO) — with comprehensive data privacy knowledge. Because Atlas UX processes user data, handles multi-tenant information, and operates AI agents that interact with personal data, privacy compliance is a foundational operational requirement.

---

## 1. General Data Protection Regulation (GDPR)

The EU's comprehensive data protection framework (Regulation 2016/679), effective May 25, 2018. Applies to: (a) organizations established in the EU, OR (b) organizations outside the EU that offer goods/services to EU data subjects or monitor their behavior. Extraterritorial reach makes it relevant to any SaaS platform with EU users.

### 1.1 Key Definitions
- **Personal data**: any information relating to an identified or identifiable natural person (name, email, IP address, location data, online identifiers, behavioral data).
- **Special category data**: racial/ethnic origin, political opinions, religious beliefs, genetic data, biometric data, health data, sex life/orientation. Requires explicit consent or another Article 9 basis.
- **Data controller**: determines the purposes and means of processing.
- **Data processor**: processes personal data on behalf of the controller.
- **Processing**: any operation performed on personal data (collection, recording, storage, retrieval, use, disclosure, erasure).

### 1.2 Lawful Bases for Processing (Article 6)
At least one must apply: (1) **Consent** — freely given, specific, informed, unambiguous; must be as easy to withdraw as to give. (2) **Contractual necessity** — processing necessary for performance of a contract with the data subject. (3) **Legal obligation** — processing necessary for compliance with EU/member state law. (4) **Vital interests** — necessary to protect life. (5) **Public interest/official authority**. (6) **Legitimate interests** — balancing test: controller's interests vs. data subject's rights; not available to public authorities.

### 1.3 Data Subject Rights (Articles 12-22)
- **Right of access** (Art. 15): obtain confirmation of processing and a copy of personal data.
- **Right to rectification** (Art. 16): correct inaccurate data.
- **Right to erasure / right to be forgotten** (Art. 17): deletion when data is no longer necessary, consent withdrawn, or processing is unlawful. Subject to exceptions (legal claims, public interest, legal obligations).
- **Right to restriction of processing** (Art. 18): limiting processing while accuracy is contested or processing is unlawful.
- **Right to data portability** (Art. 20): receive data in structured, commonly used, machine-readable format.
- **Right to object** (Art. 21): object to processing based on legitimate interests or direct marketing.
- **Right not to be subject to automated decision-making** (Art. 22): profiling that produces legal or similarly significant effects requires human involvement, right to contest, and meaningful information about the logic involved.

### 1.4 Data Protection Officer (DPO)
Required when: (a) processing is carried out by a public authority, (b) core activities involve regular and systematic monitoring of data subjects on a large scale, or (c) core activities involve large-scale processing of special category data. DPO must be independent, have expert knowledge, and report to the highest management level.

### 1.5 Cross-Border Transfers (Chapter V)
Personal data may only transfer outside the EU/EEA if: adequate protection exists at the destination (adequacy decision — currently includes UK, Japan, South Korea, Canada for commercial activities, US under the EU-US Data Privacy Framework), appropriate safeguards are implemented (Standard Contractual Clauses (SCCs), Binding Corporate Rules (BCRs), approved codes of conduct), or a derogation applies (explicit consent, contractual necessity, public interest).

### 1.6 Penalties
Up to 20 million euros or 4% of annual global turnover, whichever is greater (for the most serious violations). Lesser violations: up to 10 million euros or 2%. Data Protection Authorities (DPAs) have investigative and corrective powers.

---

## 2. California Consumer Privacy Act / California Privacy Rights Act (CCPA/CPRA)

The most comprehensive US state privacy law. CCPA effective January 1, 2020; CPRA amendments effective January 1, 2023. Applies to for-profit businesses that: (a) have gross annual revenues exceeding $25 million, (b) buy, sell, or share personal information of 100,000+ consumers/households, or (c) derive 50%+ of annual revenue from selling/sharing personal information.

### 2.1 Consumer Rights
- **Right to know**: what personal information is collected, used, and disclosed.
- **Right to delete**: request deletion of personal information (with exceptions).
- **Right to opt-out of sale/sharing**: "Do Not Sell or Share My Personal Information" link required.
- **Right to correct**: request correction of inaccurate personal information (CPRA).
- **Right to limit use of sensitive personal information** (CPRA).
- **Right to non-discrimination**: cannot deny goods/services or charge different prices for exercising rights.
- **Right to data portability**: receive data in a portable format.

### 2.2 Business Obligations
Privacy policy disclosing categories of data collected and purposes. Honoring opt-out requests. Verifying consumer requests. Service provider and contractor agreements with processing restrictions. Data minimization and purpose limitation (CPRA). Risk assessments for high-risk processing (CPRA). 12-month lookback period for disclosures.

### 2.3 Private Right of Action
Limited to data breaches involving unencrypted/unredacted personal information due to failure to implement reasonable security measures. Statutory damages: $100-$750 per consumer per incident, or actual damages. No private right of action for other CCPA violations (enforced by California AG and the California Privacy Protection Agency).

---

## 3. Other US Privacy Frameworks

### 3.1 HIPAA (Health Insurance Portability and Accountability Act)
Applies to covered entities (health plans, health care clearinghouses, providers conducting electronic transactions) and their business associates. Protects Protected Health Information (PHI). Privacy Rule governs use and disclosure. Security Rule requires administrative, physical, and technical safeguards. Breach Notification Rule requires notification to individuals, HHS, and (for breaches affecting 500+) media. Business Associate Agreements (BAAs) required. Not directly applicable to Atlas UX unless processing health data for covered entities.

### 3.2 COPPA (Children's Online Privacy Protection Act)
Applies to operators of websites/online services directed at children under 13, or with actual knowledge of collecting data from children under 13. Requires verifiable parental consent before collection. Must provide parental access and deletion rights. Must maintain reasonable data security. FTC enforces. Significant fines for violations (Epic Games: $275 million in 2022).

### 3.3 State Privacy Laws Landscape
As of 2026, comprehensive consumer privacy laws enacted in approximately 20 states:
- **Virginia (CDPA)**: effective Jan 2023. Consumer rights to access, correct, delete, data portability, opt-out. No private right of action.
- **Colorado (CPA)**: effective July 2023. Similar rights plus universal opt-out mechanism requirement.
- **Connecticut (CTDPA)**: effective July 2023. Broad definition of sale; loyalty program protections.
- **Utah (UCPA)**: effective Dec 2023. Business-friendly; narrower scope.
- **Texas (TDPSA)**: effective July 2024. Broad applicability (no revenue threshold).
- **Oregon, Montana, Delaware, Iowa, Tennessee, Indiana**: effective in 2024-2026 with variations.

Each law varies in: applicability thresholds, definition of "sale," opt-in vs. opt-out for sensitive data, private right of action availability, cure period, and enforcement mechanism.

---

## 4. Privacy by Design

Principles (Ann Cavoukian's 7 Foundational Principles, embedded in GDPR Article 25):
1. **Proactive not reactive**: anticipate and prevent privacy risks before they occur.
2. **Privacy as the default setting**: personal data automatically protected; no action required from the individual.
3. **Privacy embedded into design**: built into the architecture, not bolted on.
4. **Full functionality**: positive-sum, not zero-sum; privacy and functionality are not trade-offs.
5. **End-to-end security**: full lifecycle protection from collection to deletion.
6. **Visibility and transparency**: operations remain open to verification.
7. **Respect for user privacy**: keep the interests of the individual paramount.

Implementation: data minimization, purpose limitation, storage limitation, pseudonymization, encryption, access controls, regular privacy impact assessments.

---

## 5. Data Breach Notification

### 5.1 GDPR (Article 33-34)
Notify the supervisory authority within **72 hours** of becoming aware of a breach likely to result in a risk to rights and freedoms. Notify affected individuals "without undue delay" if high risk. Notification must include: nature of the breach, categories and approximate number affected, likely consequences, measures taken or proposed.

### 5.2 US State Laws
All 50 states, DC, and US territories have breach notification laws. Common elements: notification to affected individuals (typically within 30-60 days of discovery); notification to state AG (varies by threshold: some states require notice for any breach; others only if 500+ or 1,000+ residents affected); content requirements vary. Notable variations: California requires specific formatting; New York has broad "private information" definition; Florida requires notification within 30 days.

### 5.3 Federal Sector-Specific
HIPAA: notify individuals within 60 days, HHS annually (or within 60 days for breaches affecting 500+), media for breaches affecting 500+ in a state/jurisdiction. Banking regulators require notification within 36 hours (OCC, FDIC, Fed).

---

## 6. Privacy Impact Assessments (PIAs / DPIAs)

GDPR Article 35 requires a Data Protection Impact Assessment when processing is likely to result in a high risk to individuals. Mandatory for: systematic and extensive profiling with significant effects, large-scale processing of special category data, systematic monitoring of publicly accessible areas. The assessment must describe: processing operations and purposes, necessity and proportionality, risks to data subjects, measures to address risks.

---

## 7. Cookie Consent and Tracking

EU ePrivacy Directive (implemented through national laws): prior informed consent required for non-essential cookies. Essential cookies (strictly necessary for the service) are exempt. Consent must be freely given, specific, informed, and unambiguous. Pre-checked boxes do not constitute valid consent (Planet49, CJEU 2019). US: no federal cookie law, but CCPA/CPRA require disclosure and opt-out for cookies used for targeted advertising/sale/sharing.

---

## 8. International Data Transfers

### 8.1 EU-US Data Privacy Framework
Replaced Privacy Shield (invalidated by Schrems II, 2020). Adopted by the European Commission as an adequacy decision in July 2023. US organizations must self-certify with the Department of Commerce. Requirements: privacy principles, compliance mechanisms, access limitations for US intelligence. Agents should verify whether any US data recipient has certified before transferring EU personal data.

### 8.2 Standard Contractual Clauses (SCCs)
Pre-approved contractual terms for international transfers. New SCCs adopted June 2021 (four modules: controller-to-controller, controller-to-processor, processor-to-processor, processor-to-controller). Must conduct a Transfer Impact Assessment to evaluate destination country's legal framework. Supplementary measures may be required (encryption, pseudonymization, contractual commitments).

---

## 9. AI-Specific Privacy Considerations

- **Automated decision-making**: GDPR Article 22 right not to be subject to solely automated decisions with legal or significant effects. Requires human oversight, right to contest, meaningful information about logic.
- **Training data**: processing personal data to train AI models requires a lawful basis. Legitimate interests may apply but requires careful balancing. Data subjects may object.
- **Purpose limitation**: data collected for one purpose cannot be repurposed for AI training without compatible purpose or new legal basis.
- **Data minimization**: only process personal data that is necessary. Synthetic data and anonymization should be preferred where possible.
- **Transparency**: inform users when AI is making decisions that affect them. Explain the logic involved in a meaningful way.

---

## 10. Agent Privacy Compliance Protocol

### For All Agents
1. **Data minimization**: collect only the personal data necessary for the specific task. Never store personal data beyond retention periods.
2. **Purpose limitation**: use personal data only for the purpose it was collected. Do not repurpose without legal basis analysis.
3. **Consent management**: ensure valid consent exists before processing where consent is the legal basis. Respect opt-out requests immediately.
4. **Breach response**: any suspected data breach must trigger immediate notification to Jenny (CLO) and generate a decision_memo. Document the breach within the audit trail. Begin the 72-hour GDPR clock from the moment of awareness.
5. **Multi-tenant isolation**: NEVER access, process, or expose data across tenant boundaries. The tenant_id isolation is both an architectural and legal requirement.

### For Larry (Auditor)
1. Conduct quarterly privacy audits reviewing: data collection practices, retention compliance, consent records, cross-border transfer documentation, breach response readiness.
2. Verify data processing agreements are in place with all third-party processors.
3. Monitor the state privacy law landscape for new obligations.
4. Ensure audit logs themselves comply with privacy requirements (minimize personal data in log entries; apply retention limits).

---

## Key Statutes and Regulations Referenced
- GDPR (Regulation 2016/679), Articles 5-6, 9, 12-22, 25, 28, 33-35, 44-49
- CCPA (Cal. Civ. Code Section 1798.100 et seq.) as amended by CPRA (Proposition 24)
- HIPAA (42 U.S.C. Section 1320d et seq.; 45 CFR Parts 160, 164)
- COPPA (15 U.S.C. Section 6501 et seq.)
- Virginia CDPA (Va. Code Section 59.1-575 et seq.)
- Colorado CPA (C.R.S. Section 6-1-1301 et seq.)
- EU-US Data Privacy Framework (EC Adequacy Decision C(2023) 4745)
- Schrems II — Data Protection Commissioner v. Facebook Ireland, C-311/18, CJEU (2020)
- Planet49 GmbH, C-673/17, CJEU (2019)
- ESIGN Act, 15 U.S.C. Section 7001 (cross-reference for e-consent)
