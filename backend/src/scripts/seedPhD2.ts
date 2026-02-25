/**
 * PhD Batch 2 + Larry the Auditor knowledge seed
 * Run: npx tsx src/scripts/seedPhD2.ts
 */
import { PrismaClient, KbDocumentStatus } from "@prisma/client";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), "../.env") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();
const TENANT_ID = (process.env.TENANT_ID ?? "").trim().replace(/\s/g, "");
const CREATED_BY = process.env.SEED_CREATED_BY ?? TENANT_ID ?? "00000000-0000-0000-0000-000000000001";
if (!TENANT_ID) { console.error("TENANT_ID not set"); process.exit(1); }

const DOCS: { slug: string; title: string; tags: string[]; body: string }[] = [

// ══════════════════════════════════════════════════════
// AUTONOMOUS SYSTEMS
// ══════════════════════════════════════════════════════
{
slug: "autonomous-systems-phd",
title: "Autonomous Systems — Architecture, Safety, and Deployment",
tags: ["autonomous-systems","phd-autonomous","robotics","self-driving","safety"],
body: `# Autonomous Systems

## System Architecture

### Sense-Plan-Act (SPA) Loop
The foundational paradigm:
1. **Sense:** Collect data from sensors (LiDAR, camera, radar, IMU, GPS)
2. **Perceive:** Process sensor data into world model (object detection, SLAM, semantic segmentation)
3. **Plan:** Generate action sequences to achieve goals (global path + local trajectory planning)
4. **Act:** Execute actions via actuators (steering, throttle, brake, motor controllers)

**Reactive architectures:** Short-circuit plan; direct sensor-to-actuator for fast response (Brooks subsumption). Combine with deliberative for hybrid.

### Autonomy Levels (SAE J3016)
- **L0:** No automation (driver does all)
- **L1:** Driver assistance (adaptive cruise OR lane keeping)
- **L2:** Partial automation (ACC + lane centering; driver supervises)
- **L3:** Conditional automation (system drives; driver must respond to requests)
- **L4:** High automation (fully autonomous in defined ODD; no driver needed in ODD)
- **L5:** Full automation (no ODD limitation)

ODD = Operational Design Domain (weather, road type, speed range, geography).

## Perception Stack

### Object Detection
- **LiDAR 3D detection:** PointPillars, VoxelNet, CenterPoint — convert point clouds to pseudo-image or voxels
- **Camera 2D detection:** YOLO, DETR — real-time, cheap sensors but depth ambiguous
- **Radar:** All-weather, velocity from Doppler; low resolution; crucial for L4+
- **Sensor fusion:** Late fusion (fuse predictions), early fusion (fuse raw data), middle fusion (feature fusion)

### Semantic Segmentation
Assign class label to every pixel/point.
- Camera: SegFormer, Mask2Former
- LiDAR: RandLA-Net, Cylinder3D
- Panoptic: stuff (road, sky) + things (cars, pedestrians) simultaneously

### Occupancy Grids
3D voxel representation; probability each cell is occupied.
BEV (Bird's Eye View) representations: project to top-down for planning.
Tesla Autopilot: pure vision → implicit 3D BEV representation.

## Planning

### Behavioral Layer
High-level decisions: lane change, merge, yield, follow.
Finite state machine or learned policy (IL, RL).

### Motion Planning
**Frenet frame:** Decompose trajectory into longitudinal (s) and lateral (d) coordinates along reference path.
Polynomial trajectory generation: minimize jerk (3rd derivative) — comfortable for passengers.
**Lattice planner:** Sample path+speed combinations; score by cost function (progress, comfort, safety).
**MPC (Model Predictive Control):** Online optimization over finite horizon with comfort + safety constraints.

### Prediction
Predict other agents' future trajectories.
- **Physics-based:** Constant velocity, CTRA (Constant Turn Rate and Acceleration)
- **Learning-based:** TNT, Wayformer, MotionTransformer — multimodal trajectory distributions
- Occupancy flow prediction: predict future BEV occupancy directly

## Functional Safety

### ISO 26262 (Automotive)
ASIL (Automotive Safety Integrity Level): A, B, C, D (D = most critical).
**HARA (Hazard Analysis and Risk Assessment):** Severity × Exposure × Controllability → ASIL.
**FMEA:** Failure Mode and Effects Analysis — systematic component failure analysis.
**Fault tree analysis:** Top-down: undesired event → causes.
Redundancy requirements: ASIL D requires independent redundant systems.

### SOTIF (Safety of the Intended Functionality — ISO 21448)
Complements ISO 26262. Addresses insufficiencies in design (not hardware failures).
Unknown unsafe scenarios; sensor performance limits; edge cases.
V&V (Validation & Verification) through simulation, closed-track testing, real-world miles.

## Simulation
**Challenge:** Long-tail events (accidents, edge cases) are rare on public roads.
- **CARLA:** Open-source simulator; photorealistic; Python API; used for research
- **SUMO:** Traffic-level simulation; not photorealistic; fast
- **Waymo Sim Agents:** Realistic agent behavior learned from real data
- **Domain randomization:** Vary lighting, weather, textures → robustness
- **Adversarial scenario generation:** Find worst-case inputs; targeted simulation

## V2X (Vehicle-to-Everything)
DSRC (802.11p) and C-V2X (cellular-based) communication.
Applications: intersection management, platooning, hazard warning.
Latency requirements: <100ms for safety-critical coordination.

## Self-Healing Mechanisms
**Fault detection and isolation (FDI):** Monitor component health; detect anomalies; isolate faulty module.
**Graceful degradation:** Fallback to safer operational mode on failure.
- L4 failure → L2 (driver takes over with warning)
- Sensor failure → increase uncertainty; reduce speed; pull over safely
**Watchdog timers:** Hardware monitor; resets system on software hang.
**Redundant compute:** Primary + backup ECU; voting for disagreement detection.
**Online model adaptation:** Detect distribution shift; trigger retraining pipeline; A/B test new model.
`
},

// ══════════════════════════════════════════════════════
// COGNITIVE MODELING
// ══════════════════════════════════════════════════════
{
slug: "cognitive-modeling-phd",
title: "Cognitive Modeling — Computational Theories of Mind",
tags: ["cognitive-modeling","phd-cognitive","cognitive-science","actr","bayesian-brain"],
body: `# Cognitive Modeling

## What is Cognitive Modeling?
Build computational models of human cognitive processes (perception, memory, attention, decision-making, language). Goal: explain and predict human behavior; inform AI design.

## Classical Architectures

### ACT-R (Adaptive Control of Thought—Rational, Anderson)
Production system: IF-THEN rules fire on symbolic representations.
**Modules:** Declarative memory, procedural memory, visual, manual, phonological, goal.
**Buffers:** Bottleneck; one chunk active per buffer at a time.
**Activation:** A_i = B_i + Σ W_j S_ji + ε — base-level + spreading + noise.
Base-level learning: A_i = ln(Σ t_j^{-d}) — recency/frequency of past retrievals.
Maps to neural regions: basal ganglia (procedural), hippocampus (declarative), prefrontal (goal).

### SOAR (Laird, Rosenbloom, Newell)
Universal cognitive architecture. Problem space: state, operators, goals.
Chunking: learn new productions from successful problem-solving episodes (macro-learning).
Impasse-driven learning: deadlock → create subgoal → resolve → chunk.

### EPIC (Kieras, Meyer)
Focus on perceptual-motor performance. Multiple processors (visual, auditory, motor) in parallel.
Predict human performance times in HCI tasks.

## Memory Systems

### Working Memory (Baddeley)
Central executive + phonological loop + visuospatial sketchpad + episodic buffer.
Capacity: 7±2 items (Miller) → 4 chunks (Cowan).
**Decay:** ~2 seconds without rehearsal.

### Long-Term Memory
Declarative: episodic (autobiographical events) + semantic (facts).
Non-declarative: procedural, priming, classical conditioning.
**Consolidation:** Hippocampal-dependent → slow transfer to neocortex during sleep.
**Spacing effect:** Distributed practice outperforms massed practice (Ebbinghaus).

### Forgetting
**Interference theory:** Proactive (old interferes with new) + Retroactive (new interferes with old).
**Power law of forgetting:** P(recall) ∝ t^{-d} — hyperbolic, not exponential decay.
**Reconsolidation:** Memories become labile on retrieval; subject to modification.

## Bayesian Brain Hypothesis
Perception as inference: P(world | sensory data) ∝ P(sensory data | world) P(world).
Brain maintains generative model of world; updates via Bayes.
**Predictive coding (Friston):** Higher areas generate predictions; lower areas send prediction errors upward. Attention = precision-weighting of prediction errors.
**Active inference:** Agent acts to minimize expected free energy; unifies perception and action.

## Decision Making

### Expected Utility Theory (Rational Agent)
Choose action a* = argmax_a Σ P(outcome | a) U(outcome).
Basis of classical economics and AI utility maximization.

### Prospect Theory (Kahneman & Tversky)
**Reference-dependent:** Value function relative to reference point (status quo).
**Loss aversion:** Losses loom larger than equivalent gains: λ ≈ 2.25.
**Diminishing sensitivity:** Concave for gains, convex for losses.
**Probability weighting:** Overweight small probabilities, underweight moderate-high.
Explains: endowment effect, status quo bias, risk-seeking for losses.

### Dual Process Theory (Kahneman System 1/2)
**System 1:** Fast, automatic, associative, emotional, heuristic-driven.
**System 2:** Slow, deliberate, effortful, rule-based.
Cognitive biases arise from System 1 heuristics; System 2 correction often fails.

### Heuristics and Biases
- **Availability:** Judge probability by ease of recall → overestimate dramatic events
- **Representativeness:** Judge by similarity to prototype → base rate neglect
- **Anchoring:** Insufficient adjustment from initial value
- **Confirmation bias:** Seek/interpret information confirming prior beliefs
- **Dunning-Kruger:** Incompetent people overestimate ability; experts underestimate

## Attention

### Selective Attention
Feature Integration Theory (Treisman): Pre-attentive pop-out for single features; conjunction search requires attention.
Visual search: O(1) for single feature, O(n) for conjunction.

### Attentional Bottleneck
Broadbent: early selection (filter at sensory stage).
Treisman: attenuation (weakening, not blocking, unattended).
Late selection (Deutsch & Deutsch): semantic processing before selection.

## Cognitive Load Theory (Sweller)
Working memory limited → learning must manage intrinsic + extraneous + germane load.
**Intrinsic:** Inherent complexity of material (element interactivity).
**Extraneous:** Poor instructional design adds unnecessary load.
**Germane:** Effort contributing to schema formation (desirable).
Implications for UI design: minimize extraneous load; chunk information.

## Language and Cognition

### Sapir-Whorf Hypothesis (Linguistic Relativity)
Strong: language determines thought (discredited in strong form).
Weak: language influences thought (supported). Color terms affect color discrimination. Spatial language affects spatial reasoning.

### Mental Models (Johnson-Laird)
Reasoning by constructing and inspecting internal models, not applying formal logic rules.
Explains systematic errors in syllogistic reasoning.

## Applications to AI
- **Cognitive architecture AI:** SOAR, ACT-R integrated with ML for human-like reasoning
- **Theory of Mind:** AI that models other agents' beliefs/desires/intentions
- **Cognitive biases in ML:** Confirmation bias in data labeling; availability heuristic in feature selection
- **Human-AI interaction:** Design AI to match human cognitive load limits; predictable errors
`
},

// ══════════════════════════════════════════════════════
// MATHEMATICS FOUNDATIONS
// ══════════════════════════════════════════════════════
{
slug: "math-linear-algebra-ml",
title: "Linear Algebra for Machine Learning",
tags: ["mathematics","linear-algebra","phd-math","foundations"],
body: `# Linear Algebra for Machine Learning

## Vectors and Spaces
**Vector space:** Set V with addition and scalar multiplication satisfying 8 axioms.
**Subspace:** Closed under addition and scalar multiplication.
**Span:** All linear combinations of a set of vectors.
**Linear independence:** No vector in set expressible as linear combination of others.
**Basis:** Linearly independent spanning set. Dimension = |basis|.

## Matrix Operations

### Fundamental Products
Matrix multiply A (m×n) × B (n×p) → C (m×p): C_ij = Σ_k A_ik B_kj. O(mnp).
Hadamard (elementwise): A⊙B. Kronecker product: A⊗B.

### Four Fundamental Subspaces (of A: m×n)
- **Column space C(A):** Span of columns; dim = rank(A)
- **Null space N(A):** {x: Ax=0}; dim = n - rank(A)
- **Row space C(A^T):** Span of rows; dim = rank(A)
- **Left null space N(A^T):** dim = m - rank(A)
Orthogonality: C(A) ⊥ N(A^T), C(A^T) ⊥ N(A)

## Eigendecomposition
Av = λv → v is eigenvector, λ is eigenvalue.
Characteristic polynomial: det(A - λI) = 0.
A = QΛQ^{-1} (if A has n linearly independent eigenvectors).
For symmetric A: A = QΛQ^T (Q orthogonal — spectral theorem).

**Applications in ML:**
- PCA: eigendecomposition of covariance matrix
- Markov chains: stationary distribution = dominant eigenvector
- Graph Laplacian: spectral clustering; Fiedler vector for cuts
- PageRank: dominant eigenvector of transition matrix

## Singular Value Decomposition (SVD)
A = UΣV^T where U (m×m) and V (n×n) are orthogonal, Σ (m×n) diagonal with σ_1 ≥ σ_2 ≥ ... ≥ 0.

**Truncated SVD:** Keep top-k singular values → best rank-k approximation (Eckart-Young theorem).
||A - A_k||_F is minimized by truncated SVD.

**Applications:**
- Dimensionality reduction / LSA (Latent Semantic Analysis)
- Pseudo-inverse: A^+ = VΣ^+U^T
- Image compression
- Collaborative filtering (matrix factorization)
- Numerical stability analysis (condition number κ = σ_max/σ_min)

## Norms
**Vector norms:**
- L1: ||x||_1 = Σ|x_i| (promotes sparsity)
- L2: ||x||_2 = √(Σx_i²) (Euclidean)
- L∞: ||x||_∞ = max|x_i|
- Lp: ||x||_p = (Σ|x_i|^p)^{1/p}

**Matrix norms:**
- Frobenius: ||A||_F = √(Σ_ij a_ij²) = √(trace(A^TA)) = √(Σ σ_i²)
- Nuclear: ||A||_* = Σ σ_i (trace norm; convex surrogate for rank)
- Spectral: ||A||_2 = σ_max

## Calculus on Matrices
**Gradient of scalar f(x):** ∂f/∂x — vector of partial derivatives.
**Jacobian:** ∂f/∂x^T — matrix if f: R^n → R^m.
**Hessian:** H = ∂²f/∂x∂x^T — symmetric matrix of second partials.

**Chain rule (matrix form):**
df/dX = (∂f/∂Y)(∂Y/∂X) — dimensions must align.

**Common results:**
- d(x^TAx)/dx = (A+A^T)x; = 2Ax if A symmetric
- d(trace(AX))/dX = A^T
- d(log det X)/dX = X^{-T}

## Optimization Geometry
**Convex set:** λx + (1-λ)y ∈ S ∀λ∈[0,1].
**Convex function:** f(λx+(1-λ)y) ≤ λf(x)+(1-λ)f(y).
**Positive (semi)definite:** All eigenvalues > 0 (≥ 0). Hessian PD → strictly convex function.

**Second-order optimality conditions:**
- Necessary: ∇f = 0 and H PSD
- Sufficient: ∇f = 0 and H PD → local minimum
- Global minimum in convex f: any stationary point is global minimum
`
},

{
slug: "math-calculus-statistics",
title: "Calculus and Statistics for AI",
tags: ["mathematics","calculus","statistics","probability","phd-math","foundations"],
body: `# Calculus and Statistics for AI

## Multivariate Calculus

### Partial Derivatives and Gradients
∂f/∂x_i: rate of change holding all other variables fixed.
∇f(x) = [∂f/∂x_1, ..., ∂f/∂x_n]^T — direction of steepest ascent.
∇f(x) = 0 at critical points (necessary condition for min/max).

### Chain Rule
If f = g(h(x)): df/dx = (dg/dh)(dh/dx).
For vectors: df/dx = (∂f/∂h)(∂h/∂x) — Jacobian composition.
Foundation of backpropagation.

### Taylor Series
f(x) ≈ f(x₀) + ∇f(x₀)^T(x-x₀) + ½(x-x₀)^T H(x₀)(x-x₀) + ...
First-order: linear approximation (gradient descent step).
Second-order: quadratic approximation (Newton's method).

### Lagrange Multipliers
Constrained optimization: minimize f(x) subject to g(x) = 0.
L(x,λ) = f(x) + λg(x). Solve ∇L = 0.
KKT conditions for inequality constraints g(x) ≤ 0:
∇f + λ∇g = 0, λ ≥ 0, λg(x) = 0.

### Integral Calculus
**Change of variables:** ∫f(g(x))g'(x)dx = ∫f(u)du.
**Gaussian integral:** ∫_{-∞}^∞ e^{-x²} dx = √π.
**Gaussian with variance:** ∫ N(x;μ,σ²) dx = 1 by construction.
**Integration by parts:** ∫u dv = uv - ∫v du.

## Probability Theory

### Axioms (Kolmogorov)
P(∅) = 0, P(Ω) = 1, P(A∪B) = P(A)+P(B) for disjoint A,B.
**Conditional:** P(A|B) = P(A∩B)/P(B).
**Bayes' theorem:** P(A|B) = P(B|A)P(A)/P(B).
**Independence:** P(A∩B) = P(A)P(B).

### Random Variables
**PMF:** P(X=x) for discrete. **PDF:** f(x) with ∫f(x)dx = 1 for continuous.
**CDF:** F(x) = P(X≤x). **Expectation:** E[X] = Σx P(X=x) or ∫x f(x)dx.
**Variance:** Var(X) = E[(X-μ)²] = E[X²] - (E[X])².
**Covariance:** Cov(X,Y) = E[(X-μ_X)(Y-μ_Y)] = E[XY] - E[X]E[Y].

### Key Distributions
**Bernoulli(p):** P(X=1)=p, P(X=0)=1-p. E=p, Var=p(1-p).
**Binomial(n,p):** P(X=k) = C(n,k)p^k(1-p)^{n-k}.
**Poisson(λ):** P(X=k) = e^{-λ}λ^k/k!. E=Var=λ. Models rare events.
**Gaussian N(μ,σ²):** f(x) = exp(-(x-μ)²/2σ²)/√(2πσ²). Central limit theorem.
**Exponential(λ):** f(x) = λe^{-λx}. Memoryless. Models wait times.
**Beta(α,β):** Conjugate prior for Bernoulli/Binomial. E = α/(α+β).
**Dirichlet(α):** Generalization of Beta; conjugate prior for Categorical/Multinomial.
**Wishart:** Matrix generalization of chi-squared; conjugate prior for Gaussian precision matrix.

### Limit Theorems
**Law of Large Numbers:** X̄_n → μ as n→∞ (weak: in probability; strong: almost surely).
**Central Limit Theorem:** √n(X̄_n - μ)/σ → N(0,1) as n→∞.
**Chebyshev's inequality:** P(|X-μ| ≥ kσ) ≤ 1/k².

## Statistical Inference

### Maximum Likelihood Estimation (MLE)
θ̂_MLE = argmax_θ Σ_i log P(x_i; θ).
Consistent, asymptotically efficient (achieves Cramér-Rao bound).
Cramér-Rao: Var(θ̂) ≥ 1/I(θ) where I(θ) = E[(∂log P/∂θ)²].

### Bayesian Inference
Posterior ∝ Likelihood × Prior: P(θ|D) ∝ P(D|θ)P(θ).
**MAP (Maximum A Posteriori):** θ̂_MAP = argmax P(D|θ)P(θ).
MAP with Gaussian prior = L2 regularization. MAP with Laplace prior = L1.
**Full Bayesian:** Maintain full posterior; marginalize for predictions.
MCMC (Markov Chain Monte Carlo): Metropolis-Hastings, Gibbs sampling, HMC.
Variational inference: approximate posterior with tractable family; minimize KL.

### Hypothesis Testing
H₀ (null) vs H₁ (alternative).
**p-value:** P(data as extreme or more | H₀ true). Not probability H₀ is true.
**Type I error (α):** Reject true H₀ (false positive). Conventional α = 0.05.
**Type II error (β):** Fail to reject false H₀ (false negative). Power = 1-β.
**Confidence intervals:** P(CI contains θ) = 1-α over repeated experiments.

### Common Tests
- t-test: compare means (1-sample, 2-sample, paired)
- Chi-squared: goodness of fit; independence in contingency tables
- ANOVA: compare means across 3+ groups; F-statistic
- Mann-Whitney U: non-parametric alternative to t-test
- Kolmogorov-Smirnov: test if sample follows distribution

### Multiple Comparisons
Family-wise error rate (FWER): Bonferroni correction: α' = α/m.
False Discovery Rate (FDR): Benjamini-Hochberg procedure. Less conservative; standard in genomics.
`
},

// ══════════════════════════════════════════════════════
// PHILOSOPHY (AI, MIND, ETHICS)
// ══════════════════════════════════════════════════════
{
slug: "philosophy-ai-mind",
title: "Philosophy of AI, Mind, and Technology",
tags: ["philosophy","phd-philosophy","philosophy-of-mind","ai-ethics","epistemology"],
body: `# Philosophy of AI, Mind, and Technology

## Philosophy of Mind

### The Mind-Body Problem
How does subjective experience arise from physical matter?
**Dualism (Descartes):** Mind and body are fundamentally different substances. Interaction problem: how do they causally interact?
**Physicalism/Materialism:** Mental states are physical states. Everything mental reduces to or supervenes on physical.
**Property dualism:** One substance (matter) with two types of properties (physical and mental).
**Functionalism:** Mental states defined by functional roles (causal relations to inputs, outputs, other states) — not physical composition.

### Functionalism and AI Implications
If mind = functional organization, then silicon can think if organized correctly.
**Multiple realizability:** Same mental state in different physical substrates (humans, aliens, AI).
Functionalism is the implicit philosophy of most AI researchers.

### The Chinese Room (Searle, 1980)
Imagine someone in a room following rules to manipulate Chinese symbols. Outputs are grammatically correct Chinese — but the person doesn't understand Chinese.
**Argument:** Syntax ≠ Semantics. Computation (symbol manipulation) cannot by itself produce genuine understanding or intentionality.
**Responses:** Systems reply (the room as a whole understands), robot reply, brain simulator reply.
**AI implication:** Do LLMs "understand"? Searle says no — stochastic parrots at best.

### Consciousness and the Hard Problem (Chalmers)
**Easy problems:** Explain cognitive functions (perception, attention, memory). Science can in principle explain these.
**Hard problem:** Why is there subjective experience at all? Why does information processing feel like anything?
Qualia: subjective, first-person character of experience (the redness of red).
**Philosophical zombie:** Functionally identical to human but no inner experience. Conceivable → physicalism in trouble?

### Integrated Information Theory (Tononi)
Consciousness = integrated information Φ.
Φ measures how much information is generated by the system as a whole beyond its parts.
High Φ → high consciousness. Feedforward networks: Φ=0 (no consciousness).
Controversial: some mathematical structures might be more conscious than humans.

## Epistemology and Knowledge

### What is Knowledge?
**Justified True Belief (Plato):** S knows P iff S believes P, P is true, S is justified in believing P.
**Gettier problem (1963):** Counterexamples show JTB insufficient. Extended debate since.
**Reliabilism:** Belief counts as knowledge if produced by reliable cognitive process.
**Virtue epistemology:** Focus on intellectual virtues (open-mindedness, rigor, intellectual courage).

### Applied to AI
- What does an LLM "know"? Memorization vs. generalization vs. understanding.
- Is in-context learning a form of knowledge acquisition?
- Do AI systems have justified beliefs or just statistically coherent outputs?

### Epistemology of Science
**Inductivism:** Generalize from observations to universal laws. Hume's problem: induction cannot be logically justified.
**Falsificationism (Popper):** Science proceeds by bold conjectures, rigorous refutations. Not-falsifiable ≠ scientific.
**Kuhn's paradigms:** Normal science within paradigm → anomalies accumulate → revolution → new paradigm. Science is not purely rational.
**Underdetermination:** Multiple theories consistent with same data — theory choice involves social/pragmatic factors.

## Ethics and Moral Philosophy

### Consequentialism (Utilitarianism — Mill, Bentham)
Rightness determined by outcomes. Maximize aggregate welfare/utility.
**Act utilitarianism:** Evaluate each action.
**Rule utilitarianism:** Follow rules that maximize welfare if generally adopted.
**AI application:** Maximize expected utility; welfare functions; alignment with human preferences.

### Deontology (Kant)
Rightness determined by rules/duties, not consequences.
**Categorical imperative:** Act only according to maxims you could will to be universal laws.
**Persons as ends:** Never treat persons merely as means to ends.
**AI application:** Rights-based constraints; never harvest organs to save five; privacy as inviolable right.

### Virtue Ethics (Aristotle)
Focus on character and human flourishing (eudaimonia). What would a virtuous person do?
**Virtues:** Courage, justice, temperance, prudence (practical wisdom).
**AI application:** AI character/values; professional ethics; virtue in design.

### Applied AI Ethics
- **Fairness:** Equal treatment? Equal outcomes? Equalized odds? Metrics can conflict.
- **Privacy:** Contextual integrity (Nissenbaum): information flows appropriately when matching norms of originating context.
- **Transparency:** Explainability; right to explanation (GDPR Art. 22).
- **Autonomy:** Preserve human agency; avoid manipulation; informed consent.
- **Power concentration:** AI accelerating inequality; monopoly risks.

## Philosophy of Technology

### Technological Determinism vs. Social Construction
**Determinism:** Technology shapes society; autonomous force.
**Social construction (SCOT):** Technology shaped by social forces; interpretive flexibility; relevant social groups.
**Winner's "Do Artifacts Have Politics?":** Some technologies embody political values (road bridges too low for buses → segregation).

### Existential Risk (Ord, Bostrom)
**Superintelligence (Bostrom):** Intelligence explosion → AI surpasses human intelligence → orthogonality thesis (superintelligence can have arbitrary goals) + instrumental convergence (any agent wants resources, self-preservation, goal preservation).
**X-risk from AI:** Misaligned superintelligence could be existential threat.
**Longtermism:** Actions affecting long-run future matter most (billions of future people).
`
},

// ══════════════════════════════════════════════════════
// STRATEGIC MANAGEMENT
// ══════════════════════════════════════════════════════
{
slug: "biz-strategic-management",
title: "Strategic Management — Advanced Frameworks",
tags: ["business-management","strategic-management","strategy","phd-business"],
body: `# Strategic Management

## Strategy Levels
- **Corporate strategy:** What businesses to compete in; portfolio management; M&A
- **Business unit strategy:** How to compete in chosen markets (cost leadership, differentiation, focus)
- **Functional strategy:** How each function (marketing, operations, finance) supports business strategy

## Generic Competitive Strategies (Porter)

### Cost Leadership
Achieve lowest cost in industry. Sources: economies of scale, learning curve, process efficiency, location advantages.
Risk: technological change nullifying past investment; competitors learning to copy.

### Differentiation
Offer unique value commanding premium price. Sources: product features, service, brand, distribution.
Risk: premium too high; imitation; buyers stop valuing differentiator.

### Focus (Niche)
Serve narrow market segment. Cost focus or differentiation focus.
Risk: niche disappears; broad competitors invade niche; customer preferences change.

**Stuck in the middle:** No sustainable advantage. Must choose.

## Dynamic Capabilities (Teece, Pisano, Shuen)
Static resources insufficient in fast-changing environments.
**Dynamic capabilities:** Ability to sense opportunities, seize them, transform organization.
- **Sensing:** Scanning, learning, interpreting; identify threats/opportunities
- **Seizing:** Mobilizing resources to capture value; business model design
- **Transforming:** Continuous renewal; avoid core rigidities

Resource-Based View (Barney): Sustainable competitive advantage from VRIN resources:
- **Valuable:** Enables exploitation of opportunities
- **Rare:** Not widely distributed
- **Inimitable:** Costly to imitate (causal ambiguity, social complexity, path dependence)
- **Non-substitutable:** No strategic equivalents

## Corporate Strategy

### Portfolio Management
BCG Matrix (see Business Management doc) + GE-McKinsey for multi-business allocation.
**Parenting advantage:** Corporate center must add more value than cost of corporate overhead.
**Related vs unrelated diversification:** Related: exploit shared resources/capabilities; Unrelated (conglomerate): purely financial rationale; generally inferior returns.

### M&A (Mergers and Acquisitions)
**Strategic rationales:** Economies of scale, market power, access to capabilities, geographic expansion, elimination of competitor.
**Failure rate:** 70-90% fail to create value (McKinsey). Common causes: overpayment (winner's curse), integration failure, strategic misfit.
**Integration levels:** Full integration, partial (preserve autonomy), symbiosis (selective sharing).
**Due diligence:** Financial (quality of earnings), legal, operational, cultural.

### Vertical Integration
**Forward integration:** Into downstream activities (manufacturer → retail).
**Backward integration:** Into upstream activities (retailer → manufacturer).
Make-or-buy decision: transaction cost economics (Williamson). Integrate when: asset specificity high, uncertainty high, opportunism likely.

## Blue Ocean Strategy (Kim & Mauborgne)
Create uncontested market space; make competition irrelevant.
**Strategy canvas:** Plot industry on key competing factors → visualize current state.
**ERRC grid:** Eliminate (industry assumptions), Reduce (below standard), Raise (above standard), Create (never offered).
Examples: Cirque du Soleil (eliminated animals, stars; created theme, artistic environment); Southwest Airlines.

## Scenario Planning
Prepare for multiple plausible futures rather than forecasting one.
1. **Focal question:** Key strategic decision
2. **Driving forces:** STEEP scan for critical uncertainties
3. **Critical uncertainties:** 2 axes generating 4 scenarios
4. **Scenario development:** Internally consistent narratives
5. **Strategic implications:** Robust strategies across scenarios; signposts to monitor

## Strategic Execution
**McKinsey 7S:** Strategy, Structure, Systems, Staff, Skills, Style, Shared Values.
All seven must align for successful execution.

**Balanced Scorecard (Kaplan & Norton):** Four perspectives:
- Financial: revenue growth, profitability, ROI
- Customer: satisfaction, retention, market share
- Internal processes: efficiency, quality, cycle time
- Learning & growth: employee skills, culture, technology

Strategy maps: visualize causal chain from capabilities → processes → customers → financials.
`
},

// ══════════════════════════════════════════════════════
// ORGANIZATIONAL BEHAVIOR
// ══════════════════════════════════════════════════════
{
slug: "biz-organizational-behavior",
title: "Organizational Behavior — Leadership, Culture, and Teams",
tags: ["business-management","organizational-behavior","leadership","culture","teams"],
body: `# Organizational Behavior

## Individual Behavior

### Personality — Big Five (OCEAN)
Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism.
Conscientiousness = strongest predictor of job performance across roles.
Emotional stability (low neuroticism) = second strongest predictor.

### Motivation Theories

**Maslow's Hierarchy:** Physiological → Safety → Social → Esteem → Self-actualization.
Critique: limited empirical support; cultural bias; doesn't apply linearly.

**Herzberg Two-Factor:** Hygiene factors (salary, security) prevent dissatisfaction but don't motivate. Motivators (achievement, recognition, growth) drive satisfaction and performance.

**Self-Determination Theory (Ryan & Deci):** Autonomy + Competence + Relatedness → intrinsic motivation. Extrinsic rewards can crowd out intrinsic (overjustification effect).

**Expectancy Theory (Vroom):** Motivation = Expectancy × Instrumentality × Valence.
- Expectancy: Can I do it?
- Instrumentality: Will performance lead to outcome?
- Valence: Do I value the outcome?

### Attitudes and Behavior
**Cognitive dissonance:** Discomfort from conflicting beliefs/behaviors → rationalization or change.
**Job satisfaction → performance:** Moderate correlation (r≈0.30). Happy workers are somewhat more productive.
**Organizational commitment:** Affective (want to stay), Continuance (need to stay), Normative (obligated to stay). Affective strongest predictor of outcomes.

## Group and Team Dynamics

### Group Development (Tuckman)
Forming → Storming → Norming → Performing → Adjourning.
Most teams don't progress linearly; regression under stress.

### Social Loafing
Reduction in individual effort in groups. Reduces when: individual contributions identifiable, tasks meaningful, group cohesion high, clear accountability.

### Groupthink (Janis)
Symptoms: illusion of invulnerability, collective rationalization, stereotyped out-groups, self-censorship, illusion of unanimity.
Prevention: devil's advocate, leader stays neutral initially, anonymous input, outside experts.

### Team Effectiveness (Hackman)
- Real team (stable membership, clear boundaries, interdependent tasks)
- Compelling direction (consequential, clear, challenging)
- Enabling structure (tasks, composition, norms)
- Supportive context (rewards, information, education)
- Expert coaching

### Psychological Safety (Edmondson)
Team climate where members feel safe to speak up, take risks, admit mistakes.
Strongest predictor of team learning and performance (Google Project Aristotle).
Leaders build it by: modeling fallibility, inviting input, responding positively to bad news.

## Leadership

### Trait Theories
Extraversion, conscientiousness, openness predict leadership emergence.
Intelligence: moderate predictor of leader effectiveness.
"Leader gene" — weak evidence; mostly situational.

### Behavioral Theories
Ohio State: Initiating structure (task orientation) + Consideration (people orientation).
Blake-Mouton Grid: 9×9 matrix; (9,9) "Team Management" = ideal.

### Contingency Theories
**Fiedler:** Match leader style to situation (task vs relationship-oriented). Situational favorability = leader-member relations + task structure + position power.
**Path-Goal:** Leader facilitates follower performance by clarifying path, removing obstacles. Style: directive, supportive, participative, achievement-oriented.

### Transformational Leadership
4 Is: Idealized influence (charisma), Inspirational motivation, Intellectual stimulation, Individualized consideration.
Consistently outperforms transactional (contingent reward, management by exception) on most outcomes.
**Servant leadership:** Leader serves followers; empowerment; community building.

## Organizational Culture

### Layers (Schein)
1. Artifacts: Visible structures, processes, language
2. Espoused beliefs and values: Strategies, goals, philosophies
3. Underlying assumptions: Unconscious, taken-for-granted beliefs

### Culture Typologies
**Competing Values Framework:** Clan, Adhocracy, Market, Hierarchy.
No culture is universally best — fit between culture and strategy matters.

### Culture Change
Hardest management challenge. Requires:
- Leadership modeling new behaviors consistently
- Changing reward systems
- Hiring for new culture; promoting champions
- Stories and rituals reinforcing new values
- Patience: 3-7 years for significant culture shift

## Organizational Design

### Mechanistic vs Organic
Mechanistic (bureaucratic): high specialization, formal rules, centralized authority — stable environments.
Organic (adhocracy): cross-functional teams, flat hierarchy, lateral communication — dynamic environments.

### Organizational Structures
- **Functional:** Group by discipline (marketing, engineering) — efficiency; poor coordination
- **Divisional:** Group by product/region — autonomy; duplication
- **Matrix:** Dual reporting — flexibility; role conflict
- **Network:** Virtual; outsource non-core — agile; coordination challenge
- **Holacracy/Flat:** Self-organization; no management hierarchy — works for small/high-trust teams
`
},

// ══════════════════════════════════════════════════════
// ENTREPRENEURSHIP & INNOVATION
// ══════════════════════════════════════════════════════
{
slug: "biz-entrepreneurship-innovation",
title: "Entrepreneurship and Innovation Frameworks",
tags: ["business-management","entrepreneurship","innovation","startup","lean-startup"],
body: `# Entrepreneurship and Innovation

## Opportunity Recognition

### Types of Opportunities
- **Discovery:** Opportunities exist, waiting to be found (Kirzner's alertness)
- **Creation:** Opportunities constructed through entrepreneur's actions (no prior existence)

### Opportunity Evaluation (Timmons)
Market attractiveness × Resource requirements × Team skills.
**Attractiveness criteria:** Market size (>$100M for VC), growth rate (>20%/yr), profitability, competitive dynamics, barriers to entry/exit.

### Ideation Frameworks
**Jobs-to-be-Done (Christensen):** People hire products to do a job. Identify the job (functional + emotional + social). Design for the job, not the customer demographic.
**Problem interview:** Talk to potential customers BEFORE building. "Tell me about the last time you experienced X problem." Validate problem severity, frequency, current solutions.
**10x principle:** Innovation must be 10× better than incumbent to overcome switching costs.

## Lean Startup (Ries)

### Build-Measure-Learn
1. **Build:** Minimum Viable Product (MVP) — smallest product that tests core hypothesis
2. **Measure:** Validated learning — real customer data, not vanity metrics
3. **Learn:** Pivot or persevere based on evidence

**Innovation accounting:**
- Establish baseline (current state of critical metrics)
- Engine tuning (improve metrics through experiments)
- Pivot or persevere (decide based on whether metrics improved enough)

### Types of MVPs
- **Concierge:** Do the service manually before automating (Airbnb cleaned homes manually)
- **Wizard of Oz:** System appears automated but human behind the scenes
- **Landing page:** Validate demand before building
- **Prototype:** Interactive mockup for user testing
- **Pre-sales/crowdfunding:** Validate willingness to pay before building

### Pivot Types
- **Zoom-in:** Feature becomes product
- **Zoom-out:** Product becomes feature
- **Customer segment:** Same product, different customer
- **Customer need:** Same customer, different problem
- **Platform:** Product becomes platform (or vice versa)
- **Business architecture:** High-margin low-volume → high-volume low-margin
- **Channel pivot:** Different distribution approach

## Disruptive Innovation (Christensen)

### Theory
Disruption starts in **low-end** (underserved, cost-sensitive) or **new-market** (non-consumption) footholds.
Disruptors offer simpler, cheaper, more convenient product — initially inferior on mainstream dimensions.
Incumbents ignore early disruptors (not profitable enough; not valued by best customers).
Disruptors improve over time → good enough for mainstream → incumbents cede market.

### Classic Examples
- Steel minimills vs. integrated mills (started with rebar — lowest margin)
- Digital cameras vs. film (started with low-resolution consumer cameras)
- Netflix vs. Blockbuster (started with non-hits via mail)
- iPhone vs. Nokia (started with messaging/apps; inferior as phone)

### Incumbent Response Challenges
- New business unit has different cost structure and metrics
- Cannibalizing existing profitable business
- Sales force ignores disruptive product (lower commission)
- Existing customer relationships pull toward sustaining innovation

## Innovation Management

### Ambidexterity
Organizations must simultaneously exploit current business (efficiency, reliability) and explore new opportunities (experimentation, risk-taking). In tension.
**Structural ambidexterity:** Separate units for explore vs. exploit.
**Contextual ambidexterity:** Same unit; individuals allocate time between.

### Stage-Gate Process
Idea → Scoping → Business case → Development → Testing → Launch.
Gates: Go/Kill/Hold decisions. Structured but can be slow and risk-averse.

### Innovation Horizons (McKinsey)
- **H1:** Core business (70% of resources) — defend and extend
- **H2:** Adjacent opportunities (20%) — scale emerging businesses
- **H3:** Transformational bets (10%) — explore disruptive opportunities

### Open Innovation (Chesbrough)
Use external ideas and paths to market alongside internal.
- **Outside-in:** License external IP, partnerships, acquisitions, crowdsourcing
- **Inside-out:** License unused IP outward; spinoffs
- **Coupled:** Alliances, joint ventures

## Venture Capital and Funding

### Funding Stages
Pre-seed ($50K-$500K) → Seed ($500K-$3M) → Series A ($3M-$15M) → Series B ($15M-$50M) → Series C+ → IPO/Acquisition.

### VC Math
VC funds need 10× return on fund. ~60% of portfolio = zero; 30% = small returns; 10% = fund returns.
Each investment needs potential to return 20-50× to make the math work. "Swing for the fences."

### Term Sheet Key Terms
- **Pre-money valuation:** Company value before investment
- **Liquidation preference:** VCs get 1× (or 2×) their money back before founders on exit
- **Anti-dilution:** Protection from down rounds (broad-based weighted average = founder-friendly; full ratchet = VC-friendly)
- **Pro-rata rights:** Right to maintain ownership % in future rounds
- **Board composition:** Founders + investor seats + independent seats
`
},

// ══════════════════════════════════════════════════════
// MARKETING AND SOCIAL MEDIA
// ══════════════════════════════════════════════════════
{
slug: "biz-marketing-framework",
title: "Marketing — Strategy, Digital, and Growth",
tags: ["business-management","marketing","digital-marketing","growth","social-media"],
body: `# Marketing Strategy and Digital Growth

## Marketing Fundamentals

### STP Framework
**Segmentation → Targeting → Positioning**

**Segmentation variables:**
- Demographic: age, gender, income, education
- Geographic: region, city size, climate
- Psychographic: lifestyle, values, personality (VALS framework)
- Behavioral: usage rate, benefits sought, loyalty stage, purchase occasion

**Targeting criteria:** Segment size, growth rate, profitability, competitive intensity, company fit.

**Positioning:** Owning a distinct, valued place in prospect's mind.
Positioning statement: "For [target segment] who [need/want], [brand] is the [category] that [key benefit/differentiator], because [reason to believe]."

### 4Ps (McCarthy) → 7Ps (Services)
- **Product:** Features, quality, packaging, branding, lifecycle
- **Price:** Cost-plus, value-based, competitive, freemium, penetration, skimming
- **Place:** Distribution channels, coverage, logistics, e-commerce vs. retail
- **Promotion:** Advertising, PR, sales promotion, personal selling, direct marketing
- + **People** (services), **Process**, **Physical evidence**

### Customer Journey Mapping
Awareness → Consideration → Decision → Purchase → Retention → Advocacy.
At each stage: What is customer thinking? Feeling? Doing? What touchpoints exist? What are gaps/pain points?

## Content Marketing

### Content Strategy
**Owned media:** Blog, social accounts, email list, YouTube channel — build long-term.
**Earned media:** Press coverage, word-of-mouth, reviews, shares — high credibility, low control.
**Paid media:** Ads — controllable, expensive, stops when spend stops.

**Content pillars:** 3-5 core topics aligned to brand + customer interest. Creates consistency and depth.

**Content types by funnel:**
- Top of funnel (awareness): educational blog posts, videos, podcasts, infographics
- Middle (consideration): case studies, webinars, comparison guides, email nurtures
- Bottom (decision): demos, testimonials, free trials, ROI calculators

### SEO Fundamentals
**Technical SEO:** Site speed (<3s), mobile-friendly, HTTPS, Core Web Vitals, structured data, sitemaps.
**On-page SEO:** Title tag (50-60 chars), meta description (150-160 chars), H1, keyword in URL, internal linking.
**Content SEO:** Search intent match; comprehensive coverage; E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).
**Off-page SEO:** Backlinks — quality (DA, relevance) over quantity. Guest posts, digital PR, resource page link building.

## Social Media Management

### Platform Strategy by Channel
**LinkedIn:**
- B2B focus; decision-makers; long-form + carousel posts; thought leadership
- Best content: industry insights, company culture, founder stories, case studies
- Optimal: 3-5 posts/week; engage with comments within 1 hour

**Instagram:**
- Visual storytelling; B2C; younger demographics; product showcase
- Formats: feed posts, Reels (highest reach), Stories (ephemeral), Carousels
- Optimal: 4-7 posts/week; Stories daily; Reels 3-5×/week

**X (Twitter/X):**
- Real-time; news; tech/finance audiences; discourse
- Optimal: 1-5 posts/day; threads for long-form; reply to trending conversations

**TikTok:**
- Short video; algorithm-driven discovery; entertainment-first
- Hook in first 1-3 seconds; trending sounds; authentic > polished
- Optimal: 1-4 videos/day for growth phase

**Facebook:**
- Declining organic reach; paid is dominant; older demographics; groups
- Groups as community tools; paid ads for targeting breadth

**Pinterest:**
- Discovery; DIY, fashion, food, home; high purchase intent
- Long content half-life (years vs. hours for Twitter)

### Content Calendar
Monthly themes → weekly focus → daily posts. Use scheduling tools (Buffer, Hootsuite, Later).
**70/20/10 rule:** 70% educational/entertaining, 20% shared/curated, 10% promotional.

### Social Media Metrics
**Awareness:** Reach, impressions, follower growth rate.
**Engagement:** Engagement rate = (likes+comments+shares)/reach. >1% = good; >3% = excellent.
**Conversion:** Click-through rate, website traffic from social, leads from social.
**Revenue:** Social media sourced revenue, social commerce sales.

### Community Management
Respond to comments within 1-2 hours (business hours). Every comment = conversation opportunity.
Brand voice: consistent tone across all responses. Document in brand voice guide.
Crisis protocol: negative post/tweet → acknowledge immediately → investigate → respond factually → take offline if needed.

## Growth Marketing

### Growth Loop Thinking
Not funnels — loops. Each user brings next user.
**Viral loops:** Product use → share → new users (WhatsApp).
**Content loops:** Content → SEO traffic → more content creators (Reddit, Quora).
**Paid loops:** Revenue → paid acquisition → more revenue (works when LTV > CAC).

### A/B Testing
Split traffic randomly; change one variable; measure conversion rate.
Statistical significance: p < 0.05 (5% chance result is noise). Need sufficient sample size first (power analysis).
**What to test:** Headlines, CTAs, pricing display, email subject lines, landing page layouts, ad creative.

### Email Marketing
Open rate benchmark: 20-25% for B2B; 15-20% for B2C.
Click rate benchmark: 2-5%.
**Subject line best practices:** 30-50 characters; curiosity or specificity; A/B test.
**Segmentation:** Behavioral (engaged vs. unengaged), demographic, purchase history.
**Automation flows:** Welcome sequence, abandoned cart, win-back (lapsed users), post-purchase.

### Paid Acquisition
**Google Ads:** Intent-based (search); high CPC but high purchase intent. Shopping ads for e-commerce.
**Meta Ads:** Interest/behavior/lookalike targeting; cheaper CPM; discovery-based.
**LinkedIn Ads:** Most expensive CPL but best B2B targeting (job title, company, seniority).
Attribution models: last click (simple but misleading), first click, linear, time-decay, data-driven.
`
},

// ══════════════════════════════════════════════════════
// ADVANCED ANALYTICS & DATA SCIENCE
// ══════════════════════════════════════════════════════
{
slug: "analytics-advanced-phd",
title: "Advanced Analytics — Methods, Models, and Applications",
tags: ["analytics","data-science","statistics","phd-analytics","machine-learning"],
body: `# Advanced Analytics

## Regression Analysis

### Linear Regression
y = Xβ + ε, ε ~ N(0,σ²I)
OLS estimator: β̂ = (X^TX)^{-1}X^Ty
Assumptions: Linearity, independence, homoscedasticity, normality of errors.
**Diagnostics:** Residual plots, Q-Q plot, VIF (multicollinearity), Cook's distance (outliers/influence).
**R²:** Proportion of variance explained. Adjusted R² penalizes for number of predictors.

### Logistic Regression
log(p/(1-p)) = Xβ (log-odds = linear combination)
p = 1/(1+e^{-Xβ}) (sigmoid)
Estimated via MLE (gradient descent or IRLS).
Coefficients interpreted as log-odds ratios. OR = exp(β).

### Regularized Regression
**Ridge (L2):** β̂ = (X^TX + λI)^{-1}X^Ty. Shrinks all coefficients.
**LASSO (L1):** Coordinate descent. Sparse solution. Feature selection.
**ElasticNet:** λ₁||β||₁ + λ₂||β||²₂. Combines L1 sparsity + L2 grouping.
Cross-validation to choose λ.

## Survival Analysis
Models time-to-event data where some observations are censored (event not yet occurred).

**Survival function:** S(t) = P(T > t) — probability event hasn't occurred by time t.
**Hazard rate:** h(t) = f(t)/S(t) — instantaneous event rate given survival to t.
**Kaplan-Meier estimator:** Non-parametric; step function; handles censoring.
**Cox Proportional Hazards:** h(t|x) = h₀(t)exp(Xβ). Semi-parametric. Hazard ratio = exp(β). Baseline hazard h₀ unspecified.

## Causal Inference

### Rubin Potential Outcomes
For each unit i and treatment Z∈{0,1}:
Y_i(0): outcome without treatment, Y_i(1): with treatment.
**ATE (Average Treatment Effect):** E[Y(1) - Y(0)]
**Problem:** Only one potential outcome observed (fundamental problem of causal inference).

### Randomized Controlled Trials (RCT)
Random assignment ensures Z ⊥ (Y(0),Y(1)) → unbiased ATE estimation.
Gold standard. Often infeasible (ethics, cost, time).

### Observational Methods

**Propensity Score Matching:**
e(x) = P(Z=1|X=x) — propensity to receive treatment.
Match treated/control units on e(x). Balance covariates.

**Inverse Probability Weighting (IPW):**
Weight treated by 1/e(x), control by 1/(1-e(x)).

**Difference-in-Differences (DiD):**
Compare change over time in treated vs. control group.
ATT = (Ȳ_treated_post - Ȳ_treated_pre) - (Ȳ_control_post - Ȳ_control_pre)
Parallel trends assumption: without treatment, both groups would have evolved similarly.

**Instrumental Variables (IV):**
Z is valid instrument if: Z → X (relevance), Z ⊥ confounders (exogeneity), Z → Y only through X (exclusion restriction).
2SLS estimator. Used in: Mendelian randomization (genes as IV for health exposures).

**Regression Discontinuity (RD):**
Assignment determined by threshold on running variable. Compare outcomes just above/below cutoff.
Local randomization assumption. Estimate causal effect at threshold.

## Time Series Analysis

### ARIMA (Box-Jenkins)
AR(p): y_t = Σφ_iy_{t-i} + ε_t (autoregressive)
MA(q): y_t = ε_t + Σθ_iε_{t-i} (moving average)
I(d): d differencing for stationarity
ARIMA(p,d,q). Model selection via ACF, PACF, AIC/BIC.

### Seasonality
SARIMA(p,d,q)(P,D,Q)_s. Prophet (Facebook): trend + seasonality + holidays; interpretable.

### State Space Models (Kalman Filter)
Latent state x_t; observation y_t = Hx_t + ε.
Handles missing data, time-varying parameters, multiple seasonalities.

### Neural Time Series
- LSTM: captures long-range dependencies
- Temporal Convolutional Networks (TCN): dilated causal convolutions; parallelizable
- Transformer (Informer, Autoformer): self-attention on time series; O(L log L)
- N-BEATS, N-HiTS: basis expansion; interpretable; SOTA on M-competition benchmarks

## Bayesian Methods in Analytics

### Bayesian A/B Testing
Instead of p-values: compute P(B > A | data). Report probability, credible intervals.
No optional stopping problem (can peek at data). More intuitive for business decisions.
Prior choice: non-informative (Beta(1,1)) or informative from historical data.

### Hierarchical (Multilevel) Models
Partial pooling: estimate group effects while sharing information across groups.
y_{ij} = α_j + βx_{ij} + ε, α_j ~ N(μ_α, σ²_α).
Shrinks extreme group estimates toward overall mean (regularization).
Applications: A/B testing with small groups, educational testing (students in schools), marketing mix models.

## Experimental Design

### Factorial Designs
Test multiple factors simultaneously. 2^k design: k factors at 2 levels each.
Main effects + interactions. Fractional factorial: 2^{k-p} — estimate main effects with fewer runs.

### Power Analysis
Power = 1 - β = P(reject H₀ | H₁ true).
Required n = f(effect size, α, power). Small effect size needs large n.
Cohen's d = (μ₁-μ₂)/σ_pooled. d=0.2 small, 0.5 medium, 0.8 large.

### Multi-Armed Bandit (Online Optimization)
Explore-exploit tradeoff in real-time. Don't wait for test to end.
- Thompson Sampling: Bayesian; sample from posterior; naturally balances
- UCB: deterministic; pull arm with highest upper confidence bound
Superior to A/B when rewards vary over time or fast convergence needed.
`
},

// ══════════════════════════════════════════════════════
// SELF-HEALING MECHANISMS
// ══════════════════════════════════════════════════════
{
slug: "atlas-self-healing-mechanisms",
title: "Atlas: Self-Healing, Resilience, and Adaptive Systems",
tags: ["atlas","self-healing","resilience","adaptive","system-design"],
body: `# Self-Healing Mechanisms for Autonomous AI Systems

## What is Self-Healing?
Autonomous detection and correction of failures, degradation, or drift — without human intervention. Goal: maintain system objectives despite faults, adversarial conditions, or environmental change.

## Fault Detection

### Model-Based Detection
Maintain a reference model of expected behavior. Compare actual output to expected.
**Residual generation:** r(t) = y(t) - ŷ(t). If |r(t)| > threshold → fault detected.
**Parity equations:** Consistency checks among redundant signals.
**Observer-based:** Luenberger observer; estimate state; residual = estimated - measured.

### Data-Driven Anomaly Detection
**Statistical process control:** X-bar charts, CUSUM, EWMA. Alert on distributional shift.
**Isolation Forest:** Random partitioning; anomalies require fewer splits.
**Autoencoders:** High reconstruction error → anomaly.
**One-class SVM:** Learn boundary of normal; flag outliers.
**Time-series specific:** STL decomposition residuals; LSTM prediction error monitoring.

### Drift Detection
**ADWIN (Adaptive Windowing):** Detect distribution shift in streaming data; adaptive window size.
**Page-Hinkley test:** Sequential change point detection.
**Population Stability Index (PSI):** Monitor input feature distributions monthly.
PSI < 0.1: stable; 0.1-0.2: monitor; > 0.2: significant drift → retrain.
**Performance monitoring:** Track model accuracy, precision, recall on production data with delayed labels.

## Fault Isolation
Once fault detected, identify source:
- **Structured residuals:** Design residuals to be sensitive to specific faults only
- **Causal analysis:** Trace error back through computation graph (attribution)
- **Component-wise testing:** Isolate modules; test each independently
- **Correlation analysis:** Which subsystem metrics correlate with failure signal?

## Fault Recovery

### Graceful Degradation
Maintain core functionality when components fail.
- Remove failed component; continue with reduced capability
- Switch to simpler fallback model (less accurate but reliable)
- Increase confidence thresholds to reduce risky decisions
- Alert human supervisors when uncertainty exceeds bounds

### Rollback
Maintain versioned snapshots of model weights + configuration.
On fault detection: rollback to last known good version.
Shadow deployment: run new model alongside old; compare; failover on divergence.

### Redundancy
- **Active redundancy:** Multiple identical systems run in parallel; vote on output
- **Standby redundancy:** Primary + backup; activate backup on primary failure
- **Diversity:** Different implementations of same function (different algorithms, teams) — protects against systematic faults

### Self-Repair via Online Learning
Continuously update model parameters from new data.
**Challenges:** Catastrophic forgetting (new learning overwrites old knowledge).
**Solutions:** EWC (Elastic Weight Consolidation): penalty = λΣF_i(θ_i - θ*_i)² for important weights. Progressive Neural Networks. Replay buffer (store past examples; mix with new).

## Adaptive Mechanisms

### Reinforcement Learning for Adaptation
Agent learns to adjust behavior based on environment feedback.
Detect distributional shift → trigger exploration → update policy → evaluate → deploy.
**Meta-reinforcement learning (MAML):** Learn to quickly adapt to new tasks from few examples.

### Bayesian Online Learning
Maintain posterior over model parameters; update with each observation.
Naturally quantifies uncertainty; uncertain → seek more data; confident → act.
**Thompson sampling** for exploration in adaptive systems.

### Feedback Loops in Atlas Context
1. **Monitor:** Track agent action outcomes (email delivery, content engagement, decision approvals)
2. **Evaluate:** Compare against expected KPIs (open rate, approval rate, error rate)
3. **Diagnose:** Identify which agents/workflows are underperforming
4. **Adapt:** Adjust agent prompts, decision thresholds, workflow parameters
5. **Validate:** A/B test new configuration against old
6. **Deploy:** Roll out change; continue monitoring

## Specific Atlas Self-Healing Patterns

### Email Worker Health
- Monitor job queue depth: alert if > 100 queued for > 30 min
- Monitor failure rate: alert if > 10% EMAIL_SEND jobs fail in 1 hour
- Auto-retry with exponential backoff: 1min → 5min → 15min → 1hr → dead letter queue
- Alert human on dead letter queue accumulation

### Agent Decision Drift
- Monitor approval rate per agent over rolling 30-day window
- If approval rate drops >20%: flag agent for review
- If CONFIDENCE drops below AUTO_SPEND_LIMIT threshold: escalate to human more aggressively
- Auto-adjust confidence thresholds based on domain performance

### KB Staleness
- Track last-updated timestamp per document category
- Alert if any critical domain document >90 days without review
- Flag documents where agent queries return no good matches (coverage gap)
- Trigger knowledge refresh workflow

### System Guardrails
Check ENGINE_ENABLED flag before executing expensive actions.
Monitor DAILY_SPEND against AUTO_SPEND_LIMIT; pause autonomous actions at 80% of limit.
MAX_ACTIONS_PER_DAY enforced per tenant; reset at midnight UTC.
Circuit breaker pattern: if external API failure rate > 50%, stop calling; retry after 5 min.
`
},

// ══════════════════════════════════════════════════════
// LARRY THE AUDITOR — FULL KNOWLEDGE BASE
// ══════════════════════════════════════════════════════
{
slug: "larry-accounting-principles",
title: "Larry: Accounting Principles and Standards (GAAP & IFRS)",
tags: ["larry","auditing","accounting","gaap","ifrs","standards"],
body: `# Accounting Principles and Standards

## GAAP (Generally Accepted Accounting Principles — US)

### Foundational Principles
**Going Concern:** Financial statements prepared assuming entity continues indefinitely.
**Accrual Basis:** Revenues recognized when earned; expenses when incurred — regardless of cash movement.
**Matching Principle:** Expenses matched to revenues they helped generate in same period.
**Revenue Recognition (ASC 606):** 5-step model:
1. Identify contract(s) with customer
2. Identify performance obligations
3. Determine transaction price
4. Allocate price to obligations
5. Recognize revenue when (or as) obligation satisfied

**Consistency:** Same accounting methods period-to-period. Change = disclose and justify.
**Materiality:** Only items that could influence decisions of financial statement users need full disclosure.
**Conservatism:** When uncertainty exists, choose options that result in lower assets/income.
**Full Disclosure:** All information necessary for informed users included in statements or notes.

### Key GAAP Standards
- **ASC 842 (Leases):** Operating and finance leases on balance sheet as right-of-use asset + liability.
- **ASC 815 (Derivatives):** Fair value accounting; hedge accounting requirements.
- **ASC 350 (Intangibles/Goodwill):** Annual goodwill impairment test (quantitative or qualitative first).
- **ASC 718 (Stock Compensation):** Fair value at grant date; expense over vesting period.
- **ASC 740 (Income Taxes):** Deferred tax assets/liabilities for temporary differences.

## IFRS (International Financial Reporting Standards)

### GAAP vs. IFRS Key Differences
| Topic | US GAAP | IFRS |
|-------|---------|------|
| Inventory | LIFO allowed | LIFO prohibited |
| Development costs | Expensed | Capitalized if criteria met |
| Revaluation of PP&E | Not allowed | Allowed |
| Investment property | Historical cost | Fair value option |
| Revenue (IFRS 15) | Similar to ASC 606 | Essentially converged |
| Leases (IFRS 16) | Two types (operating/finance) | One model (all leases on BS) |

### IFRS Framework
Qualitative characteristics: Relevance, Faithful representation (complete, neutral, free from error).
Enhancing: Comparability, Verifiability, Timeliness, Understandability.

## Financial Statements

### Balance Sheet (Statement of Financial Position)
Assets = Liabilities + Equity
**Current assets:** Cash, receivables, inventory, prepaid expenses.
**Non-current:** PP&E, intangibles, long-term investments.
**Current liabilities:** Payables, accrued liabilities, current portion of LT debt, deferred revenue.
**Non-current:** Long-term debt, deferred tax liabilities, lease liabilities.
**Equity:** Common stock + APIC + Retained earnings - Treasury stock + AOCI.

### Income Statement (P&L)
Revenue → Gross Profit → Operating Income (EBIT) → EBT → Net Income.
**EPS:** Basic = NI / weighted avg shares. Diluted includes options, warrants, convertibles.

### Statement of Cash Flows
**Operating:** Net income adjusted for non-cash + working capital changes.
**Investing:** Capital expenditures, acquisitions, investment securities.
**Financing:** Debt issuance/repayment, equity issuance, dividends, treasury stock.
Free Cash Flow = Operating CF - Capex.

### Statement of Changes in Equity
Opening balance → net income → OCI → dividends → share issuance/repurchase → closing.
`
},

{
slug: "larry-auditing-techniques",
title: "Larry: Auditing Techniques, Standards, and Procedures",
tags: ["larry","auditing","audit-techniques","pcaob","gaas","standards"],
body: `# Auditing Techniques and Standards

## Auditing Standards

### GAAS (Generally Accepted Auditing Standards — US)
**General Standards:** Adequate technical training and proficiency; independence; due professional care.
**Field Work Standards:** Adequate planning and supervision; understanding of internal control; sufficient appropriate evidence.
**Reporting Standards:** States whether FS prepared in accordance with GAAP; inconsistencies disclosed; adequacy of disclosures; opinion or basis for withholding.

### PCAOB Standards (Public Companies — US)
AS 2201: Audit of Internal Control over Financial Reporting (ICFR). Integrated audit.
AS 2315: Audit Sampling.
AS 2501: Audit of Group Financial Statements.
AS 3101: Auditor's Report.

### ISA (International Standards on Auditing — IAASB)
ISA 315: Risk assessment. ISA 330: Response to assessed risks. ISA 700: Forming opinion.
Used globally outside US public companies.

## Risk-Based Audit Approach

### Audit Risk Model
Audit Risk = Inherent Risk × Control Risk × Detection Risk
**Inherent risk:** Risk of material misstatement assuming no controls.
High IR factors: complex transactions, estimates, related-party transactions, high-value assets, industry volatility.
**Control risk:** Risk controls won't prevent or detect misstatement.
**Detection risk:** Risk auditor's procedures won't detect remaining misstatement.
Auditor controls DR: vary extent, timing, nature of procedures.

### Risk Assessment Procedures
- Inquiries of management and others
- Analytical procedures (compare to prior periods, industry, expectations)
- Observation and inspection (of processes and documents)
- Understand entity and its environment: industry, regulatory, business model, objectives, financial performance

### Significant Risks
Require special audit consideration. Examples: fraud risk, significant estimates (goodwill impairment, loan loss reserves), revenue recognition judgments.
For each significant risk: design specific substantive procedures.

## Audit Evidence

### Types of Evidence
**Sufficient:** Enough of it (quantity). **Appropriate:** Relevant and reliable (quality).
**Reliability hierarchy (most to least):**
1. External confirmation received directly from 3rd party
2. External documents (bank statements, invoices from vendors)
3. Auditor's own observation
4. Internal documents (tested controls effective)
5. Inquiry and management representations (least reliable alone)

### Evidence-Gathering Techniques
**Inspection:** Review of records, documents, physical assets.
**Observation:** Watch a process being performed (e.g., inventory count).
**Confirmation:** External confirmation of account balance, terms (bank confirmation, AR confirmation).
**Recalculation:** Check mathematical accuracy.
**Reperformance:** Independently execute control or procedure.
**Analytical procedures:** Compare relationships between financial/non-financial data; identify unexpected variations.
**Inquiry:** Formal/informal questioning of knowledgeable persons.

## Sampling

### Statistical Sampling
**Attribute sampling (controls testing):**
- Define deviation (control failure)
- Determine sample size based on tolerable deviation rate, expected deviation rate, risk of over-reliance
- Extrapolate: if sample deviation rate > tolerable → control unreliable

**Variables sampling (substantive testing):**
- Mean-per-unit: estimate population value from sample mean × population size
- Difference estimation: estimate total difference from sample differences
- PPS (Probability Proportional to Size): larger items more likely selected; efficient for overstatement testing

### Non-Statistical Sampling
Judgment-based; must still document rationale. Auditor selects based on risk, coverage, professional judgment.

## Common Audit Procedures by Area

### Cash
Confirm balances with banks. Reconcile bank statements. Review subsequent clearances. Inspect petty cash. Test cash cutoff.

### Accounts Receivable
Confirm balances with customers (positive confirmation = customer must respond; negative = respond only if disagree). Analyze aging. Test subsequent collections. Assess allowance adequacy.

### Inventory
Observe physical count. Test client's count procedures. Price testing (compare to invoices, standard cost). Lower of cost or net realizable value assessment. Cutoff testing.

### Revenue
Completeness (all earned revenue recorded) and occurrence (recorded revenue actually earned).
Test with shipping documents, customer contracts. Cutoff testing. Deferred revenue analysis.

### Payroll
Test hiring/termination authorizations. Reperform payroll calculation for sample employees. Reconcile to W-2s and payroll tax returns. Confirm with employees if fraud risk.
`
},

{
slug: "larry-internal-controls",
title: "Larry: Internal Controls — COSO Framework and Assessment",
tags: ["larry","auditing","internal-controls","coso","sox","icfr"],
body: `# Internal Controls

## COSO Framework (Committee of Sponsoring Organizations)

### Five Components
**1. Control Environment** (Foundation)
- Tone at the top: management commitment to integrity and ethics
- Organizational structure, reporting lines, authority/responsibility
- Commitment to competence and hiring/development
- Board oversight and independence
- Performance measurement, incentives, accountability

**2. Risk Assessment**
- Entity objectives (operations, reporting, compliance)
- Identify risks to achieving objectives
- Assess likelihood and impact
- Consider fraud risk specifically
- Assess change management (changes affecting controls)

**3. Control Activities**
- Policies and procedures that ensure management directives are carried out
- Authorization and approval controls
- Reconciliations
- Physical safeguards
- Segregation of duties
- IT general controls and application controls

**4. Information and Communication**
- Relevant information identified, captured, communicated timely
- Internal communication (up, down, across)
- External communication (regulators, customers, investors)
- IT systems that support control objectives

**5. Monitoring**
- Ongoing monitoring (embedded in operations)
- Separate evaluations (internal audit, management review)
- Report deficiencies; correct timely
- Continuous control monitoring (CCM) with technology

### COSO 17 Principles
Each component has specific principles (17 total). All must be present and functioning for effective ICFR.

## Segregation of Duties
No single person should have complete control over a transaction from initiation to recording.
**Key incompatible duties:**
- Authorization vs. recordkeeping
- Custody of assets vs. recordkeeping
- Authorization vs. custody

**Classic fraud prevention example:** AR clerk should not also receive cash payments (could steal and adjust AR).

**When segregation is impractical (small companies):** Compensating controls — enhanced management review, increased audit procedures.

## IT Controls

### IT General Controls (ITGCs)
- **Access controls:** Who can access systems, data, applications. Least privilege principle. MFA. Access reviews.
- **Change management:** Formal process for application changes. Segregation: developer cannot deploy to production.
- **Operations:** System availability, backup and recovery, capacity management, incident management.
- **Program development:** SDLC controls, testing before deployment.

**If ITGCs are ineffective:** Can't rely on automated application controls → must perform more manual testing.

### Automated Application Controls
Controls performed by system without human intervention:
- Input validation (only valid data formats accepted)
- Completeness checks (all transactions processed)
- Access rights enforced by system
- Automatic calculations and reconciliations
- Interface controls (data transferred between systems accurately)

### Key Reports
Reports produced by IT used by business for control activities. Must test:
- Completeness and accuracy of report logic
- Integrity of underlying data
- Access to modify report parameters

## SOX (Sarbanes-Oxley Act — Section 302 and 404)

### Section 302
CEO and CFO certify accuracy of financial statements, effectiveness of disclosure controls.
Quarterly and annual. Criminal liability for false certifications.

### Section 404
**Management assessment:** Annual report on ICFR effectiveness. Identify material weaknesses.
**Auditor attestation (accelerated filers):** Auditor independently opines on ICFR.
**Material weakness:** Significant deficiency with more than remote possibility of material misstatement.
**Significant deficiency:** Less severe than material weakness; still requires communication to audit committee.
**Control deficiency:** Control missing or not operating; does not rise to significant deficiency level.

## Fraud Triangle (Cressey)
**Pressure/Motivation:** Financial pressure (debt, lifestyle, bonuses tied to results).
**Opportunity:** Weak controls, lack of oversight, system access.
**Rationalization:** "I'll pay it back," "Everyone does it," "I deserve it."

**Fraud indicators (red flags):**
- Unusual journal entries (round numbers, large amounts, unusual timing, non-standard accounts)
- Management override of controls
- Related party transactions at non-market terms
- Pressure to meet earnings expectations
- High employee turnover in accounting
- Complex organizational structures without business purpose
- Reluctance to provide information or unusual explanations
`
},

{
slug: "larry-regulatory-compliance",
title: "Larry: Regulatory Compliance and Professional Standards",
tags: ["larry","auditing","regulatory-compliance","sec","aicpa","ethics"],
body: `# Regulatory Compliance and Professional Standards

## SEC Regulations (US Public Companies)

### Periodic Reporting
- **10-K:** Annual report; audited financial statements; MD&A; risk factors; certifications.
- **10-Q:** Quarterly report; unaudited (reviewed) financials; updates to risk factors.
- **8-K:** Current report for material events (earnings, acquisitions, CFO changes, etc.) — within 4 business days.
- **Proxy (DEF 14A):** Annual meeting information; executive compensation; director independence.

### Regulation S-X
Prescribes form and content of financial statements filed with SEC.

### Regulation FD (Fair Disclosure)
Prohibits selective disclosure of material nonpublic information to certain investors without simultaneous public disclosure.

### SEC Enforcement
SEC can: seek injunctions, disgorgement, civil penalties, officer bars, criminal referral to DOJ.
PCAOB: inspects registered audit firms; disciplinary proceedings; censures, fines, bars.

## AICPA Professional Standards

### Code of Professional Conduct
**Principles:**
1. Responsibilities: exercise sensitive professional and moral judgment
2. Public interest: act in a manner that serves public interest
3. Integrity: maintain absolute honesty and truthfulness
4. Objectivity and independence: free from conflicts of interest
5. Due care: continual improvement of competency
6. Scope and nature: nature of services consistent with professional role

### Independence
Independence in fact: actually independent (mindset).
Independence in appearance: reasonable observer would conclude CPA is independent.
**Threats to independence:**
- Self-interest (financial interest in client)
- Self-review (reviewing own work)
- Advocacy (representing client in dispute)
- Familiarity (close relationship with client personnel)
- Intimidation (pressure from client)

**Safeguards:** Rotate engagement partners (public companies: 5 years), cooling-off periods, second-partner review, quality control procedures.

**Prohibited non-audit services (public companies):** Bookkeeping, financial information system design, appraisal, actuarial, internal audit outsourcing, management functions, legal services, investment advisory, expert services for litigation.

## Anti-Money Laundering (AML)

### Bank Secrecy Act (BSA) Requirements
- **CTR (Currency Transaction Report):** Transactions > $10,000 in cash.
- **SAR (Suspicious Activity Report):** File within 30 days of discovering suspicious activity. Do not inform subject of SAR ("tipping off" prohibition).
- **Customer Due Diligence (CDD):** Verify customer identity; understand nature of business; ongoing monitoring.
- **Beneficial ownership:** Identify individuals owning >25% of legal entity customers.

### Three Money Laundering Stages
1. **Placement:** Introducing illicit funds into financial system
2. **Layering:** Complex series of transactions to disguise origin
3. **Integration:** Funds reenter economy appearing legitimate

## Tax Compliance Obligations

### Federal (IRS)
- Corporate: Form 1120 (annual). Estimated payments quarterly.
- S-Corps: Form 1120-S. Pass-through income to shareholders.
- Payroll: Form 941 (quarterly), Form 940 (annual FUTA), W-2s.
- 1099s: Non-employee compensation >$600.

### Transfer Pricing
Related-party transactions must be priced at arm's length.
Section 482: IRS can reallocate income between related entities.
**BEPS (OECD):** Global minimum tax (Pillar Two: 15% minimum effective rate); country-by-country reporting.

### State and Local Tax (SALT)
Nexus: connection sufficient to create tax obligation. Economic nexus post-Wayfair: sales threshold (usually $100K or 200 transactions) without physical presence.
Sales tax: destination-based in most states. Varies by product category.

## Professional Skepticism (Larry's Superpower)
**Definition:** An attitude that includes a questioning mind; critical assessment of audit evidence; alert to conditions indicating possible misstatement.

**Skeptical behaviors:**
- Challenge management explanations with evidence, not just acceptance
- Ask "How do we know this is correct?" not "Can we prove this is wrong?"
- Consider alternative explanations for observed phenomena
- Seek corroborating evidence, not just confirming evidence
- Document the journey, not just the conclusion
- Escalate when management is evasive, inconsistent, or pressures auditor

**Skepticism traps to avoid:**
- Over-reliance on inquiry alone
- Treating management representations as sufficient evidence
- Confirmation bias (seeking evidence that supports existing conclusion)
- Trust without verification for related-party transactions
- Accepting unreasonably convenient explanations for anomalies

**Fraud-specific skepticism:**
- Treat all significant estimates as potential manipulation areas
- Scrutinize journal entries, especially late-period, manual, or management-directed
- Consider management incentives (bonus plans, debt covenants, stock price pressure)
- Don't let good relationships cloud judgment
`
},

{
slug: "larry-data-analytics-audit",
title: "Larry: Data Analytics and Technology in Auditing",
tags: ["larry","auditing","data-analytics","audit-technology","caat","ai-audit"],
body: `# Data Analytics and Technology in Auditing

## Computer-Assisted Audit Techniques (CAATs)

### Why Data Analytics in Audit?
- Test 100% of transactions instead of samples
- Identify anomalies human review would miss
- Reduce time on routine procedures; focus on judgment
- Continuous auditing instead of point-in-time
- Visualize patterns across large datasets

### Core Analytics Tools
**ACL (Audit Command Language) / Galvanize:** Purpose-built; data extraction, manipulation, analysis. Statistical functions, gap detection, duplicate detection.
**IDEA (Interactive Data Extraction and Analysis):** Similar to ACL; widely used.
**Excel / Power Query:** Accessible; for moderate data volumes.
**Python (Pandas, NumPy):** Scalable; flexible; open-source. Industry trending here.
**SQL:** Essential for database querying; join transaction data.
**Power BI / Tableau:** Visualization; identify patterns; dashboards for ongoing monitoring.

### Common Audit Analytics Procedures

**Completeness testing:**
- Sequence analysis: identify gaps in transaction sequences (missing check numbers, invoice numbers)
- Date analysis: identify transactions outside expected periods (weekends, holidays, after cutoff)

**Accuracy/Valuation:**
- Recalculate computed fields (invoice amount = qty × price)
- Compare to authorized price lists
- Benford's Law analysis: first-digit distribution of amounts should follow logarithmic distribution. Deviation → investigate.

**Occurrence/Existence:**
- Three-way match: purchase order ↔ receiving report ↔ vendor invoice
- Reconcile subledger to GL total
- Identify transactions without required supporting documents

**Fraud-Focused:**
- Duplicate payments (same vendor + amount + date range)
- Round number analysis (large round amounts may indicate estimates/estimates)
- Employees matching vendors (same address, bank account)
- After-hours journal entries
- Accounts payable to employee bank accounts
- Vendors added just before large payments

### Benford's Law in Practice
Expected first-digit distribution: 1→30.1%, 2→17.6%, 3→12.5%, 4→9.7%, 5→7.9%, 6→6.7%, 7→5.8%, 8→5.1%, 9→4.6%.
Chi-square test or Z-score test for each digit.
High 4s: possible limit inflation (just under $5,000 approval threshold).
High 9s: similar threshold manipulation.

## AI and Machine Learning in Audit

### Current Applications
- **Anomaly detection:** Flag unusual transactions for auditor review
- **Risk scoring:** Predict which accounts/transactions have highest risk
- **Document analysis:** Extract data from unstructured sources (contracts, invoices); NLP
- **Continuous monitoring:** Real-time alerting on control failures
- **Audit analytics:** Automated ratio analysis; trend detection

### EY, Deloitte, KPMG, PwC AI Tools
All Big 4 have proprietary analytics platforms (Helix, Argus, KPMG Clara, Aura).
Common features: data ingestion from client ERP (SAP, Oracle, NetSuite), automated testing scripts, exception flagging, risk heatmaps.

### Working with Client Data

**Data governance for audit:**
- Confirm data integrity: reconcile extract to client's own reports
- Understand data dictionary: field definitions, codes, relationships
- Test for completeness: total record count, date ranges, transaction types
- Document data lineage: where did this data come from? Who provided it?

**Data quality issues:**
- Missing values in key fields
- Inconsistent coding (customer #: "001", "1", "CUST001")
- Duplicate records
- Records outside expected date ranges
- Negative quantities where impossible

### Cybersecurity Audit Considerations
Assess cybersecurity controls as part of IT audit:
- Access controls: who can access what (least privilege, MFA, access reviews)
- Vulnerability management: patch frequency, penetration testing
- Incident response: documented plan, tested, recent incidents
- Data encryption: at rest and in transit
- Vendor/third-party risk: SOC 2 reports for key vendors

### SOC Reports (Service Organization Controls)
SOC 1 (SSAE 18): Controls relevant to user entities' financial reporting. Used by auditors.
SOC 2: Security, Availability, Processing Integrity, Confidentiality, Privacy trust service criteria.
SOC 3: Same as SOC 2 but public-facing (no detailed testing).
Type I: Point-in-time — design only. Type II: Period (6-12 months) — operating effectiveness.
Larry should obtain SOC reports for all significant third-party service providers.
`
},

{
slug: "larry-professional-ethics",
title: "Larry: Professional Skepticism, Ethics, and Communication",
tags: ["larry","auditing","ethics","professional-skepticism","communication","critical-thinking"],
body: `# Professional Skepticism, Ethics, and Communication

## Critical Thinking Framework for Auditors

### The RED Model (Recognize, Evaluate, Draw)
1. **Recognize** the argument, evidence, or assumption
2. **Evaluate** the quality, relevance, and sufficiency of evidence
3. **Draw** a conclusion based on evaluation, not assumption

### Socratic Questioning in Audit
Don't accept first answer. Follow-up systematically:
- "Can you walk me through how this was calculated?"
- "What assumptions underlie this estimate?"
- "How does this compare to last year? What changed?"
- "Who reviewed and approved this?"
- "Is there documentation I can see?"
- "Are there alternative explanations?"

### Red Flags for Critical Thinking
- Explanations that are complex without reason
- Management can't answer basic questions about their own transactions
- Documentation provided only after repeated requests
- Responses that shift over time or between personnel
- Unusual urgency to close an audit issue quickly
- Key personnel unavailable or unwilling to meet
- Pressure to accept management's position without evidence

## Professional Skepticism in Practice

### The Expectation Gap
Public expects auditors to detect all fraud. Reality: audit provides reasonable (not absolute) assurance. Material misstatements (not all misstatements). Not designed to detect all fraud.
Larry must communicate limitations clearly and proactively.

### Inquiry Is Not Enough
PCAOB AS 1105: Inquiry alone not sufficient evidence. Always corroborate with documents, observation, or recalculation.
Management will rarely admit fraud; they will explain it away.
Test the explanation, not just the explanation's reasonableness.

### Escalation Protocol
When to escalate: disagreement with management on material issue; management refuses to provide information; discovery of potential fraud; management overrides control.
Escalate to: engagement partner → audit committee → in extreme cases, regulatory reporting (SOX Section 10A for illegal acts).
**Never allow time pressure to prevent proper escalation.**

## Ethics in Practice

### Independence Threats — Larry's Checklist
Before each engagement:
- [ ] Do I or my firm have any financial interest in the client?
- [ ] Do I have any family members employed by the client?
- [ ] Have I been offered gifts or hospitality exceeding nominal value?
- [ ] Am I being asked to audit my own prior work?
- [ ] Is there any personal relationship that could impair objectivity?
- [ ] Is the client threatening to dismiss the firm if we don't agree?

### Ethical Decision Framework
1. What are the facts?
2. Who are the stakeholders?
3. What are the options?
4. What are the ethical implications of each option?
5. What would a reasonable, prudent professional do?
6. What is my decision and how do I document it?

### Confidentiality
Client information confidential. Exceptions:
- Legal/professional duty to disclose (court order, regulatory requirement)
- Client permission
- Required by professional standards

Never use client information for personal gain or disclose to third parties without permission.

## Communication Skills for Auditors

### Audit Committee Communication
Required communications (AS 1301):
- Auditor's responsibilities
- Planned scope and timing of audit
- Material weaknesses and significant deficiencies in ICFR
- Uncorrected misstatements (summary schedule)
- Management judgments and estimates
- Difficult or contentious matters
- Going concern issues

Tone: professional, factual, clear. Never adversarial. Audit committee is auditor's primary client.

### Written Communication
**Finding format:**
- **Condition:** What is the current situation?
- **Criteria:** What should it be? (policy, GAAP, regulation)
- **Cause:** Why does the gap exist?
- **Effect:** What is the impact or risk?
- **Recommendation:** How should management address it?

Always lead with the most important point. Use plain language — avoid jargon with non-accountant audiences. Document every conclusion with specific evidence references.

### Audit Reports — Opinion Types
**Unmodified (clean) opinion:** Financial statements present fairly in all material respects.
**Modified opinions:**
- **Qualified:** "Except for" specific matter; scope limitation or disagreement; material but not pervasive
- **Adverse:** Financial statements do NOT present fairly; disagreement pervasive
- **Disclaimer of opinion:** Unable to obtain sufficient appropriate evidence; cannot express opinion; scope limitation pervasive

**Emphasis of matter:** Important matter properly disclosed in FS (going concern, material uncertainty, significant related-party transactions).
**Other matter:** Relevant but not disclosed in FS.

## Continuous Learning (Larry's Commitment)
CPE requirements: 40 hours/year minimum (AICPA); 80 hours/2-year period.
Specialized: accounting standards updates (ASU), auditing standards, new PCAOB releases, SEC guidance.
Emerging areas: crypto asset auditing, ESG assurance, AI systems auditing, cybersecurity risk.
Read: PCAOB release, SEC comment letters, AICPA Professional Issues Updates, Journal of Accountancy.
`
},

];

