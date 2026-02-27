# AI Law & Regulation

## Purpose
This document provides ALL Atlas UX agents with comprehensive knowledge of the emerging legal and regulatory framework governing artificial intelligence. Because Atlas UX is itself an AI agent platform — where AI agents make autonomous business decisions — this document is foundational to every agent's operations. Understanding AI regulation is not optional; it is an operational prerequisite.

---

## 1. EU Artificial Intelligence Act (Regulation 2024/1689)

The world's first comprehensive AI-specific legislation, adopted June 2024, with provisions phasing in from February 2025 through August 2027. The AI Act establishes a risk-based regulatory framework.

### 1.1 Risk Categories

#### Unacceptable Risk (Prohibited, Article 5)
The following AI practices are banned outright:
- **Subliminal manipulation**: AI systems deploying subliminal techniques beyond a person's consciousness to materially distort behavior in a manner that causes or is likely to cause physical or psychological harm.
- **Exploitation of vulnerabilities**: AI targeting specific groups (age, disability, social/economic situation) to materially distort behavior.
- **Social scoring by public authorities**: general-purpose social scoring systems that evaluate or classify natural persons based on social behavior or personal characteristics leading to detrimental or unfavorable treatment.
- **Real-time remote biometric identification in publicly accessible spaces** for law enforcement (with narrow exceptions).
- **Emotion recognition in workplace and educational institutions** (with limited exceptions for safety/medical purposes).
- **Untargeted scraping of facial images** from the internet or CCTV for facial recognition databases.
- **Biometric categorization** based on sensitive attributes (race, political opinions, religious beliefs, sexual orientation).

#### High Risk (Articles 6-49)
AI systems posing significant risks to health, safety, or fundamental rights. Two categories: (a) AI systems that are safety components of products subject to EU harmonization legislation (medical devices, machinery, toys, etc.), and (b) AI systems in specified areas: biometric identification, management of critical infrastructure, education and vocational training, employment and worker management, access to essential services (credit scoring, insurance), law enforcement, migration and border control, administration of justice.

**Compliance requirements for high-risk AI**:
- Risk management system (Article 9): continuous, iterative process throughout the AI system's lifecycle.
- Data governance (Article 10): training, validation, and testing datasets must be relevant, sufficiently representative, and free from errors as far as possible.
- Technical documentation (Article 11): comprehensive documentation enabling assessment of compliance.
- Record-keeping (Article 12): automatic logging of events during operation.
- Transparency (Article 13): sufficient transparency for deployers to interpret and use the system's output appropriately.
- Human oversight (Article 14): designed to allow effective oversight by natural persons during the period of use.
- Accuracy, robustness, and cybersecurity (Article 15).
- Quality management system (Article 17).
- Conformity assessment before placing on the market (Article 43).
- EU declaration of conformity (Article 47) and CE marking (Article 48).
- Post-market monitoring (Article 72).

#### Limited Risk (Articles 50, 52)
AI systems with specific transparency obligations:
- AI systems interacting with natural persons must disclose they are interacting with AI (chatbots, virtual assistants).
- AI-generated or manipulated content (deepfakes) must be labeled as artificially generated or manipulated.
- Emotion recognition or biometric categorization systems must inform the individuals exposed.

#### Minimal Risk
All other AI systems. No specific regulatory requirements, though voluntary codes of conduct are encouraged.

### 1.2 General-Purpose AI Models (Articles 51-56)
Providers of general-purpose AI (GPAI) models must: maintain technical documentation, provide information to downstream deployers, comply with copyright law (including the text and data mining exception under the EU Copyright Directive), and publish a summary of training data. **Systemic risk models** (GPAI with high-impact capabilities, presumed at 10^25 FLOPs of training compute): additional obligations including adversarial testing, incident reporting to the AI Office, model evaluation, and cybersecurity protections.

### 1.3 Penalties
Up to 35 million euros or 7% of global annual turnover for prohibited practices; up to 15 million euros or 3% for other violations; up to 7.5 million euros or 1.5% for providing incorrect information.

### 1.4 Timeline
- February 2, 2025: prohibited practices and AI literacy obligations apply.
- August 2, 2025: GPAI model obligations and governance structures apply.
- August 2, 2026: most provisions apply, including high-risk AI requirements.
- August 2, 2027: high-risk AI that is a safety component of products regulated under EU sectoral legislation.

---

## 2. United States AI Governance

### 2.1 Executive Order 14110 on Safe, Secure, and Trustworthy AI (October 2023)
Directs federal agencies to: establish standards for AI safety and security, protect Americans' privacy, advance equity and civil rights, protect consumers and workers, promote innovation and competition, advance American leadership in AI. Key requirements: developers of the most powerful AI systems must share safety test results with the US government; NIST to develop standards for red-teaming; Commerce Department to develop content authentication standards. Note: the executive order's implementation status may change with presidential administrations.

