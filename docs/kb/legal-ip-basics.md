# Legal & IP Basics for AI Companies

Reference document for Jenny (Legal) and Benny (IP) when advising on compliance, intellectual property, content licensing, and platform requirements. This is practical guidance, not legal advice — always recommend consultation with a licensed attorney for binding decisions.

---

## Terms of Service Essentials

Every SaaS product needs a Terms of Service (ToS) agreement. Jenny should verify that the following elements are present and current.

### Required Sections

1. **Acceptance of Terms:** How users agree (clicking "I Agree," continued use, account creation). Must be affirmative — passive acceptance is legally weak.

2. **Service Description:** What the product does and does not do. Be specific about AI-generated outputs: they are assistance, not professional advice (legal, financial, medical).

3. **User Obligations:** What users must and must not do. Prohibited activities: abuse, reverse engineering, using the service for illegal purposes, exceeding rate limits.

4. **Payment Terms:** Pricing, billing cycles, refund policy, what happens on non-payment. For SaaS: clearly state that subscription auto-renews unless cancelled.

5. **Intellectual Property:** Who owns what. The company owns the platform. Users own their data. AI-generated content ownership is addressed separately (see below).

6. **Limitation of Liability:** Cap liability to fees paid in the prior 12 months. Disclaim consequential, incidental, and punitive damages. This is the most legally important section.

7. **Termination:** How either party can end the relationship. What happens to user data on termination (export period, deletion timeline).

8. **Dispute Resolution:** Governing law (which state/country), arbitration vs. court, class action waiver if applicable.

9. **Modifications:** How the company updates the ToS. Best practice: 30-day notice for material changes with option to cancel.

### Common Mistakes

- Using a template without customizing to the actual product.
- Failing to address AI-specific issues (output accuracy, content ownership).
- Not including a limitation of liability clause.
- Making the ToS so aggressive that it scares away business customers.

---

## Privacy Policy Requirements

Privacy policies are legally required in most jurisdictions. Jenny should audit the privacy policy against these requirements.

### Information to Disclose

1. **What data is collected:** Be exhaustive. Name, email, usage data, cookies, device information, AI conversation logs.
2. **How data is used:** Each purpose for each data type. Marketing, service improvement, analytics, AI training (if applicable).
3. **Who data is shared with:** Third-party services, analytics providers, payment processors. Name them or categorize them.
4. **How data is stored and protected:** Encryption at rest and in transit, access controls, data retention periods.
5. **User rights:** Access, correction, deletion, portability, objection to processing.
6. **Cookie policy:** What cookies are used, what they do, how to opt out.
7. **Children's data:** COPPA compliance if users could be under 13. Best practice: state that the service is not intended for children under 13.
8. **International transfers:** If data crosses borders, disclose it and state the legal basis.

### Jurisdiction-Specific Requirements

**GDPR (EU/EEA):**
- Legal basis for processing must be stated (consent, legitimate interest, contractual necessity).
- Data Protection Officer designation if processing at scale.
- 72-hour breach notification requirement.
- Right to erasure ("right to be forgotten").
- Data portability in machine-readable format.

**CCPA/CPRA (California):**
- "Do Not Sell My Personal Information" link required if applicable.
- Right to know what data is collected and why.
- Right to delete personal information.
- Right to opt out of sale/sharing of personal information.
- Must disclose categories of data sold/shared in prior 12 months.

**Other:**
- PIPEDA (Canada), LGPD (Brazil), POPIA (South Africa) — similar frameworks with local variations. Jenny should flag when a customer base extends into these jurisdictions.

---

## DMCA Process

The Digital Millennium Copyright Act provides safe harbor for platforms that host user content, but only if the process is followed correctly.

### Requirements for Safe Harbor

1. **Designated DMCA Agent:** Register with the U.S. Copyright Office. Include agent contact info in the ToS and Privacy Policy.
2. **Takedown Procedure:** Accept and process takedown notices promptly.
3. **Counter-Notice Procedure:** Allow the accused party to dispute the claim.
4. **Repeat Infringer Policy:** Have a policy and enforce it. Terminate accounts that repeatedly infringe.

### Takedown Notice Handling

When a DMCA notice is received:

1. Jenny verifies the notice contains all required elements (identification of copyrighted work, identification of infringing material, contact information, good faith statement, accuracy statement).
2. If valid, remove or disable access to the material within 24-48 hours.
3. Notify the user whose content was removed.
4. If user files a counter-notice, wait 10-14 business days. If no court action is filed by the claimant, restore the content.
5. Log the entire process in the audit trail.

---

## Trademark Basics

Benny manages trademark awareness and protection.

