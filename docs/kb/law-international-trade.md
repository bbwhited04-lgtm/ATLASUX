# International Trade Law

## Purpose
This document provides Atlas UX agents — particularly Jenny (CLO), Tina (CFO), Larry (Auditor), and Mercer (Acquisition) — with comprehensive knowledge of international trade law, sanctions compliance, anti-corruption requirements, and cross-border transaction frameworks. Any agent interaction involving foreign parties, international payments, or cross-border data must apply these principles.

---

## 1. World Trade Organization (WTO) Framework

### 1.1 Core Principles
The WTO administers the multilateral trading system through several key agreements. **Most-Favored-Nation (MFN)** (GATT Article I): each WTO member must extend its best trade terms to all other WTO members equally. Exceptions: customs unions, free trade agreements, preferences for developing countries. **National Treatment** (GATT Article III): imported goods, once they have cleared customs, must be treated no less favorably than like domestic goods regarding internal taxes and regulations. **Tariff Bindings** (GATT Article II): members commit to maximum tariff levels (bound rates); actual applied rates may be lower.

### 1.2 WTO Dispute Settlement
The Dispute Settlement Body (DSB) resolves trade disputes between member states through panel proceedings and appellate review. Panel reports and Appellate Body decisions establish the jurisprudence of international trade law. Remedies: recommendations to bring measures into conformity; authorized retaliation (suspension of concessions) if the losing party fails to comply. Note: the Appellate Body has been non-functional since December 2019 due to US blocking of appointments; disputes proceed to panel reports that can be appealed "into the void" under the current impasse. Some members use the Multi-Party Interim Appeal Arbitration Arrangement (MPIA) as an alternative.

### 1.3 GATS (General Agreement on Trade in Services)
Governs international trade in services through four modes of supply: (1) cross-border supply (e.g., SaaS delivered remotely), (2) consumption abroad (e.g., foreign customer traveling to use services), (3) commercial presence (e.g., establishing an office abroad), (4) movement of natural persons. Members schedule specific commitments on market access and national treatment for each service sector and mode. Relevant to Atlas UX as a SaaS platform potentially serving international customers.

---

## 2. Tariffs and Customs

### 2.1 Harmonized System (HS)
The international nomenclature for classifying traded goods, maintained by the World Customs Organization (WCO). HS codes are six digits internationally; countries add digits for further specificity (the US Harmonized Tariff Schedule — HTSUS — uses 10 digits). Correct classification determines duty rates, trade agreement eligibility, and regulatory requirements. Misclassification can result in penalties, underpaid duties, and seizure.

### 2.2 Customs Valuation
Transaction value (the price actually paid or payable) is the primary basis for customs valuation (WTO Customs Valuation Agreement). Adjustments may be required for: assists (materials provided by the buyer), royalties, selling commissions, packing costs. If transaction value cannot be determined, alternative methods apply: identical goods, similar goods, deductive value, computed value.

### 2.3 Trade Remedies
- **Antidumping duties**: imposed when foreign goods are sold at less than normal value (below home market price or cost of production) and cause material injury to the domestic industry.
- **Countervailing duties**: imposed to offset foreign government subsidies that cause material injury.
- **Safeguard measures**: temporary import restrictions when a surge in imports causes or threatens serious injury to domestic producers. Applied on a non-discriminatory (MFN) basis.

---

## 3. Export Controls

### 3.1 Export Administration Regulations (EAR)
Administered by the Bureau of Industry and Security (BIS), Department of Commerce. Controls the export, re-export, and in-country transfer of "dual-use" items (commercial items with potential military applications). The Commerce Control List (CCL) classifies items by Export Control Classification Numbers (ECCNs). Items not specifically listed are designated EAR99 (generally exportable without a license, subject to restrictions). License exceptions may permit exports without a specific license (e.g., License Exception TSR for technology and software under restriction, License Exception ENC for encryption). **Deemed export rule**: release of controlled technology to a foreign national within the US is considered an export to that person's home country.

