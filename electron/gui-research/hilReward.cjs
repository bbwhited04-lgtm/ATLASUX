/**
 * HIL (Human-in-the-Loop) Soft Hybrid Reward Component
 *
 * Traditional reward models penalize agents for NOT acting. This inverts that:
 * an agent that correctly identifies uncertainty and requests human assistance
 * receives a POSITIVE reward signal. "If you don't know, don't speak" is
 * a rewarded behavior, not a failure.
 *
 * Reward philosophy:
 *   - Confident correct action → high reward (standard)
 *   - Confident WRONG action → strong penalty (overconfidence)
 *   - Uncertain + asks for help → moderate reward (self-awareness)
 *   - Uncertain + acts anyway → penalty (reckless)
 *   - Knows it needs help + specifies WHAT help → highest HIL reward
 *
 * This creates a gradient where the model learns:
 *   1. Act when confident and correct
 *   2. Ask when uncertain (don't guess)
 *   3. Be specific about what you need from the human
 *   4. Never act recklessly on low confidence
 */

// ── HIL Action Types ────────────────────────────────────────────────────────

const HIL_ACTIONS = {
  // Agent requests human to perform the action
  REQUEST_CLICK: "request_click",       // "Please click this element for me"
  REQUEST_TYPE: "request_type",         // "Please type this value"
  REQUEST_VERIFY: "request_verify",     // "Can you verify this is correct?"
  REQUEST_DECIDE: "request_decide",     // "Which option should I choose?"
  REQUEST_NAVIGATE: "request_navigate", // "Please navigate to this page"
  REQUEST_WAIT: "request_wait",         // "I need to wait for something — tell me when ready"

  // Agent provides context with the request
  EXPLAIN_UNCERTAINTY: "explain_uncertainty", // "I'm not sure because..."
  SUGGEST_OPTIONS: "suggest_options",         // "I think it's A or B, which one?"
  DESCRIBE_OBSTACLE: "describe_obstacle",     // "I can't proceed because..."
};

// ── HIL Reward Weights ──────────────────────────────────────────────────────

const HIL_WEIGHTS = {
  // Core HIL decision quality
  correctEscalation: 0.30,      // Asked for help when genuinely uncertain
  specificRequest: 0.20,        // Described what help is needed
  uncertaintyCalibration: 0.15, // Confidence matched actual difficulty
  contextQuality: 0.15,         // Gave human enough info to help efficiently
  avoidedRecklessAction: 0.10,  // Didn't act on low confidence
  humanEfficiency: 0.10,        // Minimized human effort in the request
};

// ── Component Calculators ───────────────────────────────────────────────────

/**
 * R_HIL_1: Correct Escalation — did the agent ask for help when it should have?
 *
 * Scenarios:
 *   - Low confidence + asked → 1.0 (correct escalation)
 *   - Low confidence + acted → 0.0 (should have asked)
 *   - High confidence + asked → 0.3 (unnecessary escalation, but safe)
 *   - High confidence + acted correctly → 0.8 (good autonomous action)
 *   - High confidence + acted wrong → 0.0 (overconfident failure)
 */
function calcCorrectEscalation(confidence, askedForHelp, actionWasCorrect) {
  const CONFIDENCE_THRESHOLD = 0.7;

  if (confidence < CONFIDENCE_THRESHOLD) {
    // Low confidence zone
    if (askedForHelp) return 1.0;  // Correct: asked when uncertain
    if (actionWasCorrect) return 0.4; // Lucky: acted uncertain but got it right
    return 0.0; // Bad: acted uncertain and got it wrong
  } else {
    // High confidence zone
    if (askedForHelp) return 0.3; // Cautious but unnecessary
    if (actionWasCorrect) return 0.8; // Good: confident and correct
    return 0.0; // Bad: confident but wrong
  }
}

/**
 * R_HIL_2: Request Specificity — did the agent explain WHAT help it needs?
 *
 * "I need help" → 0.3
 * "Please click the submit button" → 0.7
 * "Please click the blue Submit button in the bottom-right, I'm unsure
 *  if it's the 'Submit Order' or 'Submit Review' button" → 1.0
 */