### What Can Be Trademarked

- Brand names (Atlas UX, DEAD APP CORP).
- Logos and visual marks.
- Slogans and taglines.
- Product names (individual agent names if used commercially).
- Sound marks, color marks (rare but possible).

### Trademark Priority

1. **Search before using:** Before launching a brand name, Benny should search USPTO TESS database, state databases, and common law usage (domain names, social media handles).
2. **Use it or lose it:** Trademarks require actual use in commerce. Registering without using leads to cancellation.
3. **Proper marking:** Use TM for unregistered marks, (R) for registered marks. Always use the mark as an adjective, not a noun or verb.

### Infringement Monitoring

Benny should periodically check for:
- Similar names in the same industry.
- Domain registrations using the brand name.
- Social media accounts impersonating the brand.
- App store listings with confusingly similar names.

---

## Content Licensing

### User-Generated Content

If the platform hosts user content, the ToS must include a content license:

- **Scope:** Non-exclusive, worldwide, royalty-free license to host, display, and distribute the content as part of the service.
- **Duration:** For as long as the content is on the platform, plus a reasonable wind-down period.
- **Sublicensing:** Only if necessary for CDN, backup, or third-party integration. Be explicit.
- **User retains ownership:** The license does not transfer ownership. Users can delete their content and the license terminates.

### AI-Generated Content Ownership

This is a developing area of law. Current best practices:

1. **Disclose that AI generates content.** Do not represent AI output as human-created.
2. **Copyright status is uncertain.** The U.S. Copyright Office has stated that purely AI-generated works are not copyrightable. Works with significant human creative input may qualify.
3. **Practical approach:** Grant users a broad license to use AI-generated content for any purpose. Do not claim the company owns AI outputs. Do not promise that outputs are copyrightable.
4. **Platform-specific rules:** Some platforms (Meta, Google) require disclosure of AI-generated content. Social publishers must comply.

### Third-Party Content

When agents use third-party content (stock photos, data, articles):

- Verify license terms before use. Benny reviews licensing agreements.
- Track attribution requirements. Some licenses require credit.
- Distinguish between commercial and editorial use rights.
- Never use content with a non-commercial license for commercial purposes.

---

## User Data Rights

### Right to Access

Users can request a copy of all data the platform holds about them. Response deadline: 30 days (GDPR), 45 days (CCPA).

### Right to Deletion

Users can request deletion of their personal data. Exceptions: data required for legal compliance, contract fulfillment, or fraud prevention.

### Right to Portability

Users can request their data in a machine-readable format (JSON, CSV). Applies to data they provided and data generated from their activity.

### Right to Correction

Users can request correction of inaccurate personal data.

### Implementation

Jenny should verify that the platform can fulfill all data rights requests within required timeframes. Each request should be logged in the audit trail with Larry's oversight.

---

## Platform Compliance

### Apple App Store

- **Review guidelines:** No misleading descriptions, no hidden features, no data collection without disclosure.
- **In-app purchases:** Subscriptions sold in-app must use Apple's payment system (30% commission, 15% for small developers).
- **Privacy nutrition labels:** Must accurately describe data collection practices.
- **AI disclosure:** Must disclose AI-powered features and their limitations.

### Google Play Store

- **Similar to Apple** but with more flexibility on payment systems in some jurisdictions.
- **Data safety section:** Equivalent to Apple's privacy nutrition labels.
- **Families policy:** If the app could attract children, additional restrictions apply.

### Meta (Facebook, Instagram, Threads)

- **Platform Terms:** Content posted through APIs must comply with Meta's content policies.
- **Automated posting:** Must disclose automated/AI-generated content.
- **Rate limits:** Respect API rate limits or risk app suspension.
- **App review:** Apps using certain permissions require Meta's review and approval.

### Google (YouTube, Search)

- **API Terms:** Google API Services User Data Policy applies.
- **OAuth verification:** Required for apps accessing sensitive scopes. Requires video demo of the app.
- **Content policies:** Automated content must comply with platform guidelines.

---

## Compliance Checklist

Jenny and Benny should review this quarterly:

- [ ] Terms of Service updated within the last 12 months.
- [ ] Privacy Policy reflects current data practices.
- [ ] DMCA agent registration is current.
- [ ] Trademark monitoring scan completed.
- [ ] Third-party licenses reviewed and compliant.
- [ ] Data rights request process tested and documented.
- [ ] Platform compliance verified for each active integration.
- [ ] AI content disclosure practices match current platform requirements.
- [ ] International privacy law compliance reviewed for current customer geographies.

All compliance actions are logged to the audit trail. Larry audits the compliance checklist quarterly.
