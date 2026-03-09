# Trademark Conflict Search Assistant Knowledge

## Purpose

This document provides Benny (IP Counsel agent) with comprehensive knowledge for conducting and analyzing trademark conflict searches. The core question: Is the proposed mark likely to be refused under §2(d) (likelihood of confusion) based on prior marks, or likely to face an opposition from an existing mark owner?

---

## The du Pont Factors — Likelihood of Confusion Analysis

The foundational test for likelihood of confusion is the **13-factor du Pont test**, established in In re E. I. du Pont de Nemours & Co., 476 F.2d 1357 (CCPA 1973). Not all factors are relevant in every case; typically 2–4 factors are decisive.

### Factor 1 — Similarity of the Marks

**The single most important factor.** Marks are compared in their entireties for similarities in: (1) appearance (visual), (2) sound (phonetic), (3) meaning (connotation), and (4) commercial impression.

**Key principles:**
- Marks must be compared as a whole, not dissected. However, certain elements may be given more weight (e.g., the dominant element).
- Side-by-side comparison is not the standard. The question is whether a consumer encountering the marks at different times and places would be confused. The marks need not be identical — similarity is sufficient.
- Minor differences in spelling, punctuation, or the addition of generic/descriptive matter do not avoid confusion.

**Visual similarity analysis:**
- Compare letterforms, design elements, overall layout.
- Consider that consumers may recall the general impression, not every detail.
- Stylization differences between a standard character mark and a design mark may reduce similarity, but the standard character mark covers ALL presentations.

**Phonetic similarity analysis:**
- Compare pronunciation syllable by syllable.
- Consider common mispronunciations and regional accents.
- Phonetic equivalents chart (examples):
  - PH = F (PHISH = FISH)
  - K = C = CK (KOOL = COOL)
  - X = CKS = KS (RELAX = RELACKS)
  - Y = I (BYTE = BITE)
  - Double letters vs. single (TIPP = TIP)
  - Silent letters (KNIGHT = NITE)
  - -TION = -SION = -SHUN
  - -ER = -OR = -AR (similar ending sounds)

**Meaning/connotation analysis:**
- Do the marks convey the same idea, concept, or overall meaning?
- Foreign language equivalents: The **doctrine of foreign equivalents** requires considering the English translation of foreign words when the relevant consumer population includes people who speak that language. TMEP §1207.01(b)(vi).
- Example: LUPO (Italian for "wolf") and WOLF are considered similar in meaning.

**Commercial impression:**
- What is the overall impression left on the consumer?
- Consider the mark in the context of how it is used in the marketplace.

### Factor 2 — Similarity of the Goods/Services

- Goods/services need not be identical — they need only be **related** such that consumers would expect them to come from the same source.
- Evidence of relatedness: (1) same trade channels, (2) same class of consumers, (3) complementary use, (4) third-party registrations covering both types of goods/services under a single mark.
- Coordinated classes (see `benny-nice-classification.md`) are particularly relevant.
- The more similar the marks, the less similar the goods/services need to be (and vice versa). In re Shell Oil Co., 992 F.2d 1204 (Fed. Cir. 1993).

### Factor 3 — Similarity of Trade Channels

- Where are the goods/services sold? Online, retail stores, specialty shops, professional channels?
- If both marks' goods/services are sold through the same channels (e.g., both available at major retailers or both sold online), this factor weighs toward confusion.
- Overlapping trade channels increase likelihood of confusion.

### Factor 4 — Conditions of Purchase (Consumer Sophistication)

- Are the goods/services expensive, infrequent purchases where consumers exercise more care (e.g., industrial equipment, luxury goods)?
- Or are they inexpensive, impulse purchases where confusion is more likely (e.g., consumer packaged goods)?
- **Higher consumer sophistication = lower likelihood of confusion.**
- **Lower consumer sophistication = higher likelihood of confusion.**
- Even sophisticated consumers are not immune to confusion; this factor can be outweighed by strong mark similarity.

### Factor 5 — Fame of the Prior Mark

