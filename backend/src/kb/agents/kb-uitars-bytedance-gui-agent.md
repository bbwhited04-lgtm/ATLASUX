# UI-TARS: ByteDance's Native GUI Agent Model

## Introduction

UI-TARS — User Interface Task Automation and Reasoning System — is a native GUI agent model developed by ByteDance's Seed team. Unlike wrapper-based agent frameworks that bolt prompt engineering and workflow orchestration onto commercial models like GPT-4o or Claude, UI-TARS is an end-to-end vision-language model trained from the ground up to perceive screenshots, reason about interface elements, and execute mouse and keyboard actions autonomously. It represents the most aggressive open-source push toward fully autonomous computer use, with three major releases between January 2025 and September 2025 that steadily closed the gap between academic benchmarks and production-grade GUI automation.

The project is fully open source under Apache 2.0, with model weights available on Hugging Face and the codebase hosted at [github.com/bytedance/UI-TARS](https://github.com/bytedance/UI-TARS). The original research paper (arXiv: 2501.12326) introduced the architecture, while a follow-up technical report (arXiv: 2509.02544) detailed the multi-turn reinforcement learning innovations behind UI-TARS-2.

What makes UI-TARS significant is not just its benchmark numbers — though those are impressive — but what it reveals about the state of GUI automation: where the hard problems actually live, what scale buys you, and where training methodology matters more than parameter count.

## The Three Generations of UI-TARS

### UI-TARS v1 (January 2025)

The first release established the core architecture: a 72B-parameter vision-language model that takes raw screenshots as input and outputs structured action sequences (clicks, keystrokes, scrolls). No DOM parsing, no accessibility tree extraction, no OCR preprocessing — just pixels in, actions out.

UI-TARS v1 introduced three key innovations that carried through subsequent versions:

**Enhanced Perception.** The model was trained on a large-scale dataset of GUI screenshots spanning web, desktop, and mobile interfaces. This gave it context-aware understanding of UI elements — not just recognizing buttons and text fields, but understanding spatial relationships, visual hierarchy, and platform-specific conventions.

**Unified Action Modeling.** Rather than maintaining separate action spaces for different platforms, UI-TARS standardized all interactions into a unified coordinate-based action space. A click on an Android button and a click on a Windows menu item use the same action representation. This cross-platform abstraction enabled training on diverse data without platform-specific engineering.

**System-2 Reasoning.** The model incorporated deliberate multi-step reasoning patterns: task decomposition (breaking complex goals into sub-tasks), reflection thinking (evaluating whether actions succeeded), and milestone recognition (tracking progress toward completion). This moved beyond simple ReAct-style loops into more structured planning.

v1 achieved 46.6% on AndroidWorld and 24.6% on OSWorld — already surpassing GPT-4o (34.5% on AndroidWorld) and Claude Computer Use (22.0% on OSWorld).

### UI-TARS-1.5 (April 2025)

The 1.5 release focused on grounding accuracy — the ability to precisely locate and target specific UI elements on screen. This is where the numbers get striking.

UI-TARS-1.5 achieved 94.2% accuracy on ScreenSpot-V2, a benchmark that measures whether the model can correctly identify the location of a specified UI element. For context, OpenAI's Operator scored 87.9% and Claude 3.7 scored 87.6% on the same benchmark. On the harder ScreenSpot-Pro benchmark (which tests professional software interfaces with denser, more ambiguous layouts), UI-TARS-1.5 scored 61.6% — more than double the scores of Operator (23.4%) and Claude 3.7 (27.7%).

Task completion benchmarks also jumped significantly: AndroidWorld rose to 64.2% and OSWorld to 42.5%. ByteDance also released a 7B variant (UI-TARS-1.5-7B) that maintained competitive performance at a fraction of the compute cost, making the model accessible for deployment on consumer hardware.

A notable demonstration of versatility: UI-TARS-1.5 achieved a 100% task completion rate across 14 mini-games from the Poki Games benchmark, showing that its visual understanding extends beyond conventional productivity interfaces.

### UI-TARS-2 (September 2025)

The second major version introduced the most significant architectural innovation: multi-turn reinforcement learning. Rather than training on static (state, action) pairs, UI-TARS-2 learned from complete multi-step interaction trajectories, receiving rewards based on final task outcomes.

This is the critical shift. Previous versions used supervised fine-tuning on human demonstrations — the model learned to imitate what humans did. UI-TARS-2 learned from its own experience, discovering strategies that human demonstrators might never use. The multi-turn RL approach also naturally handles the temporal credit assignment problem: when a task succeeds or fails after 15 steps, which steps were responsible?

The results reflected this leap:

- AndroidWorld: 73.3% (up from 64.2%)
- OSWorld: 47.5% (up from 42.5%)
- WindowsAgentArena: 50.6% (first time exceeding 50% on Windows-specific tasks)
- Online-Mind2Web: 88.2% (web navigation tasks)

On a 15-game benchmark suite with scores normalized to human performance (100), UI-TARS-2 achieved a mean score of 59.8 — outperforming OpenAI CUA by 35.0 points and Claude Computer Use by 38.2 points.

## Benchmark Comparison Table

The following table compares UI-TARS versions against competing GUI agent systems across major benchmarks. All scores are percentages representing task completion rate unless otherwise noted.

| Model | Params | AndroidWorld | OSWorld | ScreenSpot-V2 | ScreenSpot-Pro | WindowsAgentArena | Online-Mind2Web |
|-------|--------|-------------|---------|---------------|----------------|-------------------|-----------------|
| **UI-TARS v1** | 72B | 46.6 | 24.6 | — | — | — | — |
| **UI-TARS-1.5** | 72B/7B | 64.2 | 42.5 | 94.2 | 61.6 | — | — |
| **UI-TARS-2** | 72B | 73.3 | 47.5 | — | — | 50.6 | 88.2 |
| Step-GUI-8B | 8B | 80.2 | 48.5 | — | — | — | — |
| GUI-Libra | — | 42.6 | — | — | — | — | — |
| GPT-4o | ~1.8T* | 34.5 | — | — | — | — | — |
| Claude 3.5/3.7 | — | — | 22.0 | 87.6 | 27.7 | — | — |
| OpenAI Operator | — | — | — | 87.9 | 23.4 | — | — |

*Estimated parameter count; OpenAI does not disclose exact figures.

Two patterns jump out from this table. First, UI-TARS consistently outperforms general-purpose models (GPT-4o, Claude) by wide margins on GUI-specific tasks — purpose-built beats general-purpose. Second, the gap between grounding accuracy (94.2% on ScreenSpot-V2) and task completion (73.3% on AndroidWorld) reveals that finding the right element is only part of the problem.

## The Scale vs. Efficiency Debate

The most interesting competitive dynamic in GUI agents is not UI-TARS versus Claude or GPT-4o — it is UI-TARS versus Step-GUI.

Step-GUI is a family of GUI specialist models (4B and 8B parameters) built on the Qwen3-VL backbone by the StepFun GELab team. Despite being 9-18x smaller than UI-TARS-72B, Step-GUI-8B achieves 80.2% on AndroidWorld and 48.5% on OSWorld — both higher than UI-TARS-2's 73.3% and 47.5%.

How does a model one-ninth the size outperform a model with vastly more parameters? The answer lies in training methodology.

**Step-GUI's CSRS (Calibrated Step Reward System)** anchors LLM-generated dense step-level reasoning to trajectory-level evaluation signals. Rather than treating each step independently, CSRS calibrates step-level annotations against the actual success or failure of complete task trajectories. This achieves a 10-100x cost reduction compared to traditional step-level annotation while maintaining or improving annotation quality.

Step-GUI also uses a progressive three-stage training paradigm that orchestrates parallel data flows for exploration and knowledge filtering, continuously improving model capabilities across training rounds.

The implications are profound for the field:

**Scale is not the answer — or at least, not the only answer.** UI-TARS threw 72 billion parameters at the problem and achieved 47.5% on OSWorld. Step-GUI threw 8 billion parameters with better training methodology and achieved 48.5%. The marginal return on additional parameters is clearly diminishing.

**Training methodology is the multiplier.** CSRS, UI-TARS-2's multi-turn RL, and similar innovations in training data curation and reward modeling are producing larger performance gains than scaling model size. This mirrors the broader trend in LLM research where Chinchilla-optimal training and RLHF innovations have mattered more than raw parameter counts.

**Deployment economics diverge dramatically.** Running a 72B model requires multiple high-end GPUs (A100/H100 class). Running an 8B model is feasible on a single consumer GPU or even on-device. For production GUI automation where you need agents running continuously on user machines, the 8B path is orders of magnitude cheaper.

**Privacy architecture differs.** Step-GUI's GUI-MCP (Model Context Protocol for GUI automation) is explicitly designed for on-device execution where sensitive data never leaves the machine. UI-TARS Desktop offers local execution through its Electron app, but the 72B model requires significant local compute resources, pushing many users toward cloud-hosted inference.

## UI-TARS Desktop: The Local Execution Layer

UI-TARS Desktop is an open-source Electron application that brings UI-TARS to end users as a native desktop tool. Built with TypeScript end-to-end (Vite + Electron Forge, tested with Vitest and Playwright), it captures screenshots, sends them to a local or remote UI-TARS model, and executes the returned actions on the user's machine.

Key characteristics:

- **Cross-platform**: Windows and macOS support
- **Screenshot-based**: Captures the screen as images, sends to the model, receives action coordinates
- **Privacy-first local mode**: All screenshot recognition and model processing can run locally without uploading screen data to the cloud
- **Natural language control**: Users describe tasks in plain language; the agent translates to GUI actions
- **Real-time feedback**: Visual overlay showing what the agent sees and what actions it plans to take

The Desktop application has gained significant traction in the open-source community, with the main UI-TARS repository accumulating over 27,000 GitHub stars. The Apache 2.0 license enables commercial use, modification, and distribution without restriction.

However, "local execution" comes with a significant asterisk. Running the full 72B model locally requires hardware that most users do not have. The 7B variant (UI-TARS-1.5-7B) is far more practical for local deployment but sacrifices performance. This is where the Step-GUI approach — smaller models with better training — may prove more architecturally sound for real-world desktop agents.

## Key Technical Innovations

### Iterative Training with Reflective Online Traces

UI-TARS addresses the data bottleneck in GUI agent training through an automated pipeline that collects, filters, and reflectively refines new interaction traces on hundreds of virtual machines. Rather than relying solely on human demonstrations (which are expensive and limited), the system:

1. Deploys UI-TARS on virtual machines to attempt real tasks
2. Records complete interaction traces (screenshots + actions + outcomes)
3. Filters successful traces as positive training examples
4. Applies reflective refinement to failed traces — the model analyzes why it failed and generates corrected action sequences
5. Uses the refined dataset for the next round of training

This creates a self-improving training loop that scales without proportional increases in human annotation cost.

### Multi-Turn Reinforcement Learning (UI-TARS-2)

The most significant architectural innovation in UI-TARS-2 is the shift from supervised fine-tuning to multi-turn RL. Traditional GUI agent training treats each (screenshot, action) pair independently — the model learns to predict the right action for a given screen state. Multi-turn RL instead optimizes over entire task trajectories, with rewards assigned based on final task outcomes.

This approach naturally handles several challenges that supervised learning struggles with:

- **Temporal credit assignment**: When a 20-step task fails, which step was the mistake? RL propagates outcome signals back through the trajectory.
- **Recovery behavior**: RL discovers that sometimes the best action after a mistake is to undo and retry, rather than continuing on a failing path.
- **Exploration**: The model tries action sequences that no human demonstrator would attempt, sometimes discovering more efficient paths.

### Unified Cross-Platform Action Space

UI-TARS's unified action representation deserves attention because it solves a practical engineering problem that plagues most GUI agent systems. Most frameworks maintain separate action parsers for web (DOM manipulation), desktop (accessibility APIs), and mobile (Android/iOS intent systems). UI-TARS bypasses all of this by operating purely at the pixel level — every action is a coordinate-based operation on a screenshot, regardless of platform.

This simplification has trade-offs. It eliminates the need for platform-specific integration work, but it also means the model cannot leverage semantic information from DOM trees or accessibility labels. The 94.2% grounding accuracy on ScreenSpot-V2 suggests the pixel-only approach is sufficient for element location, but the gap to task completion hints that semantic context might help with action planning.

## Production Validation: What UI-TARS Reveals for Atlas UX

UI-TARS's benchmark trajectory validates several core assumptions in Atlas UX's GUI automation architecture while exposing critical gaps that academic models do not address.

### Grounding Is Near-Solved — But Grounding Is Not Enough

The 94.2% grounding accuracy on ScreenSpot-V2 proves that the spatial precision problem IS solvable with current vision-language architectures. Models can reliably locate the correct UI element on screen. This is no longer the bottleneck.

But look at the gap: 94.2% grounding accuracy versus 73.3% task completion on AndroidWorld. That 21-point delta means that even when the model correctly identifies the right element, it fails roughly one in five task attempts due to other factors — incorrect action sequencing, failure to recover from unexpected states, wrong reasoning about what action to take, or inability to maintain coherent plans across many steps.

This gap is exactly what temporal credit assignment and subgoal decomposition address. Atlas UX's dense spatial reward function (centrality-dominant, sigma=0.3) pushes beyond "found it" to "hit the center of the target precisely." But more importantly, the subgoal decomposition framework breaks complex tasks into verifiable milestones, and the temporal credit assignment mechanism identifies which steps in a trajectory actually caused success or failure.

### The Privacy Architecture Gap

No academic paper on GUI agents adequately addresses the privacy implications of their architecture. UI-TARS, Claude Computer Use, and OpenAI Operator all share a fundamental design: screenshots of the user's screen are sent to a model for processing.

UI-TARS Desktop offers a "local mode" where processing stays on-device, but the 72B model requires enterprise-grade hardware for local inference. For most users, practical deployment means sending screenshots to cloud-hosted models. Those screenshots may contain passwords, financial data, private messages, medical records, proprietary business information — anything visible on screen at the moment of capture.

ByteDance's position as a China-headquartered company adds a geopolitical dimension to this concern. While UI-TARS is open source and can be self-hosted, the default cloud inference path routes data through ByteDance infrastructure.

Atlas UX's zero image leakage architecture addresses this directly. No screenshot data leaves the local execution environment. All visual processing occurs on-device with models sized for consumer hardware. This is not an optimization — it is a constitutional requirement.

### Constitutional Human-in-the-Loop vs. Full Autonomy

UI-TARS runs fully autonomous. Once given a task, it executes without human checkpoints. UI-TARS-2's 88.2% on Online-Mind2Web is impressive, but those are controlled web navigation tasks with clear success criteria.

Production environments are different. An autonomous agent that clicks "Confirm Purchase" without human approval, or that deletes files based on an ambiguous instruction, or that sends messages to the wrong contact, creates liability that no benchmark captures.

Atlas UX's constitutional human-in-the-loop (HIL) framework requires human approval on uncertain or dangerous steps. The system classifies actions by risk tier: low-risk actions (scrolling, reading, navigation) execute autonomously, while high-risk actions (purchases, deletions, communications) require explicit human confirmation. This is not a limitation — it is a production requirement that no current GUI agent benchmark measures.

### The Online-Mind2Web Caveat

UI-TARS-2's 88.2% on Online-Mind2Web deserves careful interpretation. Mind2Web tests web navigation tasks on live websites, which is genuinely harder than static benchmarks. But the tasks are still structured (go to website X, find product Y, add to cart) with clear success criteria.

Production GUI automation involves ambiguous goals, multi-session tasks, tasks that span multiple applications, error recovery from unexpected states, and interactions with systems that change their UI without notice. The gap between controlled benchmarks and messy production reality is where the remaining engineering challenge lives.

## Research Implications

### Element Location Is Near-Solved

ScreenSpot-V2 at 94.2% means the research community can largely move past "can the model find the button?" as a primary research question. The remaining 5.8% failures are likely edge cases (unusual UI frameworks, overlapping elements, dynamic content) rather than fundamental capability gaps.

This shifts research attention to the harder problems: sequential reasoning, memory across turns, recovery from errors, and planning under uncertainty. Dense spatial rewards become less about "can you find it" and more about "can you hit it precisely enough that the downstream action succeeds" — the difference between clicking near a small checkbox and clicking exactly on it.

### Training Methodology Trumps Scale

The Step-GUI result (48.5% OSWorld at 8B parameters vs. UI-TARS-2's 47.5% at 72B parameters) is a strong signal that the GUI agent field is entering a training-methodology-dominant phase. The marginal returns on parameter scaling are diminishing, while innovations in reward modeling (CSRS), data curation (reflective online traces), and RL optimization (multi-turn trajectory learning) are producing outsized gains.

For production systems, this is good news. Smaller, better-trained models are cheaper to deploy, faster to run, more practical for on-device execution, and easier to update. The path to production GUI agents likely runs through 4B-8B specialist models, not 72B generalists.

### The Remaining Hard Problems

UI-TARS's benchmark trajectory reveals where the unsolved problems live:

1. **Long-horizon planning**: Tasks requiring 20+ steps with dependencies between steps
2. **Error recovery**: Detecting that an action failed and choosing the right recovery strategy
3. **Cross-application coordination**: Tasks that span multiple applications (copy from browser, paste into document, email the result)
4. **Stateful memory**: Remembering information from earlier in a task sequence without re-reading the screen
5. **Ambiguity resolution**: Handling underspecified instructions without human clarification
6. **Safety classification**: Knowing which actions are dangerous and require confirmation

UI-TARS addresses items 1-4 through its System-2 reasoning and multi-turn RL. Items 5-6 are production requirements that academic benchmarks do not yet evaluate.

## Media

![UI-TARS architecture overview showing the screenshot-to-action pipeline](https://github.com/bytedance/UI-TARS/raw/main/assets/ui-tars-overview.png)
*UI-TARS end-to-end architecture: raw screenshots in, structured actions out. Source: ByteDance/UI-TARS GitHub.*

![UI-TARS benchmark comparison chart across GUI agent benchmarks](https://github.com/bytedance/UI-TARS/raw/main/assets/ui-tars-benchmark.png)
*Benchmark performance comparison showing UI-TARS outperforming GPT-4o and Claude across GUI tasks. Source: ByteDance/UI-TARS GitHub.*

![UI-TARS Desktop application interface showing natural language task control](https://github.com/bytedance/UI-TARS-desktop/raw/main/apps/ui-tars/resources/screenshot.png)
*UI-TARS Desktop: the Electron-based local execution environment for GUI automation. Source: ByteDance/UI-TARS-desktop GitHub.*

![UI-TARS grounding accuracy visualization on ScreenSpot benchmark](https://seed.bytedance.com/content/dam/seed/blog/uitars-1.5/screenspot.png)
*ScreenSpot-V2 grounding accuracy: UI-TARS-1.5 at 94.2% vs. Operator (87.9%) and Claude 3.7 (87.6%). Source: ByteDance Seed Blog.*

![UI-TARS-2 multi-turn reinforcement learning training pipeline](https://arxiv.org/html/2509.02544v1/extracted/6124312/figures/main.png)
*UI-TARS-2 multi-turn RL training pipeline: trajectory-level rewards propagated through multi-step interactions. Source: arXiv 2509.02544.*

## Videos

- [UI-TARS: ByteDance's AI Agent That Can Control Your Computer](https://www.youtube.com/watch?v=kqfWMj0PWDM) — Overview of UI-TARS capabilities, architecture, and benchmark performance against GPT-4o and Claude.

- [UI-TARS Desktop Setup and Demo — Local GUI Automation Agent](https://www.youtube.com/watch?v=r09hGOJRLWQ) — Walkthrough of installing UI-TARS Desktop, configuring local model inference, and running GUI automation tasks on Windows and macOS.

## References

- [UI-TARS: Pioneering Automated GUI Interaction with Native Agents (arXiv 2501.12326)](https://arxiv.org/abs/2501.12326) — Original research paper introducing the UI-TARS architecture, training methodology, and benchmark results.

- [UI-TARS-2 Technical Report: Advancing GUI Agent with Multi-Turn Reinforcement Learning (arXiv 2509.02544)](https://arxiv.org/abs/2509.02544) — Technical report on multi-turn RL innovations and UI-TARS-2 benchmark performance.

- [ByteDance/UI-TARS GitHub Repository](https://github.com/bytedance/UI-TARS) — Open-source codebase, model weights, and documentation for UI-TARS.

- [ByteDance Seed: UI-TARS-1.5 Open Source Announcement](https://seed.bytedance.com/en/blog/bytedance-seed-agent-model-ui-tars-1-5-open-source-achieving-sota-performance-in-various-benchmarks) — Official blog post covering UI-TARS-1.5 release, ScreenSpot-V2 results, and model availability.

- [Step-GUI Technical Report (arXiv 2512.15431)](https://arxiv.org/abs/2512.15431) — The competing small-model approach that achieves comparable performance at 8B parameters using CSRS training methodology.
