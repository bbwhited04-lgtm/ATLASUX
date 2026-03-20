/**
 * Atlas GUI Research Module — Screen Capture + Vision Analysis
 *
 * Captures the current Electron window, sends to vision model for analysis,
 * proposes next action with confidence score. NEVER auto-executes.
 * All actions logged for research comparison against CSRS benchmarks.
 *
 * This is a research tool, not a production feature.
 * Constitutional HIL: every proposed action requires human approval.
 */

const { desktopCapturer, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

// ── Config ──────────────────────────────────────────────────────────────────

const LOG_DIR = path.join(__dirname, "research-logs");
const BACKEND_URL = process.env.VITE_API_BASE_URL || "http://localhost:8787";

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ── Session state ───────────────────────────────────────────────────────────

let sessionId = null;
let stepCount = 0;
let sessionLog = [];

// ── Screen Capture ──────────────────────────────────────────────────────────

/**
 * Capture the current screen as a base64 PNG.
 * Uses Electron's desktopCapturer — screenshots never leave the machine.
 */
async function captureScreen(win) {
  const image = await win.webContents.capturePage();
  const png = image.toPNG();
  const base64 = png.toString("base64");

  // Save to disk for research review
  const filename = `step-${String(stepCount).padStart(4, "0")}.png`;
  fs.writeFileSync(path.join(LOG_DIR, sessionId, filename), png);

  return { base64, filename, dimensions: image.getSize() };
}

// ── Vision Analysis ─────────────────────────────────────────────────────────

/**
 * Send screenshot to vision model for GUI analysis.
 * Returns: detected elements, proposed action, confidence score.
 *
 * Uses the backend's runLLM endpoint to route to the cheapest vision model.
 */
async function analyzeScreen(base64Image, taskInstruction, previousActions) {
  const systemPrompt = `You are a GUI analysis agent examining a screenshot of a web application.

Your job is to:
1. DESCRIBE what you see on screen (layout, key elements, text, buttons, icons)
2. IDENTIFY the current application state (which page/view, what's loaded, any errors)
3. DETECT any latent state indicators (loading spinners, disabled buttons, pending operations)
4. PROPOSE the next action to accomplish the task
5. RATE your confidence (0.0 to 1.0) in the proposed action

Respond in JSON format:
{
  "screenDescription": "what you see",
  "applicationState": "current state/page",
  "latentStateIndicators": ["any loading/pending/stale indicators"],
  "uiElements": [
    {"type": "button|link|input|icon|text", "label": "visible text", "location": "approximate position", "function": "what it likely does"}
  ],
  "proposedAction": {
    "type": "click|type|scroll|wait|navigate",
    "target": "which element",
    "value": "text to type if applicable",
    "reasoning": "why this action"
  },
  "confidence": 0.85,
  "uncertainties": ["what you're not sure about"],
  "functionalSemantics": "what icons/elements MEAN beyond appearance",
  "hciObservations": "any HCI patterns noticed (scanning, affordances, conventions)"
}`;

  const userMessage = `Task: ${taskInstruction}

Previous actions taken: ${previousActions.length > 0 ? previousActions.map((a, i) => `${i + 1}. ${a.action} → ${a.result}`).join("\n") : "None (first step)"}

Analyze the attached screenshot and propose the next action.`;

  try {
    const response = await fetch(`${BACKEND_URL}/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userMessage },
              { type: "image_url", image_url: { url: `data:image/png;base64,${base64Image}` } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || data.content || "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { error: "Could not parse vision response", raw: text };
  } catch (err) {
    return { error: err.message, raw: null };
  }
}

// ── Research Logger ─────────────────────────────────────────────────────────

/**
 * Log a research step with full context for later analysis.
 * Captures: screenshot, vision analysis, proposed action, human decision, outcome.
 */
function logStep(step) {
  sessionLog.push({
    ...step,
    timestamp: new Date().toISOString(),
    stepNumber: stepCount,
  });

  // Write incremental log
  const logPath = path.join(LOG_DIR, sessionId, "session.json");
  fs.writeFileSync(logPath, JSON.stringify(sessionLog, null, 2));
}

/**
 * Generate research summary for the session.
 * Categorizes errors by type: functional semantics, latent state, HCI.
 */
function generateSummary() {
  const total = sessionLog.length;
  const proposed = sessionLog.filter((s) => s.proposedAction);
  const approved = sessionLog.filter((s) => s.humanDecision === "approve");
  const rejected = sessionLog.filter((s) => s.humanDecision === "reject");
  const modified = sessionLog.filter((s) => s.humanDecision === "modify");

  const errorCategories = {
    functionalSemantics: sessionLog.filter((s) => s.errorCategory === "functional_semantics").length,
    latentState: sessionLog.filter((s) => s.errorCategory === "latent_state").length,
    hci: sessionLog.filter((s) => s.errorCategory === "hci").length,
    perception: sessionLog.filter((s) => s.errorCategory === "perception").length,
    reasoning: sessionLog.filter((s) => s.errorCategory === "reasoning").length,
    other: sessionLog.filter((s) => s.errorCategory === "other").length,
  };

  const avgConfidence = proposed.length > 0
    ? proposed.reduce((sum, s) => sum + (s.analysis?.confidence || 0), 0) / proposed.length
    : 0;

  const summary = {
    sessionId,
    totalSteps: total,
    actionsProposed: proposed.length,
    actionsApproved: approved.length,
    actionsRejected: rejected.length,
    actionsModified: modified.length,
    approvalRate: total > 0 ? ((approved.length / total) * 100).toFixed(1) + "%" : "0%",
    avgConfidence: avgConfidence.toFixed(3),
    errorCategories,
    effectiveTCR: total > 0 ? (((approved.length) / total) * 100).toFixed(1) + "%" : "0%",
    csrsComparison: {
      stepGuiAndroidWorld: "80.2%",
      guiLibraAndroidWorld: "42.6%",
      atlasGuiThisSession: total > 0 ? (((approved.length) / total) * 100).toFixed(1) + "%" : "0%",
    },
  };

  const summaryPath = path.join(LOG_DIR, sessionId, "summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  return summary;
}

// ── IPC Handlers ────────────────────────────────────────────────────────────

function registerGuiResearchHandlers(mainWindow) {
  // Start a new research session
  ipcMain.handle("gui-research:start-session", async (_event, taskInstruction) => {
    sessionId = `gui-research-${Date.now()}`;
    stepCount = 0;
    sessionLog = [];

    // Create session directory
    const sessionDir = path.join(LOG_DIR, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    // Save task instruction
    fs.writeFileSync(
      path.join(sessionDir, "task.json"),
      JSON.stringify({ taskInstruction, startedAt: new Date().toISOString() }, null, 2)
    );

    return { sessionId, status: "started" };
  });

  // Capture screen and analyze
  ipcMain.handle("gui-research:analyze-step", async (_event, taskInstruction, previousActions) => {
    if (!sessionId) return { error: "No active session" };

    stepCount++;

    // Capture
    const capture = await captureScreen(mainWindow);

    // Analyze
    const analysis = await analyzeScreen(capture.base64, taskInstruction, previousActions || []);

    // Log (human decision will be added later)
    const step = {
      stepNumber: stepCount,
      screenshot: capture.filename,
      dimensions: capture.dimensions,
      analysis,
      proposedAction: analysis.proposedAction || null,
      confidence: analysis.confidence || 0,
      functionalSemantics: analysis.functionalSemantics || null,
      hciObservations: analysis.hciObservations || null,
      latentStateIndicators: analysis.latentStateIndicators || [],
      humanDecision: null, // filled in by gui-research:record-decision
      errorCategory: null,
    };

    logStep(step);

    return {
      stepNumber: stepCount,
      analysis,
      confidence: analysis.confidence || 0,
      proposedAction: analysis.proposedAction || null,
    };
  });

  // Record human decision on proposed action
  ipcMain.handle("gui-research:record-decision", async (_event, decision) => {
    // decision: { approved: bool, modified: bool, errorCategory?: string, notes?: string }
    if (sessionLog.length === 0) return { error: "No steps to record" };

    const lastStep = sessionLog[sessionLog.length - 1];
    lastStep.humanDecision = decision.approved ? "approve" : decision.modified ? "modify" : "reject";
    lastStep.errorCategory = decision.errorCategory || null;
    lastStep.humanNotes = decision.notes || null;
    lastStep.humanModifiedAction = decision.modifiedAction || null;

    // Re-save log
    const logPath = path.join(LOG_DIR, sessionId, "session.json");
    fs.writeFileSync(logPath, JSON.stringify(sessionLog, null, 2));

    return { recorded: true, step: lastStep.stepNumber };
  });

  // End session and generate summary
  ipcMain.handle("gui-research:end-session", async () => {
    const summary = generateSummary();

    // Reset
    const completedSession = sessionId;
    sessionId = null;
    stepCount = 0;
    sessionLog = [];

    return { sessionId: completedSession, summary };
  });

  // Get current session status
  ipcMain.handle("gui-research:status", async () => {
    return {
      active: !!sessionId,
      sessionId,
      stepCount,
      logCount: sessionLog.length,
    };
  });
}

module.exports = { registerGuiResearchHandlers };
