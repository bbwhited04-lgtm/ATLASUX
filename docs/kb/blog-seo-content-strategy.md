# Blog SEO & Content Strategy

**Owner:** Reynolds (Social Publisher — Blog)
**Reports to:** Sunday (Comms & Technical Document Writer)
**Last updated:** 2026-02-26

---

## Purpose

This is Reynolds' operational guide for the Atlas UX blog. The blog is the foundational content asset — every other platform (social, email, ads) pulls from blog content. Reynolds' primary mission is to grow organic search traffic by publishing high-quality, SEO-optimized content consistently.

---

## Keyword Research Process

Every blog post begins with keyword research. Never write a post without a target keyword.

### Step-by-Step Workflow
1. **Seed keywords:** Start with core topics — AI automation, AI agents, business productivity, SaaS tools, workflow automation, autonomous AI.
2. **Expand with tools:** Use Google Search Console (existing queries driving impressions), Google autocomplete, "People also ask" boxes, and keyword tools (Ahrefs, SEMrush, Ubersuggest).
3. **Evaluate:** For each candidate keyword, assess:
   - **Search volume:** Minimum 100 monthly searches for long-tail, 500+ for head terms.
   - **Keyword difficulty:** Target KD under 40 for a growing site. Lower is better.
   - **Search intent:** Is the searcher looking for information (guide), a comparison (vs page), or a solution (product page)? Match content type to intent.
   - **Business relevance:** Does ranking for this keyword attract potential Atlas UX users? Ignore high-volume keywords with no buyer intent.
4. **Select:** Choose 1 primary keyword and 2-3 secondary keywords per post.
5. **Document:** Log all target keywords, their volume, difficulty, and assigned post in a keyword tracker.

### Long-Tail vs Head Terms

- **Head terms** ("AI automation") — High volume, high competition, difficult to rank. Target with pillar pages.
- **Long-tail terms** ("how to automate sales pipeline with AI agents") — Lower volume, lower competition, higher conversion intent. Target with individual blog posts.
- **Ratio:** 70% long-tail posts, 30% head-term pillar content.

---

## On-Page SEO Checklist

Every post must pass this checklist before publishing:

### Title Tag
- Include primary keyword within the first 60 characters.
- Use power words (guide, ultimate, proven, how to, why, best).
- Make it click-worthy but honest — no clickbait.
- Example: "How to Automate Your Business with AI Agents: A 2026 Guide"

### Meta Description
- 150-160 characters. Include primary keyword naturally.
- Write it as a value proposition: what will the reader gain?
- Include a soft CTA: "Learn how," "Discover why," "See the full breakdown."

### Header Structure (H1-H3)
- **H1:** One per page. Should closely match the title tag. Include primary keyword.
- **H2:** Major sections. Include secondary keywords where natural. 4-8 H2s per post.
- **H3:** Subsections under H2s. Use for detailed breakdowns, lists, and examples.
- **Never skip levels** (do not jump from H1 to H3).
- Headers should read as a scannable outline of the entire post.

### Internal Linking
- **Minimum 3-5 internal links per post.** Link to relevant existing blog posts, product pages, and pillar content.
- Use descriptive anchor text (not "click here"). The anchor text should describe the linked page's content.
- Add internal links to older posts that point to new posts. Every new post should trigger 2-3 internal link additions to existing content.

### External Links
- Link to authoritative external sources (research papers, industry reports, official documentation) to support claims.
- 2-4 external links per post. Open in new tab.
- Never link to direct competitors' blog posts.

---

## Content Length Targets

Content length correlates with search ranking, but only when the length is justified by depth:

| Content Type | Target Length | Use Case |
|-------------|-------------|----------|
| Quick answer / how-to | 800-1,200 words | Simple questions, step-by-step tasks |
| Standard blog post | 1,500-2,000 words | Explanations, comparisons, tutorials |
| In-depth guide | 2,000-2,500 words | Comprehensive topic coverage |
| Pillar page | 3,000-4,000 words | Topic cluster hub page |
| Comparison/review | 1,500-2,500 words | "X vs Y" or "Best tools for Z" |

**Never pad content for word count.** A focused 1,500-word post outranks a rambling 3,000-word post. Every paragraph should earn its place.

---

## Publishing Frequency