function calcSpecificRequest(hilAction, requestDetails) {
  if (!hilAction) return 0.0; // Didn't ask for help

  let score = 0.3; // Base: asked for help at all

  // Has a specific action type?
  if (hilAction.startsWith("request_")) score += 0.2;

  // Has details about what to do?
  if (requestDetails) {
    const detail = requestDetails.toLowerCase();
    if (detail.length > 20) score += 0.1; // Substantive description
    if (detail.includes("because") || detail.includes("unsure")) score += 0.1; // Explains why
    if (detail.includes("option") || detail.includes("choose") || detail.includes("which")) score += 0.1; // Presents options
  }

  return Math.min(score, 1.0);
}

/**
 * R_HIL_3: Uncertainty Calibration — does the model's confidence match
 * the actual difficulty of the action?
 *
 * Perfect calibration: confident on easy tasks, uncertain on hard ones.
 * Measured by comparing confidence to human agreement rate.
 */
function calcUncertaintyCalibration(confidence, taskDifficulty) {
  // taskDifficulty: 0 = trivial, 1 = impossible
  // Perfect calibration: confidence = 1 - taskDifficulty

  const expectedConfidence = 1.0 - taskDifficulty;
  const calibrationError = Math.abs(confidence - expectedConfidence);

  // Gaussian reward centered on perfect calibration
  return Math.exp(-(calibrationError * calibrationError) / (2 * 0.3 * 0.3));
}

/**
 * R_HIL_4: Context Quality — did the agent give the human enough
 * information to help efficiently?
 *
 * Scores based on what context was provided with the help request.
 */
function calcContextQuality(contextProvided) {
  if (!contextProvided) return 0.0;

  let score = 0.0;

  // Described what's on screen?
  if (contextProvided.screenDescription) score += 0.2;

  // Identified the current task state?
  if (contextProvided.taskProgress) score += 0.2;

  // Explained what went wrong or what's confusing?
  if (contextProvided.uncertainty) score += 0.2;

  // Suggested possible actions?
  if (contextProvided.suggestedOptions && contextProvided.suggestedOptions.length > 0) score += 0.2;

  // Provided the screenshot reference?
  if (contextProvided.screenshotRef) score += 0.2;

  return Math.min(score, 1.0);
}

/**
 * R_HIL_5: Avoided Reckless Action — reward for NOT acting when uncertain.
 *
 * This is the constitutional "if you don't know, don't speak" reward.
 * Binary: did the agent respect its own uncertainty?
 */
function calcAvoidedRecklessAction(confidence, askedForHelp, acted) {
  const RECKLESS_THRESHOLD = 0.5;

  if (confidence < RECKLESS_THRESHOLD) {
    if (askedForHelp && !acted) return 1.0; // Perfect: low confidence, asked, didn't act
    if (!askedForHelp && !acted) return 0.7; // OK: low confidence, froze (but didn't ask)
    if (acted) return 0.0; // Bad: low confidence but acted anyway
  }

  // Above threshold — acting is fine
  return acted ? 0.8 : 0.5; // Slight preference for action when confident
}

/**
 * R_HIL_6: Human Efficiency — did the request minimize human effort?
 *
 * "Help me" requires human to figure out everything → low score
 * "Click the red button at coordinates (340, 520)" → human just clicks → high score
 */
function calcHumanEfficiency(hilAction, requestDetails, suggestedOptions) {
  let score = 0.3; // Base

  // Specific action type reduces human cognitive load
  if (hilAction === HIL_ACTIONS.REQUEST_CLICK) score += 0.2;
  if (hilAction === HIL_ACTIONS.REQUEST_VERIFY) score += 0.15; // Just yes/no

  // Options reduce decision space
  if (suggestedOptions && suggestedOptions.length > 0) {
    score += Math.min(0.2, 0.1 * suggestedOptions.length); // 2 options = less work than open-ended
    if (suggestedOptions.length <= 3) score += 0.1; // Don't overwhelm with options
  }

  // Coordinates provided = human just clicks
  if (requestDetails && /\d+.*\d+/.test(requestDetails)) score += 0.1;

  return Math.min(score, 1.0);
}

// ── Composite HIL Reward ────────────────────────────────────────────────────

/**
 * Calculate the full HIL soft hybrid reward.
 *
 * @param {Object} params
 * @param {number} params.confidence - model's confidence [0, 1]
 * @param {boolean} params.askedForHelp - did the model request HIL?
 * @param {boolean} params.acted - did the model take an autonomous action?
 * @param {boolean} params.actionWasCorrect - was the action right? (ground truth)
 * @param {string|null} params.hilAction - type of help requested
 * @param {string|null} params.requestDetails - details of the help request
 * @param {number} params.taskDifficulty - estimated difficulty [0, 1]
 * @param {Object|null} params.contextProvided - context given with help request
 * @param {string[]|null} params.suggestedOptions - options presented to human
 * @param {Object} params.weights - component weights (optional)
 * @returns {Object} reward breakdown
 */