// ─── Runner ──────────────────────────────────────────────────────────────────
async function seed() {
  console.log(`Seeding ${DOCS.length} documents...`);
  let created = 0, updated = 0;

  for (const doc of DOCS) {
    const tagIds: string[] = [];
    for (const tagName of doc.tags) {
      const tag = await prisma.kbTag.upsert({
        where: { tenantId_name: { tenantId: TENANT_ID, name: tagName } },
        create: { tenantId: TENANT_ID, name: tagName },
        update: {},
      });
      tagIds.push(tag.id);
    }
    const existing = await prisma.kbDocument.findFirst({ where: { tenantId: TENANT_ID, slug: doc.slug } });
    if (existing) {
      await prisma.kbDocument.update({
        where: { id: existing.id },
        data: { title: doc.title, body: doc.body, status: KbDocumentStatus.published, updatedBy: CREATED_BY, tags: { deleteMany: {}, create: tagIds.map(t => ({ tagId: t })) } },
      });
      updated++;
    } else {
      await prisma.kbDocument.create({
        data: { tenantId: TENANT_ID, title: doc.title, slug: doc.slug, body: doc.body, status: KbDocumentStatus.published, createdBy: CREATED_BY, updatedBy: CREATED_BY, tags: { create: tagIds.map(t => ({ tagId: t })) } },
      });
      created++;
    }
    process.stdout.write(`  ${existing ? "updated" : "created"}: ${doc.slug}\n`);
  }

  console.log(`\nDone. Created: ${created}, Updated: ${updated}, Total: ${DOCS.length}`);
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
