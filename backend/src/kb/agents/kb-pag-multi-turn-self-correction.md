# PAG: Multi-Turn Reinforced LLM Self-Correction with Policy as Generative Verifier

## Introduction

Large language models frequently produce incorrect outputs on their first attempt, yet naive self-correction strategies — where the model simply generates a second response regardless of whether the first was wrong — often make things worse. Research across 2024 and 2025 repeatedly demonstrated that prompting an LLM to "try again" without a principled verification step leads to model collapse: the model second-guesses correct answers, introduces new errors, and degrades overall accuracy. The fundamental problem is that self-correction without verification is undirected — the model has no reliable signal telling it whether revision is actually needed.

PAG (Policy as Generative verifier) addresses this problem head-on. Published in June 2025 (arXiv:2506.10406), PAG introduces a unified architecture where a single LLM serves as both the policy (generating answers) and the generative verifier (checking its own work). The key innovation is selective revision: the model only revises its output when its own verification step detects an error. If verification confirms the answer is correct, the original stands. This seemingly simple principle — do not fix what is not broken — produces dramatic improvements over both single-pass generation and unconditional self-correction.

The verify-then-revise workflow fundamentally changes the economics of LLM self-correction. Instead of always doubling inference cost by generating two attempts, PAG spends verification tokens only, and revision tokens only when verification detects a problem. For GUI agents, autonomous systems, and production AI pipelines, this pattern provides the theoretical foundation for pushing reliability past 95% task completion rates without the runaway costs of brute-force multi-attempt strategies.

## The Self-Correction Paradox

The promise of LLM self-correction has always been intuitive: if a model can generate an answer, it should be able to check that answer and fix mistakes. But empirical results tell a more complicated story. Huang et al. (2024) showed that intrinsic self-correction — where the model corrects itself without external feedback — often reduces accuracy rather than improving it. The model changes correct answers to incorrect ones as frequently as it fixes genuine errors, producing a net-zero or net-negative effect.

This paradox emerges from the asymmetry between generation and verification capabilities in standard LLMs. A model trained primarily on next-token prediction develops strong generative capabilities but weak discriminative ones. It can produce fluent, plausible-sounding reasoning chains, but it cannot reliably distinguish correct reasoning from plausible-but-wrong reasoning. When asked to self-correct, the model applies the same generative process that produced the original error, with no additional information to guide it toward a better answer.

Previous approaches attempted to break this paradox through external verifiers — separate models trained specifically to evaluate outputs. Outcome reward models (ORMs) score complete responses, while process reward models (PRMs) score individual reasoning steps. Both approaches work but require training and maintaining a separate verification model, doubling infrastructure costs and creating deployment complexity. The verification model must be kept in sync with the policy model as it improves, and any misalignment between the two introduces systematic biases.

PAG eliminates this architectural split entirely. By training a single model to be both a capable generator and a capable verifier, PAG solves the synchronization problem — the verifier improves exactly in lockstep with the generator because they are the same model. More importantly, verification capabilities reinforce generation capabilities and vice versa: a model that learns to detect specific error types in its own output learns to avoid those errors during generation.

## The PAG Architecture

PAG's architecture is deceptively simple. A single autoregressive LLM is trained through multi-turn reinforcement learning to perform three distinct roles within a single inference trajectory:

**Generator.** The model receives a problem and produces an initial solution attempt. This is standard LLM behavior — the model generates a reasoning chain and final answer using its learned policy.

**Generative Verifier.** After generating the initial answer, the model receives a verification prompt asking it to assess the correctness of its own output. Critically, this is not a binary classification task. The model generates a natural language verification — a reasoning chain that analyzes the initial answer step by step, identifying potential errors and assessing overall correctness. The generative nature of this verification means the model can articulate why an answer is wrong, not just flag it as incorrect.

**Selective Reviser.** If and only if the verification step identifies an error, the model generates a revised answer. If verification confirms correctness, the original answer is returned without modification. This selective gating is the core innovation — it prevents the model from over-correcting valid outputs.

The multi-turn structure creates a natural conversation between the model's roles:

Turn 1 (Generation): "The answer to this problem is X because..."
Turn 2 (Verification): "Let me check this answer. Step 3 contains an error because..."
Turn 3 (Revision): "Correcting the error identified in verification, the answer is Y because..."

Or, when the initial answer is correct:

Turn 1 (Generation): "The answer to this problem is X because..."
Turn 2 (Verification): "This answer is correct. The reasoning in each step is valid because..."
[No Turn 3 — original answer is returned]

