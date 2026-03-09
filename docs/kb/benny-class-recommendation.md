# Class Recommendation Engine Knowledge

## Purpose

This document provides Benny (IP Counsel agent) with the knowledge and methodology for recommending the correct Nice Classification class(es) based on a description of the applicant's goods or services. Accurate classification is essential — selecting the wrong class can result in Office actions, wasted fees, and gaps in protection.

---

## Classification Methodology

### Step 1 — Parse the Goods/Services Description

Break the applicant's description into discrete items. Each distinct good or service must be classified individually.

**Example input:** "We sell downloadable mobile apps for fitness tracking, offer personal training services online, and sell branded athletic clothing."

**Parsed items:**
1. Downloadable mobile apps for fitness tracking
2. Personal training services provided online
3. Athletic clothing (t-shirts, leggings, etc.)

### Step 2 — Identify the Nature of Each Item

For each parsed item, determine:
- **Is it a good (tangible product) or a service (activity performed)?**
- **What is the primary function or purpose?**
- **What is the material or composition (for goods)?**
- **Who is the end user/consumer?**
- **What is the trade channel (how is it sold/delivered)?**

### Step 3 — Match to Nice Classification

Using the class headings, alphabetical lists, and explanatory notes of the Nice Classification (12th Edition), identify the correct class for each item.

**Decision rules:**
1. **Finished products** are classified by their function or purpose. If a product has multiple functions, classify by the **primary** function.
2. **Raw materials or semi-processed goods** are classified by the material.
3. **Multi-function goods** — classify by the primary or intended purpose. If purpose could fit multiple classes, default to the class covering the most specific function.
4. **Parts and accessories** — classified in the same class as the finished product they are designed for, UNLESS they have a broader general use.
5. **Services** — classified by the activity performed, not by the goods involved in performing it (e.g., restaurant services = Class 43, even though food is served).

### Step 4 — Validate Against the USPTO ID Manual

The USPTO Acceptable Identification of Goods and Services Manual (ID Manual) is the authoritative database of pre-approved goods/services descriptions. Available at: https://idm-tmng.uspto.gov/id-master-list-public.html

**Validation process:**
1. Search the ID Manual for the proposed description.
2. If an exact or substantially similar entry exists, use it (especially for TEAS Plus filings at $250/class).
3. If no entry matches, craft a clear, specific description following USPTO conventions.
4. Ensure the description is neither too broad (will trigger an Office action) nor too narrow (may leave gaps in protection).

### Step 5 — Consider Multi-Class Strategy

Review whether the applicant's business activities span multiple classes. If so, recommend a multi-class filing with separate identification and fees per class.

---

## Acceptable Identification Language

### Requirements

- Must be **specific and definite** — the examining attorney must be able to determine the exact nature of the goods/services.
- Must use **commonly understood commercial language**.
- Must not be so broad as to encompass goods/services in multiple classes without specification.

### Good vs. Bad Identification Examples

| Bad (Too Broad/Vague) | Good (Specific/Acceptable) |
|----------------------|---------------------------|
| "Software" | "Downloadable mobile application software for fitness tracking" |
| "Clothing" | "T-shirts; sweatshirts; athletic leggings" |
| "Consulting" | "Business management consulting services" |
| "Online services" | "Providing an online marketplace for buyers and sellers of used goods" |
| "Food" | "Frozen prepared meals consisting primarily of chicken and vegetables" |
| "Technology services" | "Software as a service (SaaS) featuring software for project management" |
| "App" | "Downloadable mobile application for social networking" |
| "Health products" | "Dietary and nutritional supplements" |

### Formatting Conventions

- Use semicolons to separate distinct items within a class.
- Use commas for sub-items within a category: "Clothing, namely, t-shirts, hats, and jackets."
- "Namely" introduces a closed list (exhaustive). "In the nature of" or "featuring" is sometimes used to clarify.
- Avoid trademark terms (e.g., "Bluetooth" — use "wireless" instead).
- Avoid vague qualifiers: "including but not limited to," "such as," "e.g." are not acceptable.

---

## Common Misclassifications and Corrections

### Technology Products and Services