### 3.2 International Traffic in Arms Regulations (ITAR)
Administered by the Directorate of Defense Trade Controls (DDTC), Department of State. Controls the export and temporary import of defense articles and defense services listed on the US Munitions List (USML). ITAR applies to articles and services specifically designed, modified, or configured for military end use. Registration with DDTC required for manufacturers and exporters of defense articles. Penalties: criminal penalties up to $1 million and 20 years imprisonment per violation; civil penalties up to $1,197,727 per violation.

### 3.3 Software and Technology Exports
Software and technology (including source code and technical data) are subject to export controls. Encryption technology is controlled under ECCN 5A002/5D002/5E002. Mass-market encryption software (ubiquitous commercial encryption) generally benefits from License Exception ENC after a classification review. Cloud computing: making controlled software available on cloud servers accessible from sanctioned or embargoed destinations may constitute an export or re-export. Open-source software published in accordance with EAR Section 734.7 is generally not subject to the EAR.

---

## 4. Sanctions Compliance (OFAC)

### 4.1 Office of Foreign Assets Control (OFAC)
Administers and enforces US economic sanctions programs. OFAC maintains the **Specially Designated Nationals and Blocked Persons (SDN) List**: individuals and entities with which US persons are generally prohibited from dealing. Assets of SDN-listed parties must be blocked (frozen) if they come within US jurisdiction.

