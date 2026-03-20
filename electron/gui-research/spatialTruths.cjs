/**
 * Spatial Truths — Second-Pass Reward Shaping for GUI Agents
 *
 * First pass (spatialReward.cjs): Learn raw pixel precision
 * Second pass (this file): Inject UI truths that guide the agent
 *
 * Instead of discovering every UI convention from scratch through
 * trial and error, we encode known truths about how interfaces work.
 * These truths act as prior knowledge that shapes the reward landscape,
 * making correct actions more rewarding and incorrect actions less
 * ambiguous.
 *
 * Truth categories:
 *   1. Positional Conventions — where elements typically live
 *   2. Visual Affordances — what elements look like when interactive
 *   3. Semantic Patterns — what icons/text mean functionally
 *   4. State Indicators — how to read loading, error, success states
 *   5. Navigation Grammar — how apps flow from screen to screen
 *   6. Platform Conventions — Android vs iOS vs Web vs Desktop rules
 *   7. Temporal Patterns — when to wait, when to act, when to retry
 *
 * Research only.
 */

// ── Truth 1: Positional Conventions ─────────────────────────────────────────

/**
 * UI elements follow predictable spatial patterns.
 * Knowing these reduces the search space from "anywhere on screen"
 * to "in this region." A gear icon in the bottom-left should be
 * penalized — that's not where settings live.
 */
const POSITIONAL_CONVENTIONS = {
  // Navigation elements
  backButton: {
    expectedRegion: "top-left",
    confidence: 0.95,
    platforms: ["android", "ios", "web"],
    bounds: { xMin: 0, xMax: 0.15, yMin: 0, yMax: 0.08 },
  },
  hamburgerMenu: {
    expectedRegion: "top-left",
    confidence: 0.90,
    platforms: ["android", "web"],
    bounds: { xMin: 0, xMax: 0.12, yMin: 0, yMax: 0.08 },
  },
  settingsGear: {
    expectedRegion: "top-right",
    confidence: 0.85,
    platforms: ["android", "ios", "web"],
    bounds: { xMin: 0.80, xMax: 1.0, yMin: 0, yMax: 0.10 },
  },
  searchBar: {
    expectedRegion: "top-center",
    confidence: 0.90,
    platforms: ["android", "ios", "web"],
    bounds: { xMin: 0.15, xMax: 0.85, yMin: 0, yMax: 0.12 },
  },
  closeButton: {
    expectedRegion: "top-right",
    confidence: 0.90,
    platforms: ["android", "ios", "web", "desktop"],
    bounds: { xMin: 0.88, xMax: 1.0, yMin: 0, yMax: 0.06 },
  },

  // Action elements
  submitButton: {
    expectedRegion: "bottom-right",
    confidence: 0.85,
    platforms: ["web", "android"],
    bounds: { xMin: 0.55, xMax: 1.0, yMin: 0.85, yMax: 1.0 },
  },
  cancelButton: {
    expectedRegion: "bottom-left",
    confidence: 0.80,
    platforms: ["web", "android"],
    bounds: { xMin: 0, xMax: 0.45, yMin: 0.85, yMax: 1.0 },
  },
  fab: { // Floating Action Button
    expectedRegion: "bottom-right",
    confidence: 0.90,
    platforms: ["android"],
    bounds: { xMin: 0.80, xMax: 1.0, yMin: 0.85, yMax: 1.0 },
  },

  // Tab/Bottom navigation
  bottomNav: {
    expectedRegion: "bottom-center",
    confidence: 0.95,
    platforms: ["android", "ios"],
    bounds: { xMin: 0, xMax: 1.0, yMin: 0.90, yMax: 1.0 },
  },
  tabBar: {
    expectedRegion: "top",
    confidence: 0.85,
    platforms: ["web", "desktop"],
    bounds: { xMin: 0, xMax: 1.0, yMin: 0.05, yMax: 0.12 },
  },

  // Content areas
  mainContent: {
    expectedRegion: "center",
    confidence: 0.70,
    platforms: ["all"],
    bounds: { xMin: 0.05, xMax: 0.95, yMin: 0.10, yMax: 0.85 },
  },
  sidebar: {
    expectedRegion: "left",
    confidence: 0.80,
    platforms: ["web", "desktop"],
    bounds: { xMin: 0, xMax: 0.25, yMin: 0.08, yMax: 0.95 },
  },
};