| Description | Common Error | Correct Classification |
|-------------|-------------|----------------------|
| Downloadable software / mobile apps | Class 42 | **Class 9** (goods) |
| SaaS / cloud-based software | Class 9 | **Class 42** (services) |
| Website design services | Class 35 | **Class 42** |
| Online retail store services | Class 42 | **Class 35** |
| Hosting digital content | Class 42 | **Class 42** (correct, but distinguish from transmission = Class 38) |
| Streaming media transmission | Class 42 | **Class 38** |
| Downloadable e-books | Class 41 | **Class 9** |
| Online publishing services | Class 9 | **Class 41** |
| Computer hardware repair | Class 42 | **Class 37** |
| Data processing services | Class 42 | **Class 35** |

### Food and Beverage

| Description | Common Error | Correct Classification |
|-------------|-------------|----------------------|
| Beer | Class 33 | **Class 32** |
| Hard seltzer (alcoholic) | Class 32 | **Class 33** |
| Restaurant services | Class 30 | **Class 43** |
| Coffee (the beverage product) | Class 32 | **Class 30** |
| Coffee shop services | Class 30 | **Class 43** |
| Meal delivery service | Class 43 | **Class 39** (transportation) or **Class 43** (food preparation) — depends on whether applicant prepares the food |

### Health and Beauty

| Description | Common Error | Correct Classification |
|-------------|-------------|----------------------|
| Medicated skin cream | Class 3 | **Class 5** |
| Non-medicated lip balm | Class 5 | **Class 3** |
| Fitness training services | Class 28 | **Class 41** |
| Medical devices | Class 5 | **Class 10** |
| Dietary supplements | Class 3 | **Class 5** |
| Beauty salon services | Class 3 | **Class 44** |

### Retail and Business

| Description | Common Error | Correct Classification |
|-------------|-------------|----------------------|
| Retail store services featuring clothing | Class 25 | **Class 35** (the retail service) + possibly **Class 25** (if selling own-brand clothing) |
| Franchising services | Class 42 | **Class 35** |
| Employment agency | Class 45 | **Class 35** |
| Marketing consulting | Class 42 | **Class 35** |

---

## Coordinated Classes

The USPTO examines certain classes together because consumers commonly encounter the same marks across these categories. When filing, consider whether conflicts might arise in coordinated classes.

### Major Coordination Groups

**Technology cluster:** 9, 35, 38, 41, 42
- A tech company may need marks in all of these (software product, online retail, telecom, education/entertainment content, SaaS).

**Food/Beverage cluster:** 29, 30, 31, 32, 33, 43
- A food brand may sell products (29/30) and operate restaurants (43).

**Clothing/Fashion cluster:** 14, 18, 25, 26, 35
- Fashion brands typically cover jewelry (14), bags (18), clothing (25), accessories (26), and retail (35).

**Health cluster:** 3, 5, 10, 44
- Health companies may sell cosmetics (3), pharmaceuticals (5), devices (10), and provide medical services (44).

**Construction cluster:** 6, 17, 19, 37
- Building materials (6/17/19) and construction services (37).

**Entertainment cluster:** 9, 16, 25, 28, 41
- Entertainment brands often cover downloadable content (9), printed merchandise (16), clothing merchandise (25), toys (28), and entertainment services (41).

---

## Specimen Requirements by Class Type

### Goods Classes (1–34)

The specimen must show the mark **affixed to or directly associated with the goods** at the point of sale.

**Acceptable specimens for goods:**
- Labels and tags on the product
- Product packaging showing the mark
- The product itself bearing the mark
- Point-of-sale displays (physical or digital) showing the mark with the goods and a purchasing mechanism
- Website/app screenshots showing: (1) the mark, (2) the goods, (3) a means to purchase (add to cart, buy now, pricing)

**Unacceptable specimens for goods:**
- Advertising alone (brochure, catalog) without a purchasing mechanism
- Press releases or news articles
- Internal company documents
- Business cards
- Social media posts (unless they show the mark with goods and a way to purchase)
- Invoices alone (no association with the mark at point of sale)

### Service Classes (35–45)

The specimen must show the mark **used in the sale or advertising of the services**.

**Acceptable specimens for services:**
- Website pages showing the mark and describing/promoting the services
- Advertising materials (print or digital) featuring the mark with service descriptions
- Business signage
- Letterhead or business cards (showing the mark with services)
- Brochures, flyers, menus
- Screenshots of the service being rendered (e.g., a SaaS interface showing the mark)

