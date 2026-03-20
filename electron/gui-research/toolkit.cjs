/**
 * GUI Toolkit — Low-Level Action Primitives
 *
 * Pixel-level operations that the GUI agent uses to interact with screens.
 * Each primitive is atomic, verifiable, and logged.
 *
 * Every action follows: locate → verify → execute → confirm
 * No blind clicks. No acting without verification.
 *
 * Research only.
 */

// ── Action Primitives ───────────────────────────────────────────────────────

/**
 * @typedef {Object} LocateResult
 * @property {boolean} found
 * @property {number} x - center x of located element
 * @property {number} y - center y of located element
 * @property {Object} bbox - bounding box {x, y, width, height}
 * @property {number} confidence - location confidence [0, 1]
 * @property {string} method - how it was located (visual, text, position, convention)
 */

/**
 * @typedef {Object} ActionResult
 * @property {boolean} success
 * @property {string} action - what was attempted
 * @property {Object} target - element acted on
 * @property {number} timestamp
 * @property {string|null} verification - post-action verification result
 * @property {string|null} error
 */

/**
 * Locate an element on screen using multiple strategies.
 * Returns center coordinates + confidence.
 *
 * Strategies (tried in order):
 *   1. Text match — find element by visible text
 *   2. Icon match — find element by icon type (gear, magnifying glass, etc.)
 *   3. Position convention — expected region based on spatialTruths
 *   4. Visual similarity — compare to known element templates
 */
function locate(params) {
  // params: { text?, icon?, region?, elementType?, near? }
  return {
    type: "locate",
    params,
    execute: async (visionAnalysis) => {
      const elements = visionAnalysis.uiElements || [];

      // Strategy 1: Text match
      if (params.text) {
        const textMatch = elements.find((el) =>
          el.label && el.label.toLowerCase().includes(params.text.toLowerCase())
        );
        if (textMatch) {
          return {
            found: true,
            x: textMatch.bbox.x + textMatch.bbox.width / 2,
            y: textMatch.bbox.y + textMatch.bbox.height / 2,
            bbox: textMatch.bbox,
            confidence: 0.95,
            method: "text",
            element: textMatch,
          };
        }
      }

      // Strategy 2: Icon match
      if (params.icon) {
        const iconMatch = elements.find((el) =>
          el.type === "icon" && el.function &&
          el.function.toLowerCase().includes(params.icon.toLowerCase())
        );
        if (iconMatch) {
          return {
            found: true,
            x: iconMatch.bbox.x + iconMatch.bbox.width / 2,
            y: iconMatch.bbox.y + iconMatch.bbox.height / 2,
            bbox: iconMatch.bbox,
            confidence: 0.85,
            method: "icon",
            element: iconMatch,
          };
        }
      }

      // Strategy 3: Region convention
      if (params.region) {
        const regionMatches = elements.filter((el) => {
          const cx = el.bbox.x + el.bbox.width / 2;
          const cy = el.bbox.y + el.bbox.height / 2;
          return isInRegion(cx, cy, params.region, visionAnalysis.screenDimensions);
        });
        if (regionMatches.length === 1) {
          const match = regionMatches[0];
          return {
            found: true,
            x: match.bbox.x + match.bbox.width / 2,
            y: match.bbox.y + match.bbox.height / 2,
            bbox: match.bbox,
            confidence: 0.70,
            method: "position",
            element: match,
          };
        }
      }

      // Strategy 4: Element type match
      if (params.elementType) {
        const typeMatch = elements.find((el) => el.type === params.elementType);
        if (typeMatch) {
          return {
            found: true,
            x: typeMatch.bbox.x + typeMatch.bbox.width / 2,
            y: typeMatch.bbox.y + typeMatch.bbox.height / 2,
            bbox: typeMatch.bbox,
            confidence: 0.60,
            method: "type",
            element: typeMatch,
          };
        }
      }

      return { found: false, confidence: 0, method: "none", error: "Element not found" };
    },
  };
}

/**
 * Click at coordinates with center-targeting.
 * Always targets element CENTER, not arbitrary point.
 */
function click(params) {
  // params: { x, y, verify?, description? }
  return {
    type: "click",
    params,
    requiresVerification: params.verify || null,
    description: params.description || `Click at (${params.x}, ${params.y})`,
  };
}

/**
 * Type text into the currently focused element.
 */
function type(params) {
  // params: { text, clearFirst?, verify? }
  return {
    type: "type",
    params,
    requiresVerification: params.verify || null,
    description: `Type "${params.text}"${params.clearFirst ? " (clear first)" : ""}`,
  };
}