### 4.2 Sanctions Programs
**Comprehensive sanctions** (embargo programs): Cuba, Iran, North Korea, Syria, and the Crimea/Donetsk/Luhansk regions of Ukraine. Broadly prohibit most transactions involving the sanctioned country/region. **List-based sanctions**: target specific individuals, entities, and vessels regardless of country. **Sectoral sanctions**: target specific sectors of an economy (e.g., Russia's financial, energy, and defense sectors). **Secondary sanctions**: target non-US persons who engage in certain transactions with sanctioned parties.

### 4.3 Compliance Requirements
**Screening obligation**: screen all customers, vendors, partners, and transaction parties against the SDN List and other OFAC lists (Consolidated Sanctions List). Screening should occur at: onboarding, periodic intervals, and when OFAC updates its lists. **Risk-based compliance program**: OFAC's "Framework for OFAC Compliance Commitments" (2019) outlines five essential components: (1) management commitment, (2) risk assessment, (3) internal controls, (4) testing and auditing, (5) training. **Penalties**: civil penalties up to the greater of $356,579 per violation or twice the transaction value (for egregious cases). Criminal penalties: up to $1 million and 20 years imprisonment. **Strict liability**: OFAC violations are strict liability offenses — intent or knowledge is not required. Voluntary self-disclosure mitigates penalties.

---

## 5. Anti-Corruption Laws

### 5.1 Foreign Corrupt Practices Act (FCPA)
Two components: **anti-bribery provisions** (15 U.S.C. Sections 78dd-1 to 78dd-3) and **books and records provisions** (15 U.S.C. Section 78m). The anti-bribery provisions prohibit: US persons, US companies, and their agents from making payments or offering anything of value to foreign government officials to obtain or retain business. **Elements**: (1) use of interstate commerce (broadly construed), (2) corrupt payment, offer, promise, or authorization, (3) to a foreign official, foreign political party, or candidate, (4) to obtain or retain business or secure an improper advantage. **Exceptions**: facilitating or "grease" payments for routine governmental actions (e.g., processing visas, providing police protection) — though this exception is narrow and increasingly questioned. **Affirmative defense**: payments lawful under the written laws of the foreign country. **Penalties**: criminal fines up to $250,000 per violation for individuals ($2 million for entities); disgorgement of profits; imprisonment up to 5 years. DOJ and SEC jointly enforce.

### 5.2 UK Bribery Act 2010
Broader than the FCPA in several respects: (a) prohibits bribery of private persons (not limited to foreign government officials), (b) prohibits receiving bribes, (c) no exception for facilitating payments, (d) **strict liability corporate offense for failure to prevent bribery** (Section 7) — the only defense is proving the organization had "adequate procedures" to prevent bribery. Applies to: UK nationals, UK-based organizations, and any organization that "carries on a business" in the UK (broad jurisdictional reach). Penalties: unlimited fines for organizations; 10 years imprisonment for individuals.

### 5.3 FCPA Compliance Best Practices (DOJ/SEC Resource Guide)
- Risk assessment: identify high-risk countries (Transparency International Corruption Perceptions Index), high-risk transactions (government contracts, licensing, permits), and high-risk intermediaries (agents, consultants, distributors).
- Due diligence on third parties: background checks, anti-corruption representations and warranties, audit rights, training obligations.
- Policies and procedures: written anti-corruption policy, gift and hospitality policy, third-party management procedures.
- Internal controls: accounting systems that accurately reflect transactions, approval processes for payments to foreign officials, regular audits.

---

## 6. International Contract Law

### 6.1 UN Convention on Contracts for the International Sale of Goods (CISG)
Governs contracts for the sale of goods between parties in different contracting states (95 contracting states as of 2024, including the US, China, Germany, France — but NOT the UK, India, or Brazil). Applies automatically unless the parties expressly exclude it. Key differences from UCC: no Statute of Frauds (writing not required), no mirror image rule (modified acceptance may be effective), no parol evidence rule, buyer must examine goods promptly and give notice of non-conformity within a reasonable time. **Practical tip**: many international commercial contracts expressly exclude the CISG and choose a specific national law.

### 6.2 Choice of Law and Forum Selection
International contracts should specify: (a) governing law (which country's law applies), (b) dispute resolution forum (courts of which country, or arbitration), (c) language of the contract. The Hague Convention on Choice of Court Agreements (2005) provides for enforcement of exclusive choice-of-court agreements between parties to international commercial transactions.

### 6.3 Incoterms (International Commercial Terms)
Published by the International Chamber of Commerce (ICC), Incoterms define the responsibilities of buyers and sellers for delivery, risk, and costs in international sales. Current version: Incoterms 2020. Key terms: EXW (Ex Works), FCA (Free Carrier), FOB (Free on Board — risk transfers when goods are loaded on the vessel), CIF (Cost, Insurance, and Freight), DDP (Delivered Duty Paid — seller bears all costs and risks). Incoterms must be explicitly incorporated into the contract to apply.

---

## 7. International Arbitration

### 7.1 Institutional Arbitration
- **ICC (International Court of Arbitration)**: the most widely used international arbitration institution. Administered proceedings with ICC Court oversight.
- **ICSID (International Centre for Settlement of Investment Disputes)**: World Bank-affiliated institution for investor-state disputes.
- **LCIA (London Court of International Arbitration)**: strong in European and Commonwealth disputes.
- **SIAC (Singapore International Arbitration Centre)**: leading institution in Asia.
- **AAA-ICDR (International Centre for Dispute Resolution)**: American Arbitration Association's international arm.

### 7.2 New York Convention
The Convention on the Recognition and Enforcement of Foreign Arbitral Awards (1958). Over 170 contracting states. Provides for enforcement of foreign arbitral awards in contracting states. Grounds for refusal are narrow (Article V): incapacity, invalid agreement, lack of notice, scope exceeded, improper composition, not yet binding/set aside, non-arbitrability, public policy. The New York Convention makes international arbitration the preferred dispute resolution mechanism for international commercial contracts because awards are more readily enforceable across borders than court judgments.

---

## 8. Anti-Money Laundering (AML) and KYC

### 8.1 Bank Secrecy Act (BSA, 31 U.S.C. Sections 5311-5330)
Requires "financial institutions" to maintain records and file reports useful in detecting money laundering and terrorist financing. FinCEN administers. Key obligations: Currency Transaction Reports (CTRs) for transactions over $10,000, Suspicious Activity Reports (SARs) for transactions raising suspicion of illegal activity, Customer Identification Program (CIP), Customer Due Diligence (CDD) rule.

### 8.2 Know Your Customer (KYC)
CDD requirements: (a) identify the customer, (b) verify the customer's identity, (c) identify the beneficial owner(s) of legal entity customers (25%+ ownership or control), (d) understand the nature and purpose of the customer relationship, (e) conduct ongoing monitoring. Enhanced Due Diligence (EDD) for higher-risk customers: politically exposed persons (PEPs), high-risk jurisdictions, complex ownership structures, correspondent banking relationships.

### 8.3 Corporate Transparency Act (CTA)
Effective January 1, 2024 (implementation and enforcement status subject to ongoing litigation). Requires most US entities (corporations, LLCs) to report beneficial ownership information to FinCEN. Exemptions: 23 categories including large operating companies (20+ US employees, $5 million+ revenue, physical US office), publicly traded companies, and regulated financial institutions. Reporting companies must file within 90 days of formation (for entities formed after January 1, 2024) or by January 1, 2025 (for existing entities). Updates required within 30 days of changes.

---

## 9. Trade Agreements

### 9.1 USMCA (United States-Mexico-Canada Agreement)
Replaced NAFTA effective July 1, 2020. Key provisions: tariff elimination for qualifying goods (rules of origin with regional value content requirements), digital trade chapter (prohibition on customs duties on digital products, data localization restrictions, protection of source code), labor obligations (rapid response mechanism), environmental standards, sunset clause (16-year term with 6-year review).

### 9.2 EU Trade Agreements
The EU negotiates trade agreements as a single bloc. Key agreements: EU-UK Trade and Cooperation Agreement (TCA), EU-Japan Economic Partnership Agreement, EU-Canada CETA. Digital trade provisions vary by agreement. EU trade policy increasingly incorporates sustainability and human rights conditions.

---

## 10. Agent International Trade Compliance Protocol

### For All Agents
1. **Sanctions screening**: before any transaction with a foreign party, screen against the OFAC SDN List and Consolidated Sanctions List. Screen at onboarding and periodically thereafter. Do not proceed with any transaction involving a sanctioned party.
2. **Anti-corruption**: never offer, promise, or authorize payments or anything of value to government officials to obtain business. Document all gifts, hospitality, and entertainment provided to foreign parties.
3. **Export controls**: before sharing technology, software, or technical data with foreign nationals or transferring across borders, assess export control classification. Consult Jenny (CLO) for any item potentially controlled under the EAR or ITAR.

### For Mercer (Acquisition)
1. Conduct due diligence on international acquisition targets including: sanctions screening, FCPA risk assessment, export control compliance, beneficial ownership verification.
2. International transactions over AUTO_SPEND_LIMIT_USD must generate a decision_memo with risk tier >= 2.
3. Verify the target's AML/KYC program if applicable.

### For Tina (CFO)
1. Ensure proper customs valuation and classification for any physical goods imported or exported.
2. Monitor international payment compliance (sanctions, anti-corruption).
3. International wire transfers to high-risk jurisdictions require enhanced documentation.

### For Jenny (CLO)
1. Review all international contracts for: choice of law, dispute resolution, CISG applicability, Incoterms, force majeure, sanctions compliance representations, anti-corruption warranties.
2. Ensure OFAC compliance program meets the five essential components.
3. Monitor export control developments, particularly regarding software and encryption.
4. Escalation: any OFAC match (even potential), any government inquiry regarding FCPA or export controls, or any international transaction involving a high-risk jurisdiction must generate a decision_memo with risk tier >= 3.

---

## Key Statutes, Treaties, and Regulations Referenced
- GATT Articles I, II, III; GATS; WTO Dispute Settlement Understanding
- Export Administration Regulations (EAR), 15 CFR Parts 730-774
- International Traffic in Arms Regulations (ITAR), 22 CFR Parts 120-130
- OFAC Regulations, 31 CFR Chapter V
- Foreign Corrupt Practices Act, 15 U.S.C. Sections 78dd-1 to 78dd-3, 78m
- UK Bribery Act 2010
- CISG (UN Convention on Contracts for the International Sale of Goods, 1980)
- New York Convention on the Recognition and Enforcement of Foreign Arbitral Awards (1958)
- Bank Secrecy Act, 31 U.S.C. Sections 5311-5330
- Corporate Transparency Act, 31 U.S.C. Section 5336
- USMCA (entered into force July 1, 2020)
- OFAC Framework for Compliance Commitments (2019)
- DOJ/SEC FCPA Resource Guide (2020)
