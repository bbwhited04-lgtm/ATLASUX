/**
 * MCP Task Descriptor — High-Level Abstract Task Descriptions
 *
 * The MCP layer speaks INTENT, not pixels. It describes what needs
 * to happen without specifying how. The CoT reasoning layer translates
 * intent into toolkit primitives using spatial truths.
 *
 * Architecture:
 *   MCP (this file) → "Change notification settings"
 *       ↓
 *   CoT Reasoning → "Settings = gear icon, top-right. Scroll to notifications."
 *       ↓
 *   Toolkit (toolkit.cjs) → locate() → click() → scroll() → click()
 *       ↓
 *   Spatial Reward (spatialReward.cjs) → score each click's precision
 *       ↓
 *   HIL Gate (hilReward.cjs) → escalate if confidence < threshold
 *
 * Research only.
 */

// ── Task Descriptor Schema ──────────────────────────────────────────────────

/**
 * @typedef {Object} MCPTask
 * @property {string} id - unique task identifier
 * @property {string} intent - what the user wants (natural language)
 * @property {string} app - target application
 * @property {string} category - task category (navigation, form, search, settings, etc.)
 * @property {string[]} subgoals - ordered intermediate goals
 * @property {Object} preconditions - what must be true before starting
 * @property {Object} postconditions - what must be true when done
 * @property {string} riskLevel - low, medium, high (determines HIL threshold)
 * @property {number} estimatedSteps - expected number of toolkit actions
 * @property {Object} context - additional context for CoT reasoning
 */

/**
 * Create an MCP task descriptor from natural language.
 * This is what the high-level orchestrator produces.
 */