## Multi-Turn Reinforcement Learning Training

PAG's training procedure uses multi-turn reinforcement learning to jointly optimize both generation and verification capabilities. This joint training is critical — it ensures the model develops verification skills that are calibrated to its own generation distribution, rather than learning to verify outputs from a different model or a static dataset.

The training loop proceeds as follows. The model generates an initial answer to a problem, then generates a verification assessment, then optionally generates a revision. The entire multi-turn trajectory is evaluated against the ground truth, and the reward signal is propagated back through all turns. Both the generation quality and the verification accuracy contribute to the reward.

This creates a virtuous training cycle. When the model generates a correct answer but incorrectly flags it as wrong during verification (a false positive), the resulting unnecessary revision degrades the final answer, producing a negative reward signal that discourages false positive verifications. Conversely, when the model generates an incorrect answer but incorrectly certifies it as correct during verification (a false negative), the incorrect answer passes through unrevised, also producing a negative reward. The model is therefore incentivized to develop accurate verification: minimize both false positives (unnecessary revisions) and false negatives (missed errors).

The dense reward structure provides step-level signals for each phase of the multi-turn trajectory. The generation step receives reward based on initial answer quality. The verification step receives reward based on detection accuracy — correctly identifying errors and correctly confirming valid answers. The revision step, when triggered, receives reward based on whether the revision actually improved the answer. This per-phase reward decomposition enables the model to independently optimize each capability.

Multi-turn RL training also teaches the model appropriate confidence calibration. A well-trained PAG model produces verification assessments whose confidence levels correlate with actual error probability. High-confidence "correct" assessments should almost always correspond to actually correct answers, while high-confidence "incorrect" assessments should reliably indicate genuine errors. This calibration emerges naturally from the RL reward structure — miscalibrated confidence leads to suboptimal selective revision decisions, which reduce overall reward.

## Selective Revision and Model Collapse Prevention

The selective revision mechanism is PAG's most important contribution to practical self-correction. To understand why, consider what happens in unconditional self-correction systems.

When a model always generates a second attempt, it faces a fundamental tension. If the first answer is correct (which happens the majority of the time for capable models), the second attempt has nowhere to go but sideways or down. The model may rephrase, restructure, or subtly alter its reasoning, and each alteration risks introducing errors. Over multiple rounds of unconditional correction, this drift compounds — the model progressively moves away from its initial (often correct) answer, a phenomenon called model collapse in the self-correction context.

Model collapse is particularly dangerous because it is anti-correlated with model capability. The better a model is at initial generation, the more its outputs are correct on the first attempt, and the more damage unconditional self-correction inflicts. A 90% accurate model that always self-corrects will change 90% correct answers (risking degradation) and only 10% incorrect answers (offering improvement). The expected value of unconditional correction is negative for any model above 50% baseline accuracy.

PAG's selective revision breaks this dynamic entirely. By only revising when verification detects an error, the model preserves its correct first-attempt answers while focusing revision effort on the 10-20% of outputs that actually need fixing. The verification step acts as a precision filter — it must have high precision (low false positive rate) to avoid triggering unnecessary revisions, and high recall (low false negative rate) to catch genuine errors.