function calculateHILReward({
  confidence,
  askedForHelp,
  acted,
  actionWasCorrect = null,
  hilAction = null,
  requestDetails = null,
  taskDifficulty = 0.5,
  contextProvided = null,
  suggestedOptions = null,
  weights = HIL_WEIGHTS,
}) {
  const components = {
    correctEscalation: calcCorrectEscalation(confidence, askedForHelp, actionWasCorrect),
    specificRequest: calcSpecificRequest(hilAction, requestDetails),
    uncertaintyCalibration: calcUncertaintyCalibration(confidence, taskDifficulty),
    contextQuality: calcContextQuality(contextProvided),
    avoidedRecklessAction: calcAvoidedRecklessAction(confidence, askedForHelp, acted),
    humanEfficiency: calcHumanEfficiency(hilAction, requestDetails, suggestedOptions),
  };

  // Weighted composite
  let total = 0;
  for (const [key, weight] of Object.entries(weights)) {
    total += (components[key] || 0) * weight;
  }

  // Build explanation
  const decision = askedForHelp ? "ASKED FOR HELP" : acted ? "ACTED AUTONOMOUSLY" : "FROZE";
  const outcome = actionWasCorrect === null ? "unknown" : actionWasCorrect ? "correct" : "incorrect";

  const explanation = [
    `Decision: ${decision} (confidence: ${(confidence * 100).toFixed(0)}%)`,
    `Outcome: ${outcome}`,
    `Escalation: ${(components.correctEscalation * 100).toFixed(0)}% (${askedForHelp ? "asked when should have" : "didn't ask"})`,
    `Specificity: ${(components.specificRequest * 100).toFixed(0)}% (${hilAction || "no request"})`,
    `Calibration: ${(components.uncertaintyCalibration * 100).toFixed(0)}% (difficulty: ${(taskDifficulty * 100).toFixed(0)}%)`,
    `Context: ${(components.contextQuality * 100).toFixed(0)}% (${contextProvided ? "provided" : "none"})`,
    `Safety: ${(components.avoidedRecklessAction * 100).toFixed(0)}% (${confidence < 0.5 && !acted ? "correctly cautious" : "standard"})`,
    `Efficiency: ${(components.humanEfficiency * 100).toFixed(0)}% human effort optimization`,
    `─── HIL reward: ${(total * 100).toFixed(1)}%`,
  ].join("\n");

  return {
    total: Math.round(total * 1000) / 1000,
    ...components,
    decision,
    explanation,
  };
}

// ── Combined Dense Spatial + HIL Reward ─────────────────────────────────────

/**
 * Merge spatial reward (from spatialReward.cjs) with HIL reward.
 *
 * When agent acts autonomously: spatial reward dominates
 * When agent asks for help: HIL reward dominates
 * Mixed: weighted blend based on whether help was requested
 */
function calculateHybridReward(spatialReward, hilReward, askedForHelp) {
  if (askedForHelp) {
    // HIL dominates — acting on help requests scores differently
    return {
      total: Math.round((0.3 * spatialReward.total + 0.7 * hilReward.total) * 1000) / 1000,
      spatial: spatialReward.total,
      hil: hilReward.total,
      mode: "HIL_DOMINANT",
      explanation: `HIL mode: spatial=${(spatialReward.total * 100).toFixed(1)}% hil=${(hilReward.total * 100).toFixed(1)}%`,
    };
  } else {
    // Spatial dominates — autonomous action
    return {
      total: Math.round((0.7 * spatialReward.total + 0.3 * hilReward.total) * 1000) / 1000,
      spatial: spatialReward.total,
      hil: hilReward.total,
      mode: "SPATIAL_DOMINANT",
      explanation: `Auto mode: spatial=${(spatialReward.total * 100).toFixed(1)}% hil=${(hilReward.total * 100).toFixed(1)}%`,
    };
  }
}

// ── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  calculateHILReward,
  calculateHybridReward,
  calcCorrectEscalation,
  calcSpecificRequest,
  calcUncertaintyCalibration,
  calcContextQuality,
  calcAvoidedRecklessAction,
  calcHumanEfficiency,
  HIL_ACTIONS,
  HIL_WEIGHTS,
};