- Fame magnifies the scope of protection. A famous mark is entitled to a **broader scope of protection** than an obscure one.
- Fame is measured by: sales volume, advertising expenditure, length of use, consumer recognition surveys, media coverage.
- The more famous the prior mark, the more likely confusion is, even with less similar goods/services or trade channels.
- DuPont factor 5 applies the concept from Kenner Parker Toys Inc. v. Rose Art Indus., Inc., 963 F.2d 350 (Fed. Cir. 1992).

### Factor 6 — Number and Nature of Similar Marks in Use

- If many third parties use similar marks for similar goods/services, the scope of protection for the prior mark may be narrower (the "crowded field" argument).
- Evidence: third-party registrations, third-party actual use in commerce.
- A crowded field suggests consumers are accustomed to distinguishing among similar marks, reducing the likelihood of confusion.
- However, third-party registrations alone (without evidence of actual use) are less persuasive.

### Factor 7 — Nature and Extent of Any Actual Confusion

- Evidence of actual confusion is highly probative (but not required to prove likelihood of confusion).
- Types: misdirected communications, customer complaints, surveys showing confusion, website traffic misdirection.
- Absence of actual confusion is not dispositive, especially if the marks have not been used in the same markets for long.

### Factor 8 — Length of Time of Concurrent Use Without Actual Confusion

- If both marks have coexisted for a significant period without evidence of confusion, this weighs against a finding of likelihood of confusion.
- Less relevant if the parties operate in different geographic areas or different trade channels.

### Factor 9 — Variety of Goods/Services on Which the Mark Is Used

- If the prior mark owner uses the mark on a wide variety of goods/services, the scope of protection is broader because consumers expect that source to expand into related fields.

### Factor 10 — Market Interface (Agreements, Assignments, etc.)

- Any consent agreements, coexistence agreements, or prior dealings between the parties.
- A consent agreement signed by the prior mark owner may overcome a §2(d) refusal, though the examining attorney retains discretion. TMEP §1207.01(d)(viii).

### Factor 11 — Applicant's Right to Exclude Others

- The extent to which the applicant has the right to exclude others from using the mark on the identified goods/services.
- Typically relevant in inter partes proceedings more than ex parte examination.

### Factor 12 — Extent of Potential Confusion

- Is the potential confusion de minimis or substantial?
- A small probability of confusion among a large number of consumers may still be legally significant.

### Factor 13 — Any Other Probative Facts

- Catch-all factor for evidence not fitting neatly into the other 12 factors.
- Examples: applicant's intent in adopting the mark (if intent to trade on the goodwill of the prior mark, this is a strong factor toward confusion), the sophistication of the marks' presentation, marketing context.

---

## TESS Search Strategies

The Trademark Electronic Search System (TESS) is the USPTO's public database for searching registered and pending marks. URL: https://tess2.uspto.gov/

### Structured Search (Boolean)

Use the structured search form for precise queries.

**Key field codes:**
- `BI` — Basic Index (searches mark text, description, etc.)
- `FM` — Free-Form Mark field (literal text of the mark)
- `WM` — Word Mark (exact word mark search)
- `IC` — International Class
- `GS` — Goods/Services description
- `OW` — Owner Name
- `SN` — Serial Number
- `RN` — Registration Number
- `LD` — Live/Dead status (`LD` = live marks only)
- `DM` — Design Mark search (using design codes)

**Example searches:**
```
FM:"ATLAS" AND IC:"009" AND LD:1
```
Finds live marks containing "ATLAS" in Class 9.

```
FM:"ATLAS*" AND GS:"software" AND LD:1
```
Finds live marks starting with "ATLAS" for software-related goods/services.

### Free-Form Search

Type natural language or Boolean expressions.

```
"atlas ux"[FM] and "computer software"[GS] and live[LD]
```

### Design Code Search

For marks with design elements, use the USPTO Design Search Code Manual.

**Common design codes:**
- 01 — Stars, celestial bodies
- 02 — People (human figures)
- 03 — Animals
- 05 — Plants, flowers, trees
- 06 — Scenery (landscapes)
- 09 — Music
- 14 — Circles, ovals
- 24 — Shields, crests
- 26 — Geometric shapes

```
DC:"0301" AND IC:"025" AND LD:1
```
Finds live marks with cat/feline designs in Class 25.