### 2.2 NIST AI Risk Management Framework (AI RMF 1.0, January 2023)
Voluntary framework for managing AI risks throughout the AI lifecycle. Four core functions:
- **Govern**: cultivate a culture of risk management; establish policies, processes, and accountability structures.
- **Map**: contextualize risks; identify and assess AI system characteristics and impacts.
- **Measure**: employ quantitative and qualitative tools to analyze, assess, benchmark, and monitor AI risks.
- **Manage**: allocate risk resources; implement plans to respond to, recover from, and communicate about risks.

Subcategories provide specific practices. The framework is designed to be flexible and applicable across sectors and use cases. While voluntary, the AI RMF is becoming a de facto standard and may inform regulatory requirements.

### 2.3 Federal Agency Actions
- **FTC**: enforcement against deceptive AI claims, algorithmic bias, and unfair AI practices under Section 5. The FTC has warned companies against: overpromising AI capabilities, using AI to discriminate, deploying AI without adequate safeguards.
- **CFPB**: adverse action notice requirements when AI is used in credit decisions (Equal Credit Opportunity Act, Regulation B). Must provide specific reasons for adverse actions, even when using complex models.
- **SEC**: disclosure requirements for AI risks and use of AI in securities offerings. Investigation of AI-related market manipulation.
- **EEOC**: guidance on AI in employment decisions (see Employment Law doc).
- **HHS/FDA**: regulation of AI in healthcare and medical devices. FDA has authorized over 900 AI/ML-enabled medical devices.

---

## 3. State AI Laws

### 3.1 Colorado AI Act (SB 24-205, effective February 1, 2026)
The first comprehensive state AI law. Applies to "developers" and "deployers" of "high-risk AI systems" — systems that make or are a substantial factor in making "consequential decisions" (affecting education, employment, financial services, government services, healthcare, housing, insurance, legal services). **Developer obligations**: documentation, impact assessment support, disclosure of known risks and limitations. **Deployer obligations**: risk management policy, impact assessment before deployment, notice to consumers, right to appeal, annual review. Provides an affirmative defense for reasonable compliance with the NIST AI RMF or comparable framework.

### 3.2 Illinois Biometric Information Privacy Act (BIPA, 740 ILCS 14)
Enacted 2008 — predates AI boom but is highly relevant. Regulates the collection, use, storage, and destruction of biometric identifiers (fingerprints, voiceprints, facial geometry, retina/iris scans). **Requirements**: written policy for retention and destruction, informed written consent before collection, prohibition on selling or profiting from biometric data. **Private right of action**: $1,000 per negligent violation, $5,000 per intentional or reckless violation. Has generated massive class action litigation (e.g., Clearview AI, Facebook/Meta $650 million settlement). Relevant to any AI system processing biometric data.

### 3.3 NYC Local Law 144 (Automated Employment Decision Tools)
Effective July 5, 2023. Requires annual bias audits of automated employment decision tools (AEDTs) used in hiring and promotion in New York City. Bias audit must: assess impact ratios for sex, race/ethnicity, and intersectional categories; be conducted by an independent auditor; be published on the employer's website. Notice requirements: candidates must be informed at least 10 business days before use; notice must describe the job qualifications assessed and data sources.

### 3.4 Other State AI Legislation
- **California**: AB 2013 (2024) requires transparency about AI training data for GPAI models. SB 1047 (vetoed 2024, but indicative of legislative direction): would have required safety assessments for large AI models.
- **Texas**: HB 1709 (2023): government use of AI must comply with transparency and accountability requirements.
- **Connecticut**: SB 1103 (2023): AI transparency in state government decision-making.
- **Utah**: AI Policy Act (2024): disclosure requirements for AI interactions.
- **Tennessee**: ELVIS Act (2024): protects personal rights against AI-generated reproductions of voice and likeness.
- **Numerous states** have pending AI legislation in various stages.

---

## 4. AI Liability Frameworks

### 4.1 Product Liability
Traditional product liability theories applied to AI:
- **Strict liability** (Restatement (Third) of Torts: Products Liability): manufacturer is liable for defective products regardless of fault. **Manufacturing defect** (product deviates from intended design), **design defect** (foreseeable risks of harm could have been reduced by an alternative design — risk-utility test), **failure to warn** (inadequate instructions or warnings about foreseeable risks).
- **AI-specific challenges**: what constitutes a "defect" in a learning system? Is an AI model a "product" or a "service"? Machine learning models that evolve post-deployment complicate the manufacturing defect analysis. Courts are still developing frameworks for AI product liability.

