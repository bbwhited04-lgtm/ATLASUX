/**
 * Dense Spatial Hybrid Reward Model (RLDR) for GUI Research
 *
 * Reinforcement Learning with Dense Rewards for GUI agents.
 * Scores proposed actions on spatial precision, geometric centrality,
 * and functional correctness — providing step-level training signal
 * instead of sparse task-completion-only rewards.
 *
 * Reward Components:
 *   1. Geometric Centrality — distance from click point to element center
 *   2. Bounding Box Containment — is the click inside the target element?
 *   3. Element Size Penalty — smaller targets need higher precision
 *   4. Spatial Confidence — model's uncertainty about click location
 *   5. Functional Correctness — did clicking this element do the right thing?
 *   6. Sequential Consistency — does this action follow logically from the last?
 *   7. Pixel Density Bonus — reward for hitting high-information regions
 *
 * Research only — generates training signal for analysis, not production use.
 */

// ── Types ───────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} BoundingBox
 * @property {number} x - top-left x
 * @property {number} y - top-left y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} ClickPoint
 * @property {number} x - predicted click x
 * @property {number} y - predicted click y
 */

/**
 * @typedef {Object} UIElement
 * @property {string} id - element identifier
 * @property {string} type - button, link, input, icon, text, etc.
 * @property {string} label - visible text or aria-label
 * @property {BoundingBox} bbox - bounding box on screen
 * @property {boolean} interactive - is it clickable?
 * @property {string} role - semantic role (navigation, action, input, display)
 */

/**
 * @typedef {Object} RewardBreakdown
 * @property {number} total - final composite reward [0, 1]
 * @property {number} geometricCentrality - distance-to-center score [0, 1]
 * @property {number} containment - inside bounding box? {0 or 1}
 * @property {number} sizePenalty - adjustment for target size [0.5, 1.0]
 * @property {number} spatialConfidence - model confidence mapped to reward [0, 1]
 * @property {number} functionalCorrectness - right element for the task? [0, 1]
 * @property {number} sequentialConsistency - logical follow-up? [0, 1]
 * @property {number} pixelDensity - information density at click point [0, 1]
 * @property {string} explanation - human-readable breakdown
 */

// ── Reward Weights ──────────────────────────────────────────────────────────

const DEFAULT_WEIGHTS = {
  geometricCentrality: 0.40,    // PRIMARY — did you hit the CENTER, not just the edge?
  containment: 0.15,            // Inside the element at all
  sizePenalty: 0.10,            // Harder targets (small icons) worth more
  spatialConfidence: 0.05,      // Calibrated confidence
  functionalCorrectness: 0.15,  // Right element for the task
  sequentialConsistency: 0.10,  // Logical action sequence
  pixelDensity: 0.05,          // Bonus for information-rich regions
};

// ── Component Calculators ───────────────────────────────────────────────────

/**
 * R1: Geometric Centrality — how close is the click to the element's center?
 * Uses normalized Euclidean distance with Gaussian falloff.
 *
 * Perfect center click = 1.0
 * Edge of element = ~0.6
 * Outside element = rapid decay toward 0
 */
function calcGeometricCentrality(click, bbox) {
  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;

  const dx = click.x - centerX;
  const dy = click.y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Normalize by element's "radius" (half-diagonal)
  const halfDiag = Math.sqrt(bbox.width * bbox.width + bbox.height * bbox.height) / 2;
  const normalizedDist = distance / Math.max(halfDiag, 1);

  // Tight Gaussian falloff: σ = 0.3 means center is high, edges drop fast
  // Center click = 1.0, edge of element ≈ 0.3, outside = near 0
  // This is intentionally strict — "close enough" is not good enough
  const sigma = 0.3;
  return Math.exp(-(normalizedDist * normalizedDist) / (2 * sigma * sigma));
}

/**
 * R2: Bounding Box Containment — binary, is click inside the element?
 * With soft margin: clicks just outside get partial credit.
 */
function calcContainment(click, bbox) {
  const margin = 5; // 5px soft margin

  const insideX = click.x >= (bbox.x - margin) && click.x <= (bbox.x + bbox.width + margin);
  const insideY = click.y >= (bbox.y - margin) && click.y <= (bbox.y + bbox.height + margin);

  if (insideX && insideY) {
    // Strict containment (no margin needed)
    const strictX = click.x >= bbox.x && click.x <= bbox.x + bbox.width;
    const strictY = click.y >= bbox.y && click.y <= bbox.y + bbox.height;
    return (strictX && strictY) ? 1.0 : 0.8; // Soft margin partial credit
  }

  return 0.0;
}