// ── Truth 2: Visual Affordances ─────────────────────────────────────────────

/**
 * Interactive elements have visual cues that distinguish them from
 * static content. The agent should learn to recognize these.
 */
const VISUAL_AFFORDANCES = {
  // Clickable indicators
  clickable: {
    indicators: [
      "elevated/shadowed (material design card or button)",
      "colored differently from background (accent color)",
      "underlined text (hyperlink convention)",
      "cursor would change to pointer (not detectable from screenshot alone)",
      "has border or outline",
      "rounded rectangle shape (button convention)",
      "icon with no surrounding text (icon button)",
    ],
    nonClickable: [
      "flat text matching body color",
      "grayed out / reduced opacity (disabled state)",
      "part of a larger text block (paragraph content)",
      "decorative image without border/shadow",
    ],
  },

  // State indicators
  disabled: {
    visualCues: ["reduced opacity (40-60%)", "grayed out", "no shadow/elevation", "muted colors"],
    meaning: "Element exists but cannot be interacted with currently",
    agentAction: "DO NOT CLICK — find what enables this element first",
  },
  focused: {
    visualCues: ["blue/accent outline", "expanded input field", "cursor blinking"],
    meaning: "This element is currently selected for input",
    agentAction: "Type here — no need to click first",
  },
  loading: {
    visualCues: ["spinner animation", "skeleton placeholder", "progress bar", "shimmer effect"],
    meaning: "Content is being fetched — screen state is INCOMPLETE",
    agentAction: "WAIT — do not act on partially loaded content",
  },
  error: {
    visualCues: ["red border", "red text", "exclamation icon", "shake animation"],
    meaning: "Previous action failed or input is invalid",
    agentAction: "Read error message, correct the input, retry",
  },
  success: {
    visualCues: ["green checkmark", "green text", "toast notification", "confetti"],
    meaning: "Action completed successfully",
    agentAction: "Proceed to next step — this subgoal is complete",
  },
};

// ── Truth 3: Semantic Patterns ──────────────────────────────────────────────

/**
 * Icons and text have functional meaning beyond their visual appearance.
 * A gear icon means "settings" — but ONLY in certain contexts.
 */
const SEMANTIC_PATTERNS = {
  icons: {
    gear: { meanings: ["settings", "preferences", "configuration"], notMeanings: ["loading", "processing"] },
    magnifyingGlass: { meanings: ["search", "find", "lookup"], notMeanings: ["zoom in"] },
    pencil: { meanings: ["edit", "compose", "modify"], notMeanings: ["draw"] },
    trash: { meanings: ["delete", "remove"], notMeanings: ["clean up"], dangerous: true },
    plus: { meanings: ["add", "create", "new"], notMeanings: ["expand", "zoom in"] },
    arrow_left: { meanings: ["back", "previous", "return"], notMeanings: ["move left"] },
    arrow_right: { meanings: ["forward", "next", "proceed"], notMeanings: ["move right"] },
    three_dots: { meanings: ["more options", "overflow menu", "context menu"], notMeanings: [] },
    three_lines: { meanings: ["menu", "navigation drawer", "hamburger"], notMeanings: ["list"] },
    heart: { meanings: ["favorite", "like", "save"], notMeanings: ["health"] },
    share: { meanings: ["share", "send to", "export"], notMeanings: [] },
    bell: { meanings: ["notifications", "alerts", "reminders"], notMeanings: ["sound"] },
    person: { meanings: ["profile", "account", "user"], notMeanings: ["contacts"] },
    home: { meanings: ["home screen", "main page", "dashboard"], notMeanings: [] },
    download: { meanings: ["download", "save locally"], notMeanings: ["move down"] },
    upload: { meanings: ["upload", "attach file"], notMeanings: ["move up"] },
  },

  // Dangerous actions — agent should escalate to HIL
  dangerousPatterns: [
    { text: /delete|remove|erase|destroy/i, risk: "data loss" },
    { text: /unsubscribe|deactivate|disable/i, risk: "service disruption" },
    { text: /pay|purchase|buy|checkout|order/i, risk: "financial" },
    { text: /send|post|publish|broadcast/i, risk: "public-facing action" },
    { text: /confirm|agree|accept terms/i, risk: "binding agreement" },
    { text: /format|reset|factory/i, risk: "irreversible" },
  ],

  // Text patterns that indicate actionable elements
  actionableText: [
    { pattern: /^(submit|save|done|confirm|ok|yes|apply|next|continue)$/i, type: "primary_action" },
    { pattern: /^(cancel|back|close|dismiss|no|skip)$/i, type: "secondary_action" },
    { pattern: /^(sign in|log in|sign up|register|create account)$/i, type: "auth_action" },
    { pattern: /^(learn more|read more|see all|view|details)$/i, type: "navigation" },
  ],
};