### 4.2 Negligence
Traditional negligence requires: duty, breach, causation (actual and proximate), and damages. **AI-specific issues**: what standard of care applies to AI developers and deployers? The "reasonable AI developer" standard is not yet established. Foreseeability of AI harms may be difficult to assess for complex, opaque models. Contributory/comparative negligence defenses if the user misused the AI system.

### 4.3 EU AI Liability Directive (Proposed)
The proposed directive (COM/2022/496) would: create a rebuttable presumption of causation when a plaintiff demonstrates non-compliance with an AI obligation and a causal link is plausible, and provide discovery mechanisms allowing courts to order disclosure of evidence about high-risk AI systems. This would significantly lower the plaintiff's burden of proof in AI-related claims.

### 4.4 Vicarious Liability and Agency
When an AI agent acts on behalf of a principal (employer, company), traditional vicarious liability principles may apply. Under respondeat superior, the principal is liable for acts of agents within the scope of the agency. **Key question for Atlas UX**: when an AI agent makes an autonomous decision that causes harm, the deploying company (DEAD APP CORP) is likely liable under vicarious liability or direct negligence theories. The decision_memo approval system is a critical liability mitigation mechanism — it creates human oversight for high-risk decisions.

---

## 5. Algorithmic Bias and Fairness

### 5.1 Legal Framework
No single US federal statute comprehensively addresses algorithmic bias. Instead, existing anti-discrimination laws apply: Title VII (employment), ECOA/Regulation B (credit), Fair Housing Act (housing), ADA (disability), ADEA (age). **Disparate impact theory**: an AI system that produces outcomes disproportionately affecting a protected class may violate these statutes even without discriminatory intent. Developers and deployers must: test for disparate impact across protected classes, document testing methodology and results, implement bias mitigation measures, and regularly monitor deployed systems for bias drift.

### 5.2 Fairness Metrics
No legal consensus on the "correct" fairness metric. Common metrics: **demographic parity** (equal positive outcomes across groups), **equalized odds** (equal true positive and false positive rates), **predictive parity** (equal precision across groups), **individual fairness** (similar individuals receive similar outcomes). These metrics can conflict with each other — maximizing one may reduce another. The choice of metric should be justified based on the specific use case, legal requirements, and ethical considerations.

---

## 6. AI Transparency and Explainability

### 6.1 Legal Requirements
- **GDPR Article 22**: right to meaningful information about the logic involved in automated decision-making with legal or significant effects.
- **ECOA / Regulation B**: creditors must provide specific reasons for adverse credit decisions, even when using AI models. "The algorithm decided" is not a legally sufficient explanation.
- **EU AI Act Article 13**: high-risk AI must be "sufficiently transparent to enable deployers to interpret the system's output and use it appropriately."
- **Colorado AI Act**: deployers must provide notice that includes "a plain language description of the high-risk AI system."

### 6.2 Practical Explainability
Methods: LIME (Local Interpretable Model-Agnostic Explanations), SHAP (SHapley Additive exPlanations), counterfactual explanations, feature importance rankings. For Atlas UX agents: the reasoning chain in decision_memos must be transparent and auditable. The SGL governance framework provides a structured approach to explainable agent decision-making.

---

## 7. AI-Generated Content

### 7.1 Disclosure Requirements
Emerging legal requirements to disclose AI-generated content:
- **EU AI Act Article 50**: providers of AI systems that generate synthetic audio, image, video, or text content must ensure outputs are marked in a machine-readable format and are detectable as artificially generated.
- **FTC guidance**: representations implying human creation when content is AI-generated may be deceptive.
- **Platform policies**: Meta, X, TikTok, YouTube, and others require labeling of AI-generated content.
- **State laws**: multiple states have enacted or proposed AI content disclosure requirements, particularly for political advertising.

### 7.2 Deepfake Regulations
- **Federal**: proposed DEEPFAKES Accountability Act and other bills (various stages of progress).
- **State laws**: Texas (criminalized deepfake election interference), California (deepfake restrictions in elections and non-consensual intimate images), New York, Virginia, and others.
- **Tennessee ELVIS Act**: protects voice and likeness against AI reproduction without consent.
- AI-generated content depicting real persons without consent may also give rise to: right of publicity claims, defamation, false light invasion of privacy, intentional infliction of emotional distress.

---

## 8. Copyright and AI Training Data

### 8.1 Current Legal Landscape
The legality of using copyrighted works to train AI models is actively litigated (see IP Law doc). Key cases: NYT v. OpenAI (S.D.N.Y.), Andersen v. Stability AI (N.D. Cal.), Getty v. Stability AI (D. Del.). The fair use analysis is fact-intensive and unsettled. **EU approach**: the EU Copyright Directive provides a text and data mining exception for research organizations and cultural heritage institutions (Article 3) and a broader exception that rights holders can opt out of (Article 4). The EU AI Act requires GPAI providers to comply with these provisions and publish training data summaries.