- **Target:** 2-4 posts per week. Consistency is more important than volume.
- **Minimum:** 2 posts per week. Below this, organic growth stalls.
- **Schedule:** Publish Monday, Wednesday, and Friday mornings (8:00-9:00 AM EST). Tuesday and Thursday are fallback days for bonus content.
- **Pipeline:** Maintain a 2-week content buffer. Never write same-day publish.

---

## Content Clusters and Pillar Pages

Organize the blog around topic clusters to build topical authority:

### Structure
- **Pillar page:** A comprehensive, 3,000+ word guide on a broad topic (e.g., "The Complete Guide to AI Business Automation").
- **Cluster posts:** 8-15 blog posts covering specific subtopics that link back to the pillar page (e.g., "How AI Agents Handle Email Automation," "AI vs Human: When to Automate Decision-Making").
- **Internal linking:** Every cluster post links to the pillar page. The pillar page links to every cluster post. This creates a topical web that signals expertise to search engines.

### Atlas UX Content Clusters
- AI Business Automation (pillar) + agent-specific posts
- SaaS Productivity Tools (pillar) + comparison and tutorial posts
- Workflow Automation (pillar) + use-case and how-to posts
- AI Safety & Governance (pillar) + compliance and ethics posts

---

## Featured Snippets Optimization

Featured snippets (position zero) drive massive click-through. Optimize for them:

- **Paragraph snippets:** Answer the target question directly in 40-60 words, placed immediately after the relevant H2. Start with "X is..." or "X means..."
- **List snippets:** Use numbered or bulleted lists under H2 headers. Google pulls these as featured snippets for "how to" and "best" queries.
- **Table snippets:** Use HTML tables for comparison data. Google loves pulling tables into snippets.
- **Target "People also ask" questions** as H2 headers and answer them concisely.

---

## Image Optimization

- **Alt text is mandatory** for every image. Describe the image content and include relevant keywords naturally. "Screenshot of Atlas UX agent dashboard showing automated task queue" — not "image1" or "dashboard."
- **File names:** Rename before upload. Use hyphens: `ai-agent-workflow-automation.png` — not `IMG_4532.png`.
- **File size:** Compress all images to under 200KB. Use WebP format when possible.
- **Dimensions:** Set explicit width and height attributes to prevent layout shift (CLS).

---

## Schema Markup

Implement structured data for enhanced search results:

- **Article schema** on every blog post (headline, author, datePublished, dateModified, image).
- **FAQ schema** on posts that answer multiple questions.
- **HowTo schema** on step-by-step tutorial posts.
- **BreadcrumbList schema** for site navigation context.
- Validate all schema with Google's Rich Results Test before publishing.

---

## Updating Old Content

Old content decays in rankings. Schedule regular refreshes:

- **Monthly audit:** Identify posts with declining traffic (20%+ drop over 3 months).
- **Update strategy:**
  - Refresh statistics and examples with current data.
  - Add new sections covering developments since original publication.
  - Update the `dateModified` in schema markup.
  - Re-optimize title and meta description if the target keyword landscape has changed.
  - Add internal links to newer content.
- **Republish:** After significant updates, update the publication date and re-share on social channels.

---

## Analytics Targets

Track weekly and report to Sunday every Monday:

| Metric | Target | Notes |
|--------|--------|-------|
| Organic sessions / week | 500+ | Primary growth metric |
| Average time on page | 3+ minutes | Indicates content quality |
| Bounce rate | Below 65% | High bounce = mismatched intent |
| Pages per session | 1.5+ | Measures internal linking effectiveness |
| Keyword rankings (top 10) | 20+ keywords | Track with Search Console |
| Impressions / week | 5,000+ | Leading indicator of traffic growth |
| CTR from search | 3%+ | Improve with title/meta optimization |
| Backlinks / month | 5+ new | Organic backlinks from quality content |

---

## Escalation Rules

- If organic traffic drops 30%+ in a single week: Investigate immediately (algorithm update, technical issue, deindexing). Notify Sunday.
- If a post ranks on page 1 within 48 hours: Notify Sunday. Prioritize internal linking and social promotion to reinforce the ranking.
- If a competitor publishes content targeting the same keyword: Assess their content quality. If stronger, schedule an update to the competing post within 1 week.