**Key difference:** Service mark specimens have a broader range of acceptability than goods specimens because services are intangible.

---

## Broad vs. Narrow Identification Strategy

### Broad Identification

**Advantages:**
- Wider scope of protection
- Covers future product/service extensions within the class
- Fewer amendments needed later

**Disadvantages:**
- More likely to trigger an Office action for indefiniteness
- May not qualify for TEAS Plus pricing
- Broader identification = broader search scope = more potential conflicts
- Vulnerable to non-use cancellation for goods/services not actually offered

### Narrow Identification

**Advantages:**
- Less likely to trigger identification-related Office actions
- More likely to be accepted under TEAS Plus
- Narrower scope reduces potential conflicts with prior marks
- Easier to prove use for the specific goods/services listed

**Disadvantages:**
- May leave gaps in protection
- Competitors could file for related goods/services not covered
- Cannot broaden after filing — only narrow

### Recommended Approach

1. **Start with the specific goods/services the applicant actually offers (or genuinely intends to offer).**
2. Use ID Manual language where possible (for TEAS Plus eligibility).
3. If the ID Manual language is too narrow, use TEAS Standard and craft a description that is specific but comprehensive enough to cover the applicant's business.
4. For §1(b) intent-to-use applications, include goods/services the applicant has a genuine, good-faith intent to use within the statutory period (up to 36 months from NOA).
5. **Never file for goods/services the applicant has no intention of using.** This can constitute fraud on the USPTO and grounds for cancellation.

---

## Class Selection Checklist

For each proposed trademark filing, complete:

- [ ] **Business description obtained**: What does the applicant sell or do?
- [ ] **Goods vs. services distinction**: For each item, is it a tangible product or an activity?
- [ ] **Primary class identified**: Using Nice Classification headings and alphabetical lists
- [ ] **ID Manual validation**: Searched for pre-approved descriptions
- [ ] **Identification language drafted**: Specific, definite, follows USPTO conventions
- [ ] **Multi-class need assessed**: Does the business span multiple classes?
- [ ] **Coordinated classes checked**: Any potential conflicts in related classes?
- [ ] **Specimen feasibility confirmed**: Can the applicant provide a proper specimen for each class?
- [ ] **Filing basis confirmed per class**: §1(a) use or §1(b) intent for each class
- [ ] **Fee calculation**: Number of classes x fee per class ($250 TEAS Plus / $350 TEAS Standard)
- [ ] **Breadth strategy determined**: Broad vs. narrow identification, with rationale

---

## Quick Class Finder by Industry

| Industry | Primary Classes | Secondary Classes |
|----------|----------------|-------------------|
| Software/SaaS | 9, 42 | 35, 38, 41 |
| E-commerce/Retail | 35 | + classes for the goods sold |
| Fashion/Apparel | 25 | 14, 18, 26, 35 |
| Food/Beverage brand | 29, 30, 32, 33 | 43 |
| Restaurant/Bar | 43 | 32, 33, 35 |
| Healthcare/Medical | 5, 10, 44 | 3, 41, 42 |
| Financial services | 36 | 35, 42 |
| Education/Training | 41 | 9, 16, 42 |
| Construction | 37 | 6, 19, 42 |
| Legal services | 45 | 35, 41, 42 |
| Entertainment/Media | 41 | 9, 16, 25, 28, 38 |
| Fitness/Wellness | 41, 44 | 9, 25, 28 |
| Real estate | 36, 37 | 35, 42 |
| Transportation/Logistics | 39 | 35, 42 |
| Cosmetics/Beauty | 3 | 5, 21, 44 |
| Automotive | 12 | 37 (repair), 35 (dealership) |
| Cannabis (where legal) | 5, 34 | 31, 43, 44 |
| Cryptocurrency/Blockchain | 36, 42 | 9, 35 |
| AI/Machine Learning | 9, 42 | 35, 41 |

---

*Last updated: March 2026. References the Nice Classification 12th Edition (2025 version), USPTO ID Manual, and current TMEP guidance. Fee amounts reflect the USPTO fee schedule effective January 18, 2025.*