The project page (https://jackory.github.io/pag/) reports that PAG achieves substantial accuracy improvements across mathematical reasoning benchmarks compared to both single-pass generation and unconditional self-correction. The gains come almost entirely from correctly identifying and fixing errors in the initial output, without degrading correct answers — exactly the behavior that selective revision is designed to produce.

## Theoretical Connections to Verification Gating

PAG's verify-then-revise pattern has deep connections to gated execution architectures in autonomous systems. The fundamental insight — do not act on uncertain information, and do not modify what verification confirms as correct — appears across multiple domains under different names.

In formal verification, this is the assert-before-proceed pattern: a system checks preconditions before executing state-changing operations. In control theory, this is the observer-controller separation: the system estimates its current state (observation/verification) before computing control actions (generation/revision). In software engineering, this is the check-then-act pattern used in concurrent programming to prevent race conditions.

PAG formalizes this pattern for LLM reasoning. The verification step is a learned assertion — the model checks whether its output satisfies correctness conditions before committing to it. The selective revision is a learned rollback-and-retry — but only triggered when the assertion fails.

The governance gate equation used in constitutional AI systems, expressed as the indicator function over a confidence threshold against a risk-calibrated boundary, is structurally identical to PAG's verification gate. Both implement the same principle: an output must pass a verification check before it is accepted. The difference is scope — PAG verifies reasoning correctness within a single model, while constitutional governance verifies reasoning correctness, spatial precision, risk level, and human-in-the-loop compliance across a multi-agent system.

This structural parallel is not coincidental. Both PAG and constitutional governance are instances of the same underlying pattern: gated execution with learned verification. PAG learns the verification function through multi-turn RL. Constitutional governance specifies the verification function through explicit governance rules. The combination — learned verification for capability-level checks plus specified verification for safety-level checks — represents the most robust architecture for reliable autonomous systems.

## Applications to GUI Agent Systems

GUI agents — LLMs that interact with graphical interfaces by clicking, typing, scrolling, and reading screen content — are a natural application domain for PAG's verify-then-revise pattern. GUI interaction is inherently high-stakes and partially irreversible: clicking the wrong button, entering text in the wrong field, or navigating to the wrong page can create cascading errors that are difficult or impossible to undo.

Current GUI agents like UI-TARS (ByteDance, 2025) and StepGUI (self-evolving GUI agents) achieve task completion rates (TCR) in the 80-90% range on standard benchmarks. Errors concentrate in ambiguous situations — elements that look similar, dynamic interfaces where layout shifts between actions, and multi-step tasks where early mistakes compound.

PAG's verification step maps directly to GUI action verification. Before executing a proposed action (click element X, type text Y), the agent performs a verification pass: "Am I about to click the correct element? Does this element match the target described in the task? Is this the right step in the current workflow?" Only if verification confirms the action does execution proceed. If verification detects a mismatch — the proposed click target is a similarly-labeled but wrong element, the text field is in the wrong form section — the agent revises its action before executing.

This verification-before-execution pattern addresses the specific failure modes that limit GUI agent TCR. Element confusion (clicking a similarly-named but wrong element) is caught by verification that checks element identity against task context. Premature actions (executing step N+1 before step N completes) are caught by verification that checks the current page state. Off-target typing (entering text in the wrong field) is caught by verification that checks field labels and form context.

The selective revision aspect is equally important for GUI agents. An agent that always second-guesses its click targets will be slower and less accurate than one that only reconsiders when verification detects a problem. Most GUI actions are unambiguous — the target button is clearly labeled, the text field is obviously correct — and verification should confirm these actions without triggering unnecessary revision.

## Production Validation: Atlas UX Self-Mending Architecture

Atlas UX deployed a self-mending LLM architecture in March 2026 that independently implements the same verify-then-revise pattern that PAG formalizes. The convergent evolution between academic research and production engineering validates both approaches.

### Verify-Then-Revise in Knowledge Base Healing

The kbEval + kbHealer pipeline is a direct instantiation of PAG's verify-then-revise workflow. kbEval evaluates every knowledge base document across multiple quality dimensions — retrieval precision, generation faithfulness, coverage completeness, and structural integrity. Documents that pass evaluation are left unchanged (PAG's "verification confirms correctness" path). Documents that fail evaluation are passed to kbHealer for targeted repair (PAG's "verification detects error, trigger revision" path). The 145 documents auto-healed in production represent selective revisions — corrections applied only where verification identified genuine quality deficits.

### Confidence Thresholds as Selective Revision Gates

PAG's selective revision gate — revise only when verification detects an error — maps to Atlas UX's confidence threshold system. The governance equation's indicator function checks whether agent confidence meets or exceeds a risk-calibrated threshold before permitting action execution. Actions below the confidence threshold are not executed, analogous to PAG withholding revision when verification confirms correctness. The threshold prevents both premature action (acting without sufficient confidence) and over-correction (revising outputs that are already adequate).

### Unified Policy and Verifier in Production

PAG's most distinctive architectural choice — using a single model as both policy and verifier — is reflected in Atlas UX's self-mending pipeline. The same LLM infrastructure that generates agent outputs also performs the 5-check pre-delivery validation. There is no separate verification model; the generation pipeline includes verification as an integral step. This unified architecture eliminates the synchronization problem that plagues dual-model approaches — the verifier always operates on the same distribution as the generator because they share parameters and context.

### Multi-Turn RL and Dense Reward Alignment

PAG trains both generation and verification capabilities jointly through multi-turn RL, using dense rewards that score each phase of the trajectory. Atlas UX's dense reward model scores both action quality and self-correction quality — agents receive reward signals for both the quality of their initial outputs and the accuracy of their self-assessment. This joint optimization ensures that agents improve as generators and as self-evaluators simultaneously, preventing the divergence that occurs when these capabilities are trained independently.

### Constitutional Governance Beyond PAG

While PAG verifies reasoning correctness within a single model's output, Atlas UX extends the verification scope through constitutional governance. The governance equation verifies reasoning quality, spatial precision for GUI agents, risk tier compliance, and human-in-the-loop requirements. Decision memos for content changes exceeding 40% function as an explicit over-correction prevention mechanism — analogous to PAG's selective revision, but enforced through governance rules rather than learned verification. PAG provides the theoretical foundation; constitutional governance provides the safety envelope that makes the pattern production-safe.

The connection to the agent execution equation is direct. The indicator function in the governance gate IS the PAG verification step, extended from pure reasoning correctness to a multi-dimensional verification that includes spatial grounding, risk assessment, and compliance checking. PAG published June 2025 proved that selective verification gating improves outcomes. Atlas UX deployed the same pattern in March 2026 with constitutional governance layered on top, validating PAG's core thesis in a production multi-agent system.

## Limitations and Open Questions

PAG's verify-then-revise pattern is not without limitations. The verification step adds latency to every generation — even when the initial answer is correct and no revision is needed, the model must still generate a verification assessment. For latency-sensitive applications (real-time voice agents, interactive GUI agents), this overhead may be unacceptable without architectural optimizations like speculative verification or parallel generation-verification pipelines.

Verification accuracy is bounded by the model's own capabilities. A model that consistently makes a specific type of error during generation may have a systematic blind spot that prevents it from detecting that same error type during verification. Multi-turn RL training mitigates but does not eliminate this limitation — the model can only learn to detect errors that appear in its training distribution.

The interaction between PAG's learned verification and externally specified safety constraints remains underexplored. When PAG's verification says "this output is correct" but a constitutional governance rule says "this output requires human approval regardless of correctness," how should the system behave? The answer in production systems is clear — governance rules override learned verification — but the training implications are nuanced. Should the model learn to incorporate governance constraints into its verification, or should verification remain purely about reasoning correctness with governance applied as a separate layer?

Scaling PAG to multi-agent systems where one agent verifies another's output — rather than self-verification — is another open research direction. Cross-agent verification introduces adversarial dynamics (the verified agent may learn to produce outputs that fool the verifier) that self-verification avoids but also loses the independent perspective that external verification provides.

## Media

- ![Reinforcement Learning Diagram](https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Reinforcement_learning_diagram.svg/800px-Reinforcement_learning_diagram.svg.png) — Agent-environment interaction loop showing the policy-reward cycle central to PAG's multi-turn RL training
- ![Markov Decision Process](https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Markov_Decision_Process.svg/800px-Markov_Decision_Process.svg.png) — Markov decision process formalism underlying PAG's sequential generate-verify-revise trajectory
- ![Neural Network Layers](https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Colored_neural_network.svg/560px-Colored_neural_network.svg.png) — Neural network architecture representing the unified policy-verifier model
- ![Recurrent Neural Network](https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Recurrent_neural_network_unfold.svg/900px-Recurrent_neural_network_unfold.svg.png) — Unfolded recurrent architecture illustrating multi-turn self-correction across time steps
- ![Gradient Descent](https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Gradient_descent.svg/700px-Gradient_descent.svg.png) — Gradient descent optimization used in reward-driven policy improvement for verification calibration

## Videos

- [Self-Correction in Large Language Models — Challenges and Solutions](https://www.youtube.com/watch?v=uRiCjpm7enI) — Overview of LLM self-correction approaches including verification-gated revision strategies
- [Reinforcement Learning from Human Feedback (RLHF) Explained](https://www.youtube.com/watch?v=2MBJOuVq380) — Foundation of multi-turn RL training methods used in PAG's joint policy-verifier optimization

## References

- Zhao, Y. et al. (2025). "PAG: Multi-Turn Reinforced LLM Self-Correction with Policy as Generative Verifier." arXiv:2506.10406. https://arxiv.org/abs/2506.10406
- PAG Project Page. https://jackory.github.io/pag/
- Huang, J. et al. (2024). "Large Language Models Cannot Self-Correct Reasoning Yet." arXiv:2310.01798. https://arxiv.org/abs/2310.01798
- Lightman, H. et al. (2023). "Let's Verify Step by Step." arXiv:2305.20050. https://arxiv.org/abs/2305.20050
- Yuan, W. et al. (2025). "Process Reinforcement through Implicit Rewards." arXiv:2502.01456. https://arxiv.org/abs/2502.01456