---

## Search Methodology — Progressive Expansion

A thorough conflict search follows a progressive expansion approach, from the most directly conflicting to more remote conflicts.

### Phase 1 — Exact Match Search

Search for the exact proposed mark (word-for-word) across all classes.

```
FM:"ATLAS UX" AND LD:1
```

### Phase 2 — Phonetic Equivalents

Search for marks that sound like the proposed mark, using phonetic variants.

For "ATLAS UX":
```
FM:"ATLAS*" AND LD:1
FM:"ATLIS*" OR FM:"ATLUS*" OR FM:"ATLASS*" AND LD:1
FM:"*UX" OR FM:"*UKS" OR FM:"*UCKS" AND LD:1
```

### Phase 3 — Visual Similarity

Search for marks with similar visual structure, letter patterns, or design elements.
- Consider marks with the same first 2-3 letters.
- Consider marks of the same length with similar letter patterns.
- For design marks, search by design code.

### Phase 4 — Conceptual/Meaning Similarity

Search for marks conveying the same idea or meaning.
- If the mark suggests a concept (e.g., "Atlas" suggests strength, support, or maps), search for other marks using synonyms or related concepts.
- Apply the doctrine of foreign equivalents for translations.

### Phase 5 — Related Goods/Services Expansion

Even if no exact match is found, search for similar marks in **related classes** and **coordinated classes**.
- A mark for software (Class 9) should be searched against SaaS services (Class 42), IT services (Class 42), computer services (Class 35), telecommunications (Class 38), and education (Class 41).

### Phase 6 — Common Law Search (Beyond TESS)

TESS only covers federal applications and registrations. Also consider:
- State trademark databases (Secretary of State offices)
- Business name registrations
- Domain name registrations (WHOIS)
- Internet searches (Google, social media platforms)
- Industry directories and databases

---

## Analyzing Search Results

### Conflict Assessment Matrix

For each potentially conflicting mark found, evaluate:

| Factor | Assessment | Weight |
|--------|-----------|--------|
| Mark similarity (visual) | Low / Medium / High | High |
| Mark similarity (phonetic) | Low / Medium / High | High |
| Mark similarity (meaning) | Low / Medium / High | Medium |
| Goods/services relatedness | Unrelated / Somewhat / Closely / Identical | High |
| Trade channel overlap | None / Some / Significant | Medium |
| Consumer sophistication | High / Medium / Low | Medium |
| Fame of prior mark | Unknown / Moderate / Famous | High |
| Prior mark status | Dead / Pending / Registered / Incontestable | High |

### Risk Rating

Based on the factor analysis:

- **HIGH RISK (Likely refusal/opposition):** Marks are similar in at least 2 of 3 dimensions (visual, phonetic, meaning) AND goods/services are related or identical. Especially high risk if the prior mark is famous or has incontestable status.

- **MODERATE RISK (Possible refusal/opposition):** Marks share some similarity but with meaningful differences, OR marks are similar but goods/services are somewhat removed. Proceed with caution; consider seeking a legal opinion or filing with a strategy for overcoming a potential §2(d) refusal.

- **LOW RISK (Unlikely refusal):** Marks have meaningful differences across all dimensions, OR goods/services are clearly unrelated and in different trade channels. Proceed with filing.

---

## Special Search Considerations

### Acronyms and Initialisms

- Search for both the acronym and the full words.
- "UX" should trigger searches for "USER EXPERIENCE" and variants.
- Acronyms are compared letter-by-letter for visual and phonetic similarity.

### Domain Names and .COM Marks

- After USPTO v. Booking.com B.V., 591 U.S. 381 (2020), "generic.com" marks may be registrable if consumer perception evidence shows distinctiveness.
- Search with and without the TLD (.com, .io, .ai, etc.).

### Composite Marks

- Search the dominant textual element separately.
- Search the design element by design code.
- The overall commercial impression governs, but individual elements are also searched.

### Marks with Common Prefixes/Suffixes

- Common prefixes (e-, i-, my-, go-, smart-, pro-) are often given less weight.
- Common suffixes (-ly, -ify, -able, -ware, -tech) similarly may be less distinguishing.
- The distinctive portion of the mark carries more weight.