// ── Truth 4: Navigation Grammar ─────────────────────────────────────────────

/**
 * Apps follow predictable navigation flows. Understanding the grammar
 * of navigation reduces the search space for the next action.
 */
const NAVIGATION_GRAMMAR = {
  // Common flow patterns
  flows: {
    login: ["email_input", "password_input", "submit_button", "dashboard"],
    search: ["search_icon", "search_input", "type_query", "results_list", "select_result"],
    form: ["fill_fields_sequential", "scroll_if_needed", "submit_button", "confirmation"],
    checkout: ["cart_review", "shipping_info", "payment_info", "confirm_order", "receipt"],
    settings: ["settings_icon", "category_list", "select_category", "toggle_or_input", "save"],
  },

  // Transition rules
  rules: [
    { from: "list_view", validNext: ["select_item", "scroll", "search", "filter", "back"], invalidNext: ["submit", "checkout"] },
    { from: "detail_view", validNext: ["back", "edit", "delete", "share", "scroll"], invalidNext: ["search"] },
    { from: "form_view", validNext: ["fill_field", "scroll", "submit", "cancel"], invalidNext: ["search", "navigate_away"] },
    { from: "modal_dialog", validNext: ["confirm", "cancel", "close"], invalidNext: ["navigate_away", "scroll_behind"] },
    { from: "loading_state", validNext: ["wait"], invalidNext: ["click_anything", "navigate", "type"] },
  ],
};

// ── Truth 5: Temporal Patterns ──────────────────────────────────────────────

/**
 * When to wait, when to act, when to retry.
 */
const TEMPORAL_PATTERNS = {
  // Wait conditions — agent MUST wait, not act
  mustWait: [
    { condition: "loading spinner visible", minWaitMs: 1000, maxWaitMs: 10000 },
    { condition: "progress bar active", minWaitMs: 500, maxWaitMs: 30000 },
    { condition: "page transition animating", minWaitMs: 300, maxWaitMs: 1000 },
    { condition: "toast notification showing", minWaitMs: 2000, maxWaitMs: 5000 },
    { condition: "form just submitted", minWaitMs: 1000, maxWaitMs: 5000 },
  ],

  // Retry conditions — previous action may not have registered
  shouldRetry: [
    { condition: "clicked but nothing changed", maxRetries: 2, delayMs: 500 },
    { condition: "typed but field is empty", maxRetries: 1, delayMs: 300 },
    { condition: "scrolled but content didn't move", maxRetries: 1, delayMs: 500 },
  ],

  // Never retry — action was registered, outcome is just slow
  neverRetry: [
    "payment processing",
    "file uploading",
    "account creating",
    "order submitting",
  ],
};

// ── Reward Shaping Functions ────────────────────────────────────────────────

/**
 * Calculate positional convention reward — is the click where this
 * element type is expected to be?
 *
 * If clicking a "settings" element, is it in the top-right where
 * settings icons conventionally live?
 */
function calcPositionalConventionReward(click, screenDimensions, elementType, platform) {
  const convention = POSITIONAL_CONVENTIONS[elementType];
  if (!convention) return 0.5; // No convention known — neutral

  if (convention.platforms.length > 0 &&
      !convention.platforms.includes(platform) &&
      !convention.platforms.includes("all")) {
    return 0.5; // Convention doesn't apply to this platform
  }

  // Normalize click to [0, 1] space
  const nx = click.x / screenDimensions.width;
  const ny = click.y / screenDimensions.height;

  const b = convention.bounds;
  const inRegion = nx >= b.xMin && nx <= b.xMax && ny >= b.yMin && ny <= b.yMax;

  if (inRegion) {
    return convention.confidence; // Click is where convention says it should be
  }

  // Penalty proportional to distance from expected region
  const regionCenterX = (b.xMin + b.xMax) / 2;
  const regionCenterY = (b.yMin + b.yMax) / 2;
  const dist = Math.sqrt((nx - regionCenterX) ** 2 + (ny - regionCenterY) ** 2);

  return Math.max(0.1, convention.confidence * Math.exp(-dist * 3));
}