function createTask({
  intent,
  app,
  category = "general",
  subgoals = [],
  preconditions = {},
  postconditions = {},
  riskLevel = "low",
  estimatedSteps = null,
  context = {},
}) {
  return {
    id: `mcp-task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    intent,
    app,
    category,
    subgoals: subgoals.length > 0 ? subgoals : inferSubgoals(intent, category),
    preconditions,
    postconditions,
    riskLevel,
    estimatedSteps: estimatedSteps || estimateSteps(category, subgoals.length),
    context,
    createdAt: new Date().toISOString(),
  };
}

// ── Task Templates ──────────────────────────────────────────────────────────

/**
 * Pre-defined task templates for common GUI workflows.
 * The agent learns these patterns and can decompose new tasks
 * by analogy to known templates.
 */
const TASK_TEMPLATES = {
  // Navigation tasks
  navigate_to_page: {
    category: "navigation",
    subgoalPattern: ["locate_navigation", "click_target", "verify_page_loaded"],
    riskLevel: "low",
    avgSteps: 3,
  },

  navigate_to_settings: {
    category: "settings",
    subgoalPattern: ["find_settings_icon", "click_settings", "verify_settings_page"],
    riskLevel: "low",
    avgSteps: 3,
    conventions: { settingsIcon: "top-right", iconType: "gear" },
  },

  // Search tasks
  search_for_item: {
    category: "search",
    subgoalPattern: ["find_search", "click_search", "type_query", "wait_results", "review_results"],
    riskLevel: "low",
    avgSteps: 5,
    conventions: { searchIcon: "top-center", iconType: "magnifying_glass" },
  },

  // Form tasks
  fill_form: {
    category: "form",
    subgoalPattern: ["locate_first_field", "fill_fields_sequential", "scroll_if_needed", "submit", "verify_submission"],
    riskLevel: "medium",
    avgSteps: 10,
    conventions: { submitButton: "bottom-right", cancelButton: "bottom-left" },
  },

  // Settings change
  change_setting: {
    category: "settings",
    subgoalPattern: ["open_settings", "find_category", "locate_setting", "change_value", "save_or_confirm"],
    riskLevel: "medium",
    avgSteps: 7,
  },

  // Content interaction
  read_and_respond: {
    category: "content",
    subgoalPattern: ["navigate_to_content", "read_content", "locate_response_area", "compose_response", "submit"],
    riskLevel: "medium",
    avgSteps: 8,
  },

  // Destructive actions
  delete_item: {
    category: "destructive",
    subgoalPattern: ["locate_item", "find_delete_action", "HIL_confirm_delete", "execute_delete", "verify_deletion"],
    riskLevel: "high",
    avgSteps: 5,
    requiresHIL: true,
  },

  // Purchase/payment
  make_purchase: {
    category: "financial",
    subgoalPattern: ["select_item", "add_to_cart", "proceed_to_checkout", "fill_payment", "HIL_confirm_payment", "verify_order"],
    riskLevel: "high",
    avgSteps: 12,
    requiresHIL: true,
  },

  // Authentication
  login: {
    category: "auth",
    subgoalPattern: ["find_login", "enter_email", "enter_password", "click_submit", "verify_logged_in"],
    riskLevel: "medium",
    avgSteps: 5,
  },
};

// ── Subgoal Inference ───────────────────────────────────────────────────────

/**
 * Infer subgoals from intent and category when not explicitly provided.
 * Uses task templates as a starting point and adapts based on intent keywords.
 */
function inferSubgoals(intent, category) {
  const lower = intent.toLowerCase();

  // Match to closest template
  for (const [name, template] of Object.entries(TASK_TEMPLATES)) {
    if (template.category === category) {
      return template.subgoalPattern.map((sg, i) => ({
        id: `sg-${i}`,
        description: sg.replace(/_/g, " "),
        order: i,
        critical: sg.includes("verify") || sg.includes("HIL") || sg.includes("submit"),
        weight: sg.includes("HIL") ? 1.0 : 0.7,
      }));
    }
  }

  // Generic subgoals based on intent keywords
  const subgoals = [];

  if (lower.includes("find") || lower.includes("search") || lower.includes("locate")) {
    subgoals.push({ id: "sg-0", description: "Locate target element", order: 0, critical: false, weight: 0.5 });
  }
  if (lower.includes("click") || lower.includes("open") || lower.includes("select")) {
    subgoals.push({ id: "sg-1", description: "Interact with target", order: 1, critical: false, weight: 0.6 });
  }
  if (lower.includes("type") || lower.includes("enter") || lower.includes("fill")) {
    subgoals.push({ id: "sg-2", description: "Enter required information", order: 2, critical: true, weight: 0.8 });
  }
  if (lower.includes("submit") || lower.includes("save") || lower.includes("confirm")) {
    subgoals.push({ id: "sg-3", description: "Complete the action", order: 3, critical: true, weight: 1.0 });
  }

  // Always end with verification
  subgoals.push({ id: `sg-${subgoals.length}`, description: "Verify outcome", order: subgoals.length, critical: true, weight: 0.9 });

  return subgoals;
}

/**
 * Estimate number of toolkit steps from category and subgoal count.
 */
function estimateSteps(category, subgoalCount) {
  const template = Object.values(TASK_TEMPLATES).find((t) => t.category === category);
  if (template) return template.avgSteps;
  return Math.max(subgoalCount * 2, 3); // At least 2 actions per subgoal
}

// ── Task Decomposition ──────────────────────────────────────────────────────

/**
 * Decompose a high-level MCP task into a sequence of toolkit actions.
 * This is the CoT reasoning layer's job — translate intent to pixels.
 *
 * Returns a plan (not executed — just proposed for review).
 */
function decomposeTask(task) {
  const plan = {
    taskId: task.id,
    intent: task.intent,
    steps: [],
    totalEstimatedSteps: task.estimatedSteps,
    hilRequired: task.riskLevel === "high",
    confidenceThreshold: getConfidenceThreshold(task.riskLevel),
  };

  for (const subgoal of task.subgoals) {
    // Each subgoal becomes one or more toolkit actions
    const actions = subgoalToActions(subgoal, task);
    plan.steps.push({
      subgoalId: subgoal.id,
      subgoalDescription: subgoal.description,
      critical: subgoal.critical,
      actions,
      requiresHIL: subgoal.description.includes("HIL") || (subgoal.critical && task.riskLevel === "high"),
    });
  }

  return plan;
}

/**
 * Convert a subgoal description to toolkit action sequence.
 */
function subgoalToActions(subgoal, task) {
  const desc = subgoal.description.toLowerCase();
  const actions = [];

  if (desc.includes("locate") || desc.includes("find")) {
    actions.push({
      toolkit: "locate",
      params: { text: null, icon: null, region: null },
      note: "Vision model will determine locate parameters from screenshot",
    });
  }

  if (desc.includes("click") || desc.includes("interact") || desc.includes("open") || desc.includes("select")) {
    actions.push({
      toolkit: "locateAndClick",
      params: { verify: `${desc}_completed` },
      note: "Click center of located element, verify state change",
    });
  }

  if (desc.includes("type") || desc.includes("enter") || desc.includes("fill")) {
    actions.push({
      toolkit: "locateClickType",
      params: { text: "{{from_context}}", clearFirst: true },
      note: "Focus field, clear, type value from task context",
    });
  }

  if (desc.includes("scroll")) {
    actions.push({
      toolkit: "scroll",
      params: { direction: "down", until: "target_visible" },
      note: "Scroll until target element becomes visible",
    });
  }

  if (desc.includes("wait")) {
    actions.push({
      toolkit: "wait",
      params: { condition: "page_stable", maxWaitMs: 5000 },
      note: "Wait for page to stabilize before proceeding",
    });
  }

  if (desc.includes("verify") || desc.includes("confirm")) {
    actions.push({
      toolkit: "verify",
      params: { condition: `${task.postconditions?.success || "task_completed"}` },
      note: "Verify the expected outcome",
    });
  }

  if (desc.includes("hil")) {
    actions.push({
      toolkit: "requestHuman",
      params: { reason: desc, suggestedAction: "confirm_before_proceeding" },
      note: "CONSTITUTIONAL: Must get human approval before proceeding",
    });
  }

  // Default: at least one locate action if nothing matched
  if (actions.length === 0) {
    actions.push({
      toolkit: "locate",
      params: {},
      note: `Subgoal "${subgoal.description}" needs CoT to determine actions`,
    });
  }

  return actions;
}

/**
 * Get confidence threshold based on risk level.
 * Higher risk = higher threshold required to act autonomously.
 */
function getConfidenceThreshold(riskLevel) {
  switch (riskLevel) {
    case "low": return 0.60;      // Navigation, reading — OK to act with moderate confidence
    case "medium": return 0.75;   // Forms, settings — need good confidence
    case "high": return 0.90;     // Payments, deletions — near-certain or ask human
    default: return 0.70;
  }
}

// ── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  createTask,
  decomposeTask,
  inferSubgoals,
  estimateSteps,
  getConfidenceThreshold,
  TASK_TEMPLATES,
};