/**
 * R3: Element Size Penalty — smaller elements require more precision.
 * Hitting a 20x20 icon is harder than a 200x50 button.
 *
 * Returns multiplier: small targets get boosted reward (0.5-1.0 range).
 * Large targets get no boost (1.0). Tiny targets get up to 1.5x.
 */
function calcSizePenalty(bbox, screenDimensions) {
  const elementArea = bbox.width * bbox.height;
  const screenArea = screenDimensions.width * screenDimensions.height;
  const areaRatio = elementArea / screenArea;

  // Tiny elements (< 0.1% of screen) get max bonus
  // Large elements (> 2% of screen) get no bonus
  if (areaRatio < 0.001) return 1.5;  // Very small icon
  if (areaRatio < 0.005) return 1.2;  // Small button
  if (areaRatio < 0.01) return 1.1;   // Medium element
  return 1.0;                          // Large element
}

/**
 * R4: Spatial Confidence — reward calibrated confidence.
 * High confidence + correct = high reward
 * High confidence + wrong = penalty (overconfidence)
 * Low confidence + correct = moderate reward (underconfidence)
 */
function calcSpatialConfidence(modelConfidence, wasCorrect) {
  if (wasCorrect) {
    // Reward proportional to confidence (calibrated)
    return modelConfidence;
  } else {
    // Penalize overconfidence on wrong actions
    return Math.max(0, 1.0 - modelConfidence);
  }
}

/**
 * R5: Functional Correctness — is this the RIGHT element for the task?
 * A perfectly centered click on the wrong button scores 0.
 *
 * Requires ground truth: which element should have been clicked.
 */
function calcFunctionalCorrectness(clickedElement, targetElement) {
  if (!targetElement) return 0.5; // No ground truth — neutral

  // Exact match
  if (clickedElement.id === targetElement.id) return 1.0;

  // Same type and similar function
  if (clickedElement.type === targetElement.type &&
      clickedElement.role === targetElement.role) return 0.6;

  // Same semantic region (e.g., both in the navigation bar)
  if (clickedElement.role === targetElement.role) return 0.3;

  // Wrong element entirely
  return 0.0;
}

/**
 * R6: Sequential Consistency — does this action logically follow the previous?
 * Penalizes random jumping; rewards coherent navigation paths.
 */
function calcSequentialConsistency(currentAction, previousActions) {
  if (previousActions.length === 0) return 1.0; // First action is always consistent

  const lastAction = previousActions[previousActions.length - 1];

  // Same page, logical progression
  if (currentAction.type === "click" && lastAction.type === "click") {
    // Clicking submit after filling a form = highly consistent
    if (currentAction.target?.role === "action" && lastAction.target?.role === "input") return 1.0;
    // Clicking back after an error = consistent
    if (currentAction.target?.label?.toLowerCase().includes("back")) return 0.8;
    // Random click = low consistency
    return 0.5;
  }

  // Type after click (filling an input) = consistent
  if (currentAction.type === "type" && lastAction.type === "click") return 0.9;

  // Scroll to find elements = consistent
  if (currentAction.type === "scroll") return 0.7;

  // Wait after action = consistent (waiting for load)
  if (currentAction.type === "wait") return 0.8;

  return 0.5; // Neutral for unrecognized patterns
}

/**
 * R7: Pixel Density — reward clicking in information-rich regions.
 * Buttons with text > empty whitespace > decorative images.
 *
 * Uses element type and content as proxy for pixel information density.
 */
function calcPixelDensity(element) {
  const densityScores = {
    button: 0.9,
    link: 0.85,
    input: 0.8,
    icon: 0.7,
    text: 0.6,
    image: 0.4,
    container: 0.3,
    whitespace: 0.1,
  };

  const base = densityScores[element.type] || 0.5;

  // Bonus for elements with visible text (more information)
  const hasLabel = element.label && element.label.trim().length > 0;
  return hasLabel ? Math.min(base + 0.1, 1.0) : base;
}

// ── Composite Reward ────────────────────────────────────────────────────────

/**
 * Calculate the full dense spatial hybrid reward for a GUI action.
 *
 * @param {ClickPoint} click - where the model clicked
 * @param {UIElement} clickedElement - element at the click point
 * @param {UIElement|null} targetElement - ground truth target (if known)
 * @param {number} modelConfidence - model's confidence [0, 1]
 * @param {Object} currentAction - the proposed action
 * @param {Array} previousActions - action history
 * @param {Object} screenDimensions - {width, height} of the screen
 * @param {Object} weights - reward component weights (optional)
 * @returns {RewardBreakdown}
 */
