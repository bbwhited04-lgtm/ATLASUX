# Vision Tools — Giving AI Agents Eyes

## Beyond Text: Why Agents Need Vision

Language models process text. But the real world is visual — screenshots, documents, charts, photos, UI layouts, handwritten notes, receipts. Vision tools bridge this gap, letting agents perceive, interpret, and act on visual information. Without vision tools, an agent can reason about code but can't see whether the UI it built actually looks right.

## Screenshot Capture Tools

The most common vision tool. Capture what's on screen and feed it to the LLM.

**Full Page Screenshots:**
```typescript
// Playwright MCP — capture entire page
await page.screenshot({ path: 'screenshot.png', fullPage: true });
```

**Element-Specific Screenshots:**
```typescript
// Capture just a specific component
const element = await page.locator('.appointment-card');
await element.screenshot({ path: 'card.png' });
```

**Viewport Screenshots:**
```typescript
// Capture what the user actually sees (no scrolling)
await page.screenshot({ path: 'viewport.png', fullPage: false });
```

**Obsidian CLI:**
```bash
obsidian dev:screenshot path=screenshot.png
```

**When to use:** UI verification, visual regression testing, debugging layout issues, capturing error states, documenting UI flows.

## DOM Inspection Tools

Structural view of the page — what screenshots can't tell you.

**Accessibility Tree:**
```typescript
// Playwright MCP — structured DOM snapshot
const snapshot = await page.accessibility.snapshot();
// Returns: { role: "WebArea", name: "...", children: [...] }
```

The accessibility tree is often better than raw HTML for LLMs because it's semantic (buttons, links, headings, forms) rather than structural (divs, spans, classes).

**Element Attributes:**
```typescript
// Get specific element properties
const text = await page.locator('.price').textContent();
const href = await page.locator('.cta').getAttribute('href');
const visible = await page.locator('.modal').isVisible();
```

**Computed Styles:**
```bash
# Obsidian CLI — inspect CSS
obsidian dev:css selector=".workspace-leaf" prop=background-color
```

**When to use:** Verifying element states (enabled/disabled), checking form values, confirming navigation targets, accessibility audits.

## OCR Tools

Extract text from images — receipts, documents, handwritten notes, screenshots.

**Tesseract OCR:**
```typescript
import Tesseract from 'tesseract.js';
const result = await Tesseract.recognize(imagePath, 'eng');
const text = result.data.text;
```

**Google Cloud Vision:**
```typescript
const [result] = await client.textDetection(imagePath);
const text = result.textAnnotations?.[0]?.description ?? '';
```

**Claude Native Vision:**
Claude can read text directly from images without OCR middleware. Send the image as a content block:
```typescript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  messages: [{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: "image/png", data: imageBase64 } },
      { type: "text", text: "Extract all text from this receipt" }
    ]
  }]
});
```

**When to use:** Processing scanned documents, reading receipts for expense tracking, extracting text from screenshots, digitizing handwritten notes.

## Visual Comparison Tools

Detect changes between visual states.

**Screenshot Diffing:**
```typescript
import pixelmatch from 'pixelmatch';
const diff = pixelmatch(img1Data, img2Data, diffOutput, width, height, { threshold: 0.1 });
const changedPixels = diff; // Number of different pixels
```

**Visual Regression Testing:**
Compare current screenshots against baselines to catch unintended UI changes. Tools like Percy, Chromatic, or custom Playwright assertions.

**When to use:** Verifying that code changes didn't break the UI, monitoring third-party widget changes, A/B test visual verification.

## Document Understanding Tools

Extract structured data from complex documents.

**PDF Parsing:**
Claude Code's `Read` tool can process PDFs directly:
```
Read file: /path/to/document.pdf (pages: "1-5")
```

**Table Extraction:**
From images or PDFs, extract tabular data into structured format. Claude's native vision handles tables well — send the image and ask for JSON/CSV output.

**Invoice Processing:**
Extract vendor, line items, totals, dates from invoice images. Combine OCR with structured extraction.

**When to use:** Processing business documents, extracting data from PDFs, handling scanned forms, invoice automation.

## Chart and Graph Reading

LLMs can interpret charts sent as images:

- **Bar/column charts** — Read values, compare categories
- **Line charts** — Identify trends, inflection points
- **Pie charts** — Read proportions, identify segments
- **Dashboards** — Summarize multiple metrics

**Best practice:** Send the chart as an image to a vision-capable model with a specific question: "What's the trend in Q1 vs Q2?" rather than "Describe this chart."

## When to Use Vision Tools vs Direct Image Input

| Scenario | Approach | Why |
|----------|----------|-----|
| Read text from screenshot | Direct image to LLM | Claude handles OCR natively |
| Compare two UI states | Screenshot diff tool | Pixel-level comparison is faster/cheaper |
| Verify element exists | DOM inspection tool | More reliable than visual check |
| Check CSS styling | Computed styles tool | Exact values, not visual estimation |
| Understand chart data | Direct image to LLM | Vision models interpret charts well |
| Detect visual regression | Pixelmatch tool | Programmatic diff is definitive |
| Process batch of documents | OCR tool | More cost-effective at scale |
| Read handwritten text | Direct image to LLM | Vision models handle handwriting |

**Rule of thumb:** Use direct image input for understanding and interpretation. Use specialized tools for measurement, comparison, and batch processing.

## Resources

- [Playwright Documentation — Screenshots](https://playwright.dev/docs/screenshots) — Official Playwright guide to screenshot capture and visual testing
- [Anthropic Vision Documentation](https://docs.anthropic.com/en/docs/build-with-claude/vision) — How to send images to Claude for visual understanding

## Image References

1. Playwright screenshot automation — "Playwright screenshot automation browser testing visual comparison"
2. OCR pipeline architecture — "OCR optical character recognition pipeline architecture document processing"
3. Accessibility tree structure — "accessibility tree DOM structure ARIA roles semantic HTML diagram"
4. Visual regression testing flow — "visual regression testing screenshot diff before after comparison"
5. Document understanding pipeline — "document understanding AI pipeline PDF table extraction structured data"

## Video References

1. [Computer Vision for Developers — Fireship](https://www.youtube.com/watch?v=OcycT1Jwsns) — Fast overview of computer vision tools and capabilities
2. [Claude Vision — Anthropic](https://www.youtube.com/watch?v=lItIMqxwxGc) — Practical examples of Claude's vision capabilities for document understanding