### Foreign Language Marks

- Apply the doctrine of foreign equivalents: translate and search for the English equivalent.
- Consider whether the relevant U.S. consumer base includes speakers of that language.
- Not all foreign words trigger the doctrine — it applies mainly to "common, modern languages." Palm Bay Imports, Inc. v. Veuve Clicquot Ponsardin Maison Fondee En 1772, 396 F.3d 1369 (Fed. Cir. 2005).

---

## Overcoming a §2(d) Refusal

If a conflict is identified and the examining attorney issues a §2(d) refusal, strategies include:

### 1. Argue Differences in Marks

- Highlight visual, phonetic, and conceptual differences.
- Submit evidence of different commercial impressions.
- Emphasize different dominant elements (for composite marks).

### 2. Argue Differences in Goods/Services

- Show the goods/services are not related in the minds of consumers.
- Submit evidence that they travel through different trade channels.
- Demonstrate different classes of consumers.

### 3. Consent Agreement

- Obtain a consent or coexistence agreement from the prior mark owner.
- While not binding on the USPTO, consent agreements are given significant weight. TMEP §1207.01(d)(viii).

### 4. Third-Party Evidence (Crowded Field)

- Submit evidence of numerous third-party registrations and uses of similar marks for similar goods/services.
- Argue that the prior mark is weak due to the crowded field.

### 5. Applicant's Own Prior Use

- If the applicant has a lengthy history of concurrent use without confusion, submit evidence (no actual confusion over X years).

### 6. Amendment of Goods/Services

- Narrow the identification to remove overlap with the cited mark's goods/services.
- This may eliminate the basis for the refusal.

---

## Search Report Template

When presenting search results, use this structure:

```
TRADEMARK CONFLICT SEARCH REPORT
=================================
Proposed Mark: [MARK]
Goods/Services: [Description]
Class(es): [Number(s)]
Search Date: [Date]

SEARCH METHODOLOGY
- Databases searched: TESS, [others]
- Search terms: [list]
- Classes searched: [list]

POTENTIALLY CONFLICTING MARKS

1. [MARK NAME] — Reg. No. [number] / Serial No. [number]
   Owner: [name]
   Status: [Live/Dead/Pending]
   Class(es): [number]
   Goods/Services: [description]

   SIMILARITY ANALYSIS:
   - Visual: [Low/Medium/High] — [explanation]
   - Phonetic: [Low/Medium/High] — [explanation]
   - Meaning: [Low/Medium/High] — [explanation]
   - Goods/Services Relatedness: [assessment]

   RISK RATING: [HIGH/MODERATE/LOW]
   RECOMMENDATION: [Proceed/Caution/Avoid]

[Repeat for each potentially conflicting mark]

OVERALL ASSESSMENT
[Summary of findings and recommendation]
```

---

## Key Case Law for Conflict Analysis

| Case | Citation | Key Holding |
|------|----------|------------|
| In re E.I. du Pont de Nemours | 476 F.2d 1357 (CCPA 1973) | Established the 13-factor likelihood of confusion test |
| In re Shell Oil Co. | 992 F.2d 1204 (Fed. Cir. 1993) | The more similar the marks, the less similar the goods need to be |
| Kenner Parker Toys v. Rose Art | 963 F.2d 350 (Fed. Cir. 1992) | Fame of the prior mark broadens scope of protection |
| Palm Bay Imports v. Veuve Clicquot | 396 F.3d 1369 (Fed. Cir. 2005) | Doctrine of foreign equivalents |
| In re Viterra Inc. | 671 F.3d 1358 (Fed. Cir. 2012) | Not all du Pont factors are relevant in every case |
| Hewlett-Packard Co. v. Packard Press | 281 F.3d 1261 (Fed. Cir. 2002) | Similarity of marks must consider marks in their entireties |
| In re i.am.symbolic | 866 F.3d 1315 (Fed. Cir. 2017) | Consumer perception evidence for marks that include generic terms |

---

*Last updated: March 2026. TESS search syntax reflects current USPTO system. Legal standards reflect Federal Circuit and TTAB precedent as of the publication date.*