function calculateReward(
  click,
  clickedElement,
  targetElement,
  modelConfidence,
  currentAction,
  previousActions,
  screenDimensions,
  weights = DEFAULT_WEIGHTS
) {
  const bbox = clickedElement.bbox;
  const isContained = calcContainment(click, bbox) > 0;

  const components = {
    geometricCentrality: calcGeometricCentrality(click, bbox),
    containment: calcContainment(click, bbox),
    sizePenalty: Math.min(calcSizePenalty(bbox, screenDimensions), 1.0),
    spatialConfidence: calcSpatialConfidence(modelConfidence, isContained),
    functionalCorrectness: calcFunctionalCorrectness(clickedElement, targetElement),
    sequentialConsistency: calcSequentialConsistency(currentAction, previousActions),
    pixelDensity: calcPixelDensity(clickedElement),
  };

  // Weighted composite
  let total = 0;
  for (const [key, weight] of Object.entries(weights)) {
    total += (components[key] || 0) * weight;
  }

  // Apply size penalty as multiplier (bonus for hitting small targets)
  const sizeMultiplier = calcSizePenalty(bbox, screenDimensions);
  total = Math.min(total * sizeMultiplier, 1.0);

  // Build explanation
  const explanation = [
    `Centrality: ${(components.geometricCentrality * 100).toFixed(1)}%`,
    `Containment: ${components.containment > 0 ? "HIT" : "MISS"}`,
    `Target size: ${bbox.width}x${bbox.height} (${sizeMultiplier > 1 ? "small target bonus" : "standard"})`,
    `Confidence: ${(modelConfidence * 100).toFixed(0)}% (${isContained ? "calibrated" : "overconfident"})`,
    `Functional: ${(components.functionalCorrectness * 100).toFixed(0)}% correct element`,
    `Sequential: ${(components.sequentialConsistency * 100).toFixed(0)}% consistent`,
    `Density: ${(components.pixelDensity * 100).toFixed(0)}% information-rich`,
    `─── Total reward: ${(total * 100).toFixed(1)}%`,
  ].join("\n");

  return {
    total: Math.round(total * 1000) / 1000,
    ...components,
    explanation,
  };
}

// ── Batch Reward for Trajectory ─────────────────────────────────────────────

/**
 * Calculate rewards for an entire trajectory (sequence of GUI steps).
 * Returns per-step rewards + trajectory-level statistics.
 */
function calculateTrajectoryReward(steps, screenDimensions, weights = DEFAULT_WEIGHTS) {
  const rewards = [];
  const previousActions = [];

  for (const step of steps) {
    if (!step.click || !step.clickedElement) {
      rewards.push({ stepNumber: step.stepNumber, total: 0, skipped: true });
      continue;
    }

    const reward = calculateReward(
      step.click,
      step.clickedElement,
      step.targetElement || null,
      step.modelConfidence || 0.5,
      step.action,
      previousActions,
      screenDimensions,
      weights
    );

    rewards.push({ stepNumber: step.stepNumber, ...reward });
    previousActions.push({ ...step.action, target: step.clickedElement });
  }

  // Trajectory-level statistics
  const validRewards = rewards.filter((r) => !r.skipped);
  const avgReward = validRewards.length > 0
    ? validRewards.reduce((sum, r) => sum + r.total, 0) / validRewards.length
    : 0;

  const containmentRate = validRewards.length > 0
    ? validRewards.filter((r) => r.containment > 0).length / validRewards.length
    : 0;

  const avgCentrality = validRewards.length > 0
    ? validRewards.reduce((sum, r) => sum + (r.geometricCentrality || 0), 0) / validRewards.length
    : 0;

  const functionalAccuracy = validRewards.length > 0
    ? validRewards.filter((r) => (r.functionalCorrectness || 0) > 0.5).length / validRewards.length
    : 0;

  return {
    perStep: rewards,
    trajectory: {
      totalSteps: steps.length,
      validSteps: validRewards.length,
      avgReward: Math.round(avgReward * 1000) / 1000,
      containmentRate: Math.round(containmentRate * 1000) / 1000,
      avgCentrality: Math.round(avgCentrality * 1000) / 1000,
      functionalAccuracy: Math.round(functionalAccuracy * 1000) / 1000,
      trajectoryScore: Math.round(avgReward * containmentRate * 1000) / 1000,
    },
    // CSRS comparison metrics
    csrsComparison: {
      stepGuiRewardAccuracy: 0.90, // Step-GUI claims 90%+ CSRS annotation accuracy
      ourDenseRewardGranularity: "7-component spatial hybrid",
      csrsGranularity: "binary outcome-based",
      advantage: "Dense per-step signal vs sparse task-completion signal",
    },
  };
}

// ── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  calculateReward,
  calculateTrajectoryReward,
  calcGeometricCentrality,
  calcContainment,
  calcSizePenalty,
  calcSpatialConfidence,
  calcFunctionalCorrectness,
  calcSequentialConsistency,
  calcPixelDensity,
  DEFAULT_WEIGHTS,
};