/**
 * Calculate danger escalation reward — did the agent correctly
 * identify a dangerous action and escalate to HIL?
 */
function calcDangerEscalationReward(elementText, askedForHelp) {
  const isDangerous = SEMANTIC_PATTERNS.dangerousPatterns.some(
    (p) => p.text.test(elementText || "")
  );

  if (isDangerous) {
    if (askedForHelp) return 1.0;  // Correct: dangerous + escalated
    return 0.0;                     // Wrong: dangerous + acted autonomously
  }

  // Not dangerous — acting is fine
  return askedForHelp ? 0.5 : 0.8; // Slight preference for autonomous on safe actions
}

/**
 * Calculate navigation grammar reward — does this action follow
 * the expected flow pattern?
 */
function calcNavigationGrammarReward(currentViewType, proposedAction) {
  const rule = NAVIGATION_GRAMMAR.rules.find((r) => r.from === currentViewType);
  if (!rule) return 0.5; // No rule for this view — neutral

  if (rule.validNext.includes(proposedAction)) return 1.0;
  if (rule.invalidNext.includes(proposedAction)) return 0.0;

  return 0.3; // Action not explicitly valid or invalid
}

/**
 * Calculate temporal pattern reward — is the agent respecting
 * wait/retry conventions?
 */
function calcTemporalPatternReward(screenState, proposedAction, timeSinceLastAction) {
  // Check if agent should be waiting
  for (const wait of TEMPORAL_PATTERNS.mustWait) {
    if (screenState.includes(wait.condition)) {
      if (proposedAction === "wait") return 1.0; // Correct: waiting when should wait
      if (timeSinceLastAction < wait.minWaitMs) return 0.0; // Wrong: acting too fast
      return 0.3; // Waited some but maybe not enough
    }
  }

  // Check never-retry conditions
  for (const nr of TEMPORAL_PATTERNS.neverRetry) {
    if (screenState.includes(nr) && proposedAction === "retry") {
      return 0.0; // Wrong: retrying something that's just slow
    }
  }

  return 0.7; // Default: no timing constraint violated
}

/**
 * Composite second-pass truth reward.
 * Combines all truth signals into a single shaping reward.
 */
function calculateTruthReward({
  click,
  screenDimensions,
  elementType,
  elementText,
  platform,
  currentViewType,
  proposedAction,
  screenState,
  askedForHelp,
  timeSinceLastAction,
}) {
  const components = {
    positional: calcPositionalConventionReward(click, screenDimensions, elementType, platform),
    danger: calcDangerEscalationReward(elementText, askedForHelp),
    navigation: calcNavigationGrammarReward(currentViewType, proposedAction),
    temporal: calcTemporalPatternReward(screenState || "", proposedAction, timeSinceLastAction || 1000),
  };

  const weights = {
    positional: 0.30,
    danger: 0.30,
    navigation: 0.25,
    temporal: 0.15,
  };

  let total = 0;
  for (const [key, weight] of Object.entries(weights)) {
    total += (components[key] || 0.5) * weight;
  }

  return {
    total: Math.round(Math.min(total, 1.0) * 1000) / 1000,
    ...components,
    truthsApplied: Object.entries(components)
      .filter(([, v]) => v !== 0.5)
      .map(([k]) => k),
  };
}

// ── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  calculateTruthReward,
  calcPositionalConventionReward,
  calcDangerEscalationReward,
  calcNavigationGrammarReward,
  calcTemporalPatternReward,
  POSITIONAL_CONVENTIONS,
  VISUAL_AFFORDANCES,
  SEMANTIC_PATTERNS,
  NAVIGATION_GRAMMAR,
  TEMPORAL_PATTERNS,
};