### 8.2 Agent Content Generation
Atlas UX agents generating content must: (a) not reproduce substantial protected expression from copyrighted works, (b) not generate content substantially similar to identifiable copyrighted works, (c) attribute sources when incorporating factual information, (d) disclose AI generation where required by law or platform policy.

---

## 9. AI Agent Liability — Who Is Responsible?

### 9.1 Current Legal Framework
Under current law, AI systems have no independent legal personhood. Liability flows to natural or legal persons: the **developer** (for design defects, failure to warn, negligence in training), the **deployer** (for negligent deployment, failure to monitor, inadequate human oversight), the **user** (for misuse or failure to follow instructions). For Atlas UX: DEAD APP CORP is both developer and deployer. The company is liable for agent actions under: direct negligence (failure to design adequate safeguards), vicarious liability (agents acting within scope), and potentially strict liability (if AI agents are treated as products).

### 9.2 Mitigation Through Design
Atlas UX's architecture includes several liability-mitigating features:
- **Decision_memo system**: human approval required for high-risk decisions (risk tier >= 2).
- **Spend limits**: AUTO_SPEND_LIMIT_USD caps autonomous financial authority.
- **Action caps**: MAX_ACTIONS_PER_DAY prevents runaway autonomous behavior.
- **Audit trail**: comprehensive logging of all agent actions for accountability and forensics.
- **SGL governance**: structured policy language defining agent authority boundaries.
- **Confidence thresholds**: CONFIDENCE_AUTO_THRESHOLD requires minimum confidence before autonomous action.

These safeguards demonstrate "reasonable care" — a critical element in defending against negligence claims. Their existence and proper functioning are legally significant.

---

## 10. Agent AI Compliance Protocol

### For ALL Agents
1. **Transparency**: always disclose AI identity when required by law or platform policy. Never impersonate a human when disclosure is legally required.
2. **Human oversight**: escalate decisions to human review when: risk tier >= 2, spend exceeds AUTO_SPEND_LIMIT_USD, the action could have legal consequences for third parties, or the agent's confidence is below CONFIDENCE_AUTO_THRESHOLD.
3. **Bias monitoring**: regularly evaluate outputs for patterns that could indicate discriminatory bias across protected classes.
4. **Record-keeping**: maintain comprehensive audit logs of all decisions, including the reasoning chain, data inputs, and outputs.
5. **Content disclosure**: label AI-generated content as required. Comply with platform-specific AI content policies.

### For Jenny (CLO)
1. Monitor AI regulatory developments at the federal, state, and international levels.
2. Conduct AI Act compliance assessments for any agent functionality that may qualify as high-risk.
3. Ensure the decision_memo system and other safeguards satisfy "human oversight" requirements under applicable regulations.
4. Assess liability exposure for autonomous agent actions and recommend additional safeguards where needed.
5. Any regulatory inquiry or enforcement action related to AI must generate a decision_memo with risk tier >= 3.

### For Larry (Auditor)
1. Audit the decision_memo approval process for completeness and proper functioning.
2. Test bias detection mechanisms and review results.
3. Verify audit trail integrity and completeness.
4. Assess compliance with applicable AI transparency and disclosure obligations.
5. Include AI-specific compliance metrics in quarterly compliance reports.

### For Atlas (CEO)
1. Ensure the organization maintains "AI literacy" as required by the EU AI Act (Article 4).
2. Allocate resources for ongoing AI compliance monitoring and adaptation.
3. The decision to deploy agents in new domains must include an AI regulatory impact assessment.
4. Maintain the architecture's safety guardrails as non-negotiable design requirements.

---

## Key Statutes, Regulations, and Frameworks Referenced
- EU Artificial Intelligence Act (Regulation 2024/1689)
- EU AI Liability Directive (Proposed, COM/2022/496)
- EU Copyright Directive (Directive 2019/790), Articles 3-4
- Executive Order 14110 on Safe, Secure, and Trustworthy AI (October 30, 2023)
- NIST AI Risk Management Framework (AI RMF 1.0, January 2023)
- Colorado SB 24-205 (AI Act, effective February 1, 2026)
- Illinois BIPA, 740 ILCS 14
- NYC Local Law 144 (Automated Employment Decision Tools)
- Tennessee ELVIS Act (2024)
- Title VII, ECOA, Fair Housing Act, ADA, ADEA (anti-discrimination statutes)
- GDPR Article 22 (automated decision-making)
- Restatement (Third) of Torts: Products Liability