/**
 * Scroll in a direction until a condition is met.
 */
function scroll(params) {
  // params: { direction, until?, amount?, maxScrolls? }
  return {
    type: "scroll",
    params: {
      direction: params.direction || "down",
      until: params.until || null,
      amount: params.amount || 300,
      maxScrolls: params.maxScrolls || 10,
    },
    description: `Scroll ${params.direction}${params.until ? ` until ${params.until}` : ""}`,
  };
}

/**
 * Wait for a condition before proceeding.
 */
function wait(params) {
  // params: { condition?, durationMs?, maxWaitMs? }
  return {
    type: "wait",
    params: {
      condition: params.condition || "page_stable",
      durationMs: params.durationMs || 1000,
      maxWaitMs: params.maxWaitMs || 10000,
    },
    description: `Wait for ${params.condition || `${params.durationMs}ms`}`,
  };
}

/**
 * Verify a post-action condition.
 * Used after every action to confirm it had the intended effect.
 */
function verify(params) {
  // params: { condition, description? }
  return {
    type: "verify",
    params,
    description: params.description || `Verify: ${params.condition}`,
  };
}

/**
 * Request human intervention.
 * Agent has determined it cannot proceed with confidence.
 */
function requestHuman(params) {
  // params: { reason, suggestedAction?, options?, context? }
  return {
    type: "hil_request",
    params,
    description: `HIL Request: ${params.reason}`,
    confidence: 0, // By definition, agent is not confident
  };
}

// ── Composite Actions ───────────────────────────────────────────────────────

/**
 * Locate then click — the most common GUI operation.
 * Locate element → verify found → click center → verify result.
 */
function locateAndClick(locateParams, verifyCondition) {
  return {
    type: "composite",
    name: "locate_and_click",
    steps: [
      locate(locateParams),
      // click will use coordinates from locate result
      { type: "click_located", verify: verifyCondition },
    ],
    description: `Find and click: ${JSON.stringify(locateParams)}`,
  };
}

/**
 * Locate, click, then type — for form filling.
 */
function locateClickType(locateParams, text, verifyCondition) {
  return {
    type: "composite",
    name: "locate_click_type",
    steps: [
      locate(locateParams),
      { type: "click_located" },
      type({ text, clearFirst: true, verify: verifyCondition }),
    ],
    description: `Find, click, type "${text}" into: ${JSON.stringify(locateParams)}`,
  };
}

/**
 * Scroll until found, then click.
 */
function scrollToAndClick(scrollDirection, findParams, verifyCondition) {
  return {
    type: "composite",
    name: "scroll_to_and_click",
    steps: [
      scroll({ direction: scrollDirection, until: `element_visible:${JSON.stringify(findParams)}` }),
      locate(findParams),
      { type: "click_located", verify: verifyCondition },
    ],
    description: `Scroll ${scrollDirection} to find and click: ${JSON.stringify(findParams)}`,
  };
}

// ── Region Helper ───────────────────────────────────────────────────────────

function isInRegion(x, y, regionName, dimensions) {
  const nx = x / dimensions.width;
  const ny = y / dimensions.height;

  const regions = {
    "top-left": { xMin: 0, xMax: 0.3, yMin: 0, yMax: 0.15 },
    "top-center": { xMin: 0.2, xMax: 0.8, yMin: 0, yMax: 0.15 },
    "top-right": { xMin: 0.7, xMax: 1.0, yMin: 0, yMax: 0.15 },
    "center": { xMin: 0.1, xMax: 0.9, yMin: 0.15, yMax: 0.85 },
    "bottom-left": { xMin: 0, xMax: 0.3, yMin: 0.85, yMax: 1.0 },
    "bottom-center": { xMin: 0.2, xMax: 0.8, yMin: 0.85, yMax: 1.0 },
    "bottom-right": { xMin: 0.7, xMax: 1.0, yMin: 0.85, yMax: 1.0 },
    "left": { xMin: 0, xMax: 0.25, yMin: 0.1, yMax: 0.9 },
    "right": { xMin: 0.75, xMax: 1.0, yMin: 0.1, yMax: 0.9 },
  };

  const r = regions[regionName];
  if (!r) return false;
  return nx >= r.xMin && nx <= r.xMax && ny >= r.yMin && ny <= r.yMax;
}

// ── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  // Primitives
  locate,
  click,
  type,
  scroll,
  wait,
  verify,
  requestHuman,

  // Composites
  locateAndClick,
  locateClickType,
  scrollToAndClick,

  // Helpers
  isInRegion,
};
