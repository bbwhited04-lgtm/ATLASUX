/**
 * PhD-level AI/ML/CS knowledge seed — Carnegie Mellon / MIT caliber
 * Run: npx tsx src/scripts/seedPhD.ts
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
// PhD IN ARTIFICIAL INTELLIGENCE
// ══════════════════════════════════════════════════════
{
slug: "ai-phd-search-reasoning",
title: "AI: Search, Reasoning, and Knowledge Representation",
tags: ["artificial-intelligence","phd-ai","search","reasoning","knowledge-representation"],
body: `# Search, Reasoning, and Knowledge Representation

## Uninformed Search
Systematic exploration of state space without domain knowledge.

### Breadth-First Search (BFS)
- Complete: yes (finds shallowest goal)
- Optimal: yes (uniform cost)
- Time: O(b^d), Space: O(b^d) — space is the killer
- b = branching factor, d = depth of shallowest solution

### Depth-First Search (DFS)
- Complete: no (infinite paths)
- Optimal: no
- Time: O(b^m), Space: O(bm) — space advantage
- Iterative deepening DFS (IDDFS) combines DFS space + BFS optimality

### Uniform Cost Search (UCS)
- Expands node with lowest cumulative path cost g(n)
- Complete and optimal when step costs > 0
- Equivalent to BFS when all costs equal

## Informed (Heuristic) Search

### A* Search
f(n) = g(n) + h(n)
- g(n): cost from start to n
- h(n): estimated cost from n to goal (heuristic)
- Optimal if h is **admissible**: h(n) ≤ h*(n) (never overestimates)
- Consistent (monotone): h(n) ≤ c(n,a,n') + h(n') — guarantees no re-expansion

**Completeness:** Yes (finite space, positive costs)
**Optimality:** Yes (admissible heuristic)
**Complexity:** Exponential in worst case; heuristic quality determines practical performance

**Dominant heuristics:** h1 dominates h2 if h1(n) ≥ h2(n) for all n. Prefer dominant heuristics.

### IDA* (Iterative Deepening A*)
- DFS with f-cost threshold; increases threshold each iteration
- Linear space O(d), same optimality as A*
- Preferred when memory is constrained

### Monte Carlo Tree Search (MCTS)
Used in games (AlphaGo, AlphaZero). Four phases per iteration:
1. **Selection:** UCB1 = X̄_i + C√(ln N / n_i) balances exploitation/exploration
2. **Expansion:** Add new node to tree
3. **Simulation:** Random rollout to terminal state
4. **Backpropagation:** Update statistics up the tree

UCB1 constant C controls exploration. C = √2 for standard UCT.

## Constraint Satisfaction Problems (CSPs)
Variables X, Domains D, Constraints C.

### Backtracking Search
- **MRV (Minimum Remaining Values):** Choose variable with fewest legal values
- **Degree heuristic:** Tie-break by most constraints on remaining variables
- **LCV (Least Constraining Value):** Choose value ruling out fewest choices for neighbors
- **Forward checking:** Track remaining legal values; terminate early on empty domain
- **Arc Consistency (AC-3):** Propagate constraints; O(ed³) time

### Local Search for CSPs
- **Min-conflicts heuristic:** Choose value violating fewest constraints
- Used in N-queens (solves million queens in seconds)

## Knowledge Representation

### Propositional Logic
- Syntax: atoms, ¬, ∧, ∨, →, ↔
- Semantics: truth assignments
- Inference: resolution, DPLL, WalkSAT
- Complete for propositional KB

### First-Order Logic (FOL)
Extends propositional with quantifiers and functions.
- ∀x P(x), ∃x P(x)
- Unification: find substitution making expressions identical
- Resolution: clausal form + unification → completeness
- Semi-decidable: can prove entailment, cannot always prove non-entailment

### Ontologies
- OWL (Web Ontology Language): description logic basis
- Classes, properties, individuals, axioms
- Reasoning: subsumption, instance checking, consistency

## Bayesian Networks
DAG where nodes = random variables, edges = conditional dependencies.
- Joint: P(X1,...,Xn) = ∏ P(Xi | Parents(Xi))
- **D-separation:** test conditional independence from graph structure
- Inference: variable elimination, belief propagation
- Learning: structure learning (score-based, constraint-based), parameter learning (MLE, Bayesian)

## Planning
Classical planning: initial state, goal state, actions (preconditions + effects).
- **STRIPS:** Add/delete lists for effects
- **PDDL:** Planning Domain Definition Language — standard notation
- **GraphPlan:** Builds planning graph; extracts plan via backward search
- **SATPlan:** Encode planning as SAT problem
- Partial-order planning: allows parallel actions; less commitment
`
},

{
slug: "ai-phd-multiagent-systems",
title: "AI: Multi-Agent Systems and Game Theory",
tags: ["artificial-intelligence","phd-ai","multi-agent","game-theory"],
body: `# Multi-Agent Systems and Game Theory

## Agent Architectures

### Reactive Agents
Simple condition-action rules. No internal state, no planning. Brooks' subsumption architecture. Fast but limited.

### BDI Agents (Belief-Desire-Intention)
- **Beliefs:** Agent's model of world
- **Desires:** Goals/objectives
- **Intentions:** Committed plans
- PRS (Procedural Reasoning System), AgentSpeak(L) / Jason

### Utility-Based Agents
Maximize expected utility. Requires utility function U(s) over states. Rational agent: argmax_a Σ P(s'|s,a)U(s').

## Game Theory Foundations

### Normal Form Games
Matrix of payoffs for each combination of strategies.
Prisoner's Dilemma, Battle of the Sexes, Matching Pennies.

### Nash Equilibrium
Profile σ* where no agent can improve payoff by unilateral deviation.
- **Pure strategy NE:** May not exist
- **Mixed strategy NE:** Always exists (Nash 1950)
- Computing NE: support enumeration, Lemke-Howson, linear complementarity

### Dominant Strategies
- Strictly dominant: better than all others regardless of opponents
- Iterated elimination of strictly dominated strategies (IESDS): reduces game

### Pareto Optimality
Outcome where no agent can improve without harming another. NE ≠ Pareto optimal in general (Prisoner's Dilemma).

## Mechanism Design (Reverse Game Theory)
Design game rules to achieve desired outcome from self-interested agents.

### Vickrey-Clarke-Groves (VCG) Mechanism
- Agents report valuations (possibly false)
- VCG: truthful reporting is dominant strategy (incentive compatible)
- Social welfare maximizing
- Combinatorial auctions: allocate bundles of goods

### Revelation Principle
Any outcome achievable by any mechanism is achievable by a direct truthful mechanism.

## Cooperative Game Theory

### Characteristic Function Form
v(S) = value coalition S can achieve alone. Superadditive if v(S∪T) ≥ v(S)+v(T).

### Shapley Value
Fair attribution of coalition value to individuals:
φ_i(v) = Σ_{S⊆N\{i}} [|S|!(|N|-|S|-1)!/|N|!] [v(S∪{i}) - v(S)]
Properties: Efficiency, Symmetry, Dummy, Additivity.
Used in SHAP (AI explainability).

### Core
Set of allocations where no coalition prefers to deviate. May be empty.

## Multi-Agent Reinforcement Learning (MARL)
- **Cooperative MARL:** Agents share reward; coordination problem
- **Competitive MARL:** Zero-sum; minimax Q-learning
- **Mixed:** General-sum games
- Challenges: non-stationarity (each agent's policy changes others' environment), credit assignment, scalability
- Algorithms: MADDPG, QMIX, MAPPO, VDN

## Agent Communication Languages
- **KQML/FIPA ACL:** Speech act theory-based messaging
- Performatives: inform, request, query-if, propose, agree, refuse
- Ontology-grounded content

## Social Choice Theory
Aggregating individual preferences into collective decisions.
- **Arrow's Impossibility Theorem:** No voting rule satisfies unanimity, independence of irrelevant alternatives, and non-dictatorship simultaneously (for 3+ alternatives)
- **Condorcet winner:** Beats every other option in pairwise comparison; may not exist (Condorcet paradox)
- Borda count, plurality, instant-runoff, approval voting — each violates some desirable property
`
},

{
slug: "ai-phd-safety-alignment",
title: "AI Safety, Alignment, and Ethics",
tags: ["artificial-intelligence","phd-ai","ai-safety","alignment","ethics"],
body: `# AI Safety, Alignment, and Ethics

## The Alignment Problem
How to ensure AI systems pursue goals intended by designers, not proxy goals or unintended objectives.

### Goodhart's Law
"When a measure becomes a target, it ceases to be a good measure." AI optimizing a proxy for the true objective diverges from human intent at scale.

### Specification Problems
- **Reward hacking:** Find unintended ways to maximize reward (boat racing game: agent spins in circles catching boost items instead of racing)
- **Reward misspecification:** Reward function doesn't capture true objective
- **Side effects:** Optimization causes unintended environmental changes
- **Safe interruptibility:** Agent should not resist shutdown (off-switch problem — Hadfield-Menell et al.)

## Technical Alignment Approaches

### Inverse Reinforcement Learning (IRL)
Learn reward function from observed human behavior.
- Assume human demonstrates optimal/near-optimal behavior
- Recover R* such that observed behavior is optimal under R*
- **Maximum entropy IRL:** P(τ) ∝ exp(R(τ)) — probabilistic interpretation
- **Limitation:** Ambiguity (many rewards explain same behavior); humans are suboptimal

### RLHF (Reinforcement Learning from Human Feedback)
1. Pre-train LLM on large corpus
2. Collect human preference data (A vs B comparisons)
3. Train reward model R_θ on preferences (Bradley-Terry model)
4. Fine-tune LLM with PPO to maximize R_θ
Used in: InstructGPT, ChatGPT, Claude

**Challenges:** Reward model overoptimization (Goodhart), labeler inconsistency, cost of human feedback

### Constitutional AI (Anthropic)
- AI critiques its own outputs against a set of principles (constitution)
- Self-revision without human labeling for every example
- CAI pipeline: supervised learning on revised outputs + RLHF with AI feedback (RLAIF)

### Debate (Irving et al., OpenAI)
Two AI agents debate; human judges winner. Honest agent should win if human can verify short arguments. Scalable oversight for superhuman AI.

### Amplification
Recursively amplify human judgment using AI assistance. Iterated distillation and amplification (IDA).

## Robustness and Distribution Shift

### Adversarial Examples
Small perturbations to input causing model misclassification.
- FGSM: x_adv = x + ε·sign(∇_x L(θ,x,y))
- PGD (Projected Gradient Descent): iterated FGSM — stronger attack
- Adversarial training: include adversarial examples in training
- Certified defenses: randomized smoothing, interval bound propagation

### Distribution Shift
Train distribution ≠ test distribution.
- **Covariate shift:** P(X) changes, P(Y|X) stable — reweighting methods
- **Concept drift:** P(Y|X) changes — online learning, periodic retraining
- **Out-of-distribution detection:** Confidence calibration, energy-based models, density estimation

## Interpretability
- **Mechanistic interpretability:** Reverse-engineer internal computations (circuits in transformers)
- **Superposition hypothesis:** Neurons represent multiple features simultaneously
- **Induction heads:** Attention heads implementing in-context learning

## AI Governance Frameworks
- **EU AI Act:** Risk-based regulation; prohibited uses, high-risk systems require conformity assessment
- **NIST AI RMF:** Map, Measure, Manage, Govern — voluntary framework
- **Responsible scaling policies:** Anthropic RSP, OpenAI Preparedness Framework — capability thresholds triggering safety evaluations
- Model cards (Mitchell et al.): Structured documentation of model capabilities, limitations, intended use
- Datasheets for datasets (Gebru et al.): Provenance, composition, collection process documentation
`
},

// ══════════════════════════════════════════════════════
// PhD IN MACHINE LEARNING
// ══════════════════════════════════════════════════════
{
slug: "ml-phd-statistical-learning-theory",
title: "ML: Statistical Learning Theory",
tags: ["machine-learning","phd-ml","learning-theory","generalization","pac-learning"],
body: `# Statistical Learning Theory

## PAC Learning Framework
Probably Approximately Correct (Valiant, 1984).
Given:
- Concept class C, hypothesis class H
- Distribution D over X, target concept c ∈ C
- ε (error), δ (failure probability)

**PAC learnable:** Algorithm A outputs h with P[err(h) > ε] < δ in poly(1/ε, 1/δ, n, size(c)) samples.

**Sample complexity:** m ≥ (1/ε)(ln|H| + ln(1/δ)) for finite H

## VC Dimension
Vapnik-Chervonenkis dimension: largest set H can shatter.
- Shattering: for every labeling, some h ∈ H achieves it
- VC(halfplanes in R²) = 3
- VC(d-dimensional hyperplanes) = d+1
- VC(neural nets): O(W log W) where W = number of parameters — but loose bound

**Fundamental Theorem of Statistical Learning:**
H is PAC learnable ⟺ VCdim(H) is finite.

**Sample complexity:** m = O((d + log(1/δ))/ε²) where d = VCdim(H) [agnostic]

## Bias-Variance Decomposition
For squared loss:
E[(y - ĥ(x))²] = Bias²(ĥ(x)) + Var(ĥ(x)) + σ²_noise

- **Bias:** Error from wrong assumptions in learning algorithm
- **Variance:** Sensitivity to fluctuations in training set
- **Irreducible noise:** σ²_noise — cannot be eliminated

Bias-variance tradeoff: complex models → low bias, high variance; simple models → high bias, low variance.

**Double descent:** Modern overparameterized models (width >> n) show second descent in test error beyond interpolation threshold. Classical theory breaks down.

## Rademacher Complexity
R_n(H) = E_σ[sup_{h∈H} (1/n)Σ σ_i h(x_i)]
σ_i ∈ {±1} uniformly — measures correlation of H with random noise.

**Generalization bound:**
err(h) ≤ err_train(h) + 2R_n(H) + √(log(2/δ)/2n)

Tighter than VC theory for deep networks.

## Regularization Theory

### Tikhonov Regularization (L2 / Ridge)
min L(h) + λ||w||²₂
- Bayesian interpretation: Gaussian prior on w
- Reduces variance at cost of bias
- Closed form: w* = (X^TX + λI)^{-1} X^Ty

### LASSO (L1)
min L(h) + λ||w||₁
- Induces sparsity (many weights → 0)
- No closed form; subgradient methods
- Bayesian: Laplace prior
- Elastic net: λ₁||w||₁ + λ₂||w||²₂ combines both

### Early Stopping
Implicit regularization — equivalent to L2 in convex case.
Monitor validation loss; stop when it stops decreasing.

## Optimization Theory

### Convex Optimization
- f is convex: f(λx+(1-λ)y) ≤ λf(x)+(1-λ)f(y)
- Strongly convex (μ-SC): f(y) ≥ f(x) + ∇f(x)^T(y-x) + (μ/2)||y-x||²
- L-smooth: ||∇f(x) - ∇f(y)|| ≤ L||x-y||

**SGD convergence (convex):** O(1/√T) iterations to ε-optimal
**SGD convergence (strongly convex):** O(log(1/ε)) iterations

### Adam Optimizer
m_t = β₁m_{t-1} + (1-β₁)g_t  (first moment)
v_t = β₂v_{t-1} + (1-β₂)g_t²  (second moment)
m̂_t = m_t/(1-β₁^t), v̂_t = v_t/(1-β₂^t)  (bias correction)
θ_t = θ_{t-1} - α·m̂_t/(√v̂_t + ε)

Default: β₁=0.9, β₂=0.999, ε=1e-8. AdamW decouples weight decay.

### Loss Landscape
- Non-convex in general for deep nets
- **Saddle points:** Gradient = 0, some positive/negative curvature — SGD escapes via noise
- **Sharp vs flat minima:** Flat minima generalize better (Hochreiter & Schmidhuber 1997; sharpness-aware minimization)
- **Neural tangent kernel (NTK):** Infinite-width limit — training becomes convex kernel regression

## Information-Theoretic Bounds
- **MDL (Minimum Description Length):** Best model = shortest description of data + model
- **Mutual information bounds:** I(W;S) limits generalization gap (Russo & Zou)
- **PAC-Bayes:** Generalization via KL divergence between posterior Q and prior P
`
},

{
slug: "ml-phd-deep-learning-architectures",
title: "ML: Deep Learning Architectures",
tags: ["machine-learning","phd-ml","deep-learning","neural-networks","architectures"],
body: `# Deep Learning Architectures

## Foundations

### Universal Approximation
A feedforward network with one hidden layer and sigmoid activations can approximate any continuous function on a compact subset of R^n to arbitrary precision (Cybenko 1989; Hornik 1991).
- Existence proof — says nothing about learnability or required width
- Depth exponentially more efficient than width for certain functions (Telgarsky 2016)

### Backpropagation
Chain rule applied to computation graphs.
∂L/∂w_ij = ∂L/∂a_j · ∂a_j/∂w_ij = δ_j · x_i

Forward pass: compute activations. Backward pass: propagate δ = ∂L/∂a.
Automatic differentiation (autograd): reverse-mode AD for scalars, forward-mode for Jacobians.

### Vanishing/Exploding Gradients
Gradient magnitudes shrink or explode through depth.
- **Solutions:** Residual connections, normalization layers, careful initialization
- **Xavier/Glorot init:** Var(w) = 2/(n_in + n_out)
- **He init (ReLU):** Var(w) = 2/n_in

## Convolutional Neural Networks (CNNs)

### Operation
(f * g)[n] = Σ_k f[k]g[n-k]
In 2D: (I * K)[i,j] = Σ_m Σ_n I[i+m,j+n]K[m,n]

**Properties:** Translation equivariance, parameter sharing, local connectivity.

### Landmark Architectures
- **LeNet (1989):** First practical CNN; digit recognition
- **AlexNet (2012):** ImageNet breakthrough; ReLU, dropout, GPU training
- **VGG (2014):** Very deep (16-19 layers); 3×3 convolutions
- **GoogLeNet/Inception (2014):** Inception modules; parallel convolutions
- **ResNet (2015):** Skip connections: h(x) = F(x) + x; enables 150+ layer training
- **DenseNet (2017):** Dense connections; h_l = H_l([h_0,...,h_{l-1}])
- **EfficientNet (2019):** Compound scaling; NAS-optimized baseline

### Modern Vision
- **Vision Transformer (ViT):** Patch embedding + Transformer; no convolutions; scales better
- **Swin Transformer:** Shifted window attention; local + global via hierarchy
- **ConvNeXt:** ResNet redesigned with Transformer best practices

## Recurrent Neural Networks (RNNs)

### Vanilla RNN
h_t = tanh(W_hh h_{t-1} + W_xh x_t + b_h)
Vanishing gradients make long-range dependencies difficult.

### LSTM (Long Short-Term Memory)
i_t = σ(W_i[h_{t-1},x_t]+b_i)  (input gate)
f_t = σ(W_f[h_{t-1},x_t]+b_f)  (forget gate)
o_t = σ(W_o[h_{t-1},x_t]+b_o)  (output gate)
C_t = f_t⊙C_{t-1} + i_t⊙tanh(W_C[h_{t-1},x_t]+b_C)
h_t = o_t⊙tanh(C_t)

### GRU (Gated Recurrent Unit)
Simplified LSTM: reset gate, update gate. Fewer parameters, comparable performance.

## Normalization Layers
- **Batch Norm:** Normalize over batch dimension; μ_B, σ²_B from minibatch; γ,β learnable. Problematic for small batches and RNNs.
- **Layer Norm:** Normalize over feature dimension; used in Transformers
- **Group Norm:** Normalize over groups of channels; works for batch size 1
- **RMS Norm:** Simplified LayerNorm without mean centering; used in LLaMA

## Attention and Transformers

### Scaled Dot-Product Attention
Attention(Q,K,V) = softmax(QK^T/√d_k)V
- Q=XW_Q, K=XW_K, V=XW_V
- Scaling by √d_k prevents softmax saturation

### Multi-Head Attention
MultiHead(Q,K,V) = Concat(head_1,...,head_h)W_O
Each head_i = Attention(QW_Qi, KW_Ki, VW_Vi)
h heads learn different relationship types simultaneously.

### Positional Encoding
PE(pos,2i) = sin(pos/10000^{2i/d_model})
PE(pos,2i+1) = cos(pos/10000^{2i/d_model})
Allows model to use position information; relative encodings (RoPE, ALiBi) generalize better to unseen lengths.

### Transformer Block
LayerNorm → Multi-Head Self-Attention → Residual
LayerNorm → Feed-Forward (2-layer MLP, 4x width, GELU) → Residual

**Complexity:** O(n²d) in sequence length n — quadratic attention bottleneck. Efficient variants: Linformer O(n), Performer O(n), FlashAttention (IO-aware exact attention).

## Normalization-Free Architectures
- NFNets: Adaptive gradient clipping, no batch norm, SOTA on ImageNet without BN
- Hyena, S4, Mamba: State-space models replacing attention; O(n log n) complexity
`
},

{
slug: "ml-phd-reinforcement-learning",
title: "ML: Reinforcement Learning — Theory and Algorithms",
tags: ["machine-learning","phd-ml","reinforcement-learning","mdp","policy-gradient"],
body: `# Reinforcement Learning

## Markov Decision Process (MDP)
Tuple (S, A, P, R, γ):
- S: state space, A: action space
- P(s'|s,a): transition probability
- R(s,a,s'): reward function
- γ ∈ [0,1): discount factor

**Markov property:** P(s_{t+1}|s_t,a_t,...,s_0,a_0) = P(s_{t+1}|s_t,a_t)

## Value Functions
- **State value:** V^π(s) = E_π[Σ_{t=0}^∞ γ^t R_t | S_0=s]
- **Action value:** Q^π(s,a) = E_π[Σ_{t=0}^∞ γ^t R_t | S_0=s, A_0=a]
- **Advantage:** A^π(s,a) = Q^π(s,a) - V^π(s)

## Bellman Equations
**Bellman expectation:**
V^π(s) = Σ_a π(a|s)[R(s,a) + γ Σ_{s'} P(s'|s,a)V^π(s')]

**Bellman optimality:**
V*(s) = max_a [R(s,a) + γ Σ_{s'} P(s'|s,a)V*(s')]

## Dynamic Programming
Requires known model P, R.

**Policy Evaluation:** Iterative application of Bellman expectation until convergence.
**Policy Improvement:** π'(s) = argmax_a Q^π(s,a)
**Policy Iteration:** Alternate evaluation and improvement → converges to π* in finite MDPs.
**Value Iteration:** Direct Bellman optimality iteration; O(|S|²|A|) per iteration.

## Temporal Difference Learning

### TD(0)
V(S_t) ← V(S_t) + α[R_{t+1} + γV(S_{t+1}) - V(S_t)]
Target = R_{t+1} + γV(S_{t+1}) (bootstrapped — uses estimate, not full return)

### Q-Learning (off-policy)
Q(S_t,A_t) ← Q(S_t,A_t) + α[R_{t+1} + γ max_a Q(S_{t+1},a) - Q(S_t,A_t)]
Converges to Q* regardless of exploration policy.

### SARSA (on-policy)
Q(S_t,A_t) ← Q(S_t,A_t) + α[R_{t+1} + γQ(S_{t+1},A_{t+1}) - Q(S_t,A_t)]

### Eligibility Traces — TD(λ)
Bridges TD(0) and Monte Carlo. λ=0: TD(0), λ=1: Monte Carlo.
e_t(s) = γλe_{t-1}(s) + 1[S_t=s]
Faster learning; credit assigned further back.

## Deep Q-Networks (DQN)
Q(s,a;θ) approximated by neural network.

**Innovations (Mnih et al., 2015):**
- **Experience replay:** Store (s,a,r,s') in buffer; sample minibatches — breaks correlations
- **Target network:** θ⁻ updated slowly — stabilizes training
- Loss: L(θ) = E[(r + γ max_{a'} Q(s',a';θ⁻) - Q(s,a;θ))²]

**Extensions:**
- Double DQN: decouple selection and evaluation — reduces overestimation
- Dueling DQN: Q(s,a;θ) = V(s;θ) + A(s,a;θ) — separate value/advantage streams
- Prioritized experience replay: sample by TD-error magnitude
- Rainbow: all of the above

## Policy Gradient Methods

### REINFORCE (Williams, 1992)
∇J(θ) = E_π[G_t ∇log π(A_t|S_t;θ)]
High variance; reduce with baseline b(s):
∇J(θ) = E_π[(G_t - b(S_t)) ∇log π(A_t|S_t;θ)]

### Actor-Critic
- **Actor:** π(a|s;θ) — policy
- **Critic:** V(s;w) or Q(s,a;w) — value function
- Update actor with advantage A(s,a) = Q(s,a) - V(s)
- A3C: asynchronous parallel actors; A2C: synchronous

### PPO (Proximal Policy Optimization)
L^CLIP(θ) = E[min(r_t(θ)Â_t, clip(r_t(θ), 1-ε, 1+ε)Â_t)]
r_t(θ) = π(a|s;θ)/π(a|s;θ_old)
ε=0.2 typical. Clips large updates — simple, stable, widely used (GPT RLHF).

### SAC (Soft Actor-Critic)
Maximum entropy RL: maximize reward + α·H(π)
Entropy bonus encourages exploration. Off-policy, sample efficient.
State of the art for continuous control.

### TRPO (Trust Region Policy Optimization)
KL(π_old, π_new) ≤ δ constraint. PPO is simpler approximation.

## Model-Based RL
Learn model P̂(s'|s,a), R̂(s,a); plan using it.
- **Dyna-Q:** Combine real experience + model-generated experience
- **World models:** RSSM (Dreamer); latent dynamics model; plan in latent space
- **AlphaZero:** MCTS + learned value/policy network; no handcrafted features

## Exploration
- ε-greedy: random action with probability ε
- UCB (Upper Confidence Bound): a_t = argmax[Q(a) + c√(ln t/n(a))]
- Thompson sampling: sample from posterior over Q
- Curiosity-driven: intrinsic reward from prediction error of next state (ICM)
- Count-based: bonus ∝ 1/√n(s) — pseudo-counts for large state spaces
`
},

{
slug: "ml-phd-unsupervised-learning",
title: "ML: Unsupervised and Self-Supervised Learning",
tags: ["machine-learning","phd-ml","unsupervised","self-supervised","representation-learning"],
body: `# Unsupervised and Self-Supervised Learning

## Clustering

### K-Means
Minimize within-cluster variance: Σ_k Σ_{x∈C_k} ||x - μ_k||²
Lloyd's algorithm: alternate assignment and centroid update.
- O(nkd) per iteration
- Convergence: guaranteed to local minimum (not global)
- K-means++ initialization: probabilistic seeding, O(log k) approximation

### Gaussian Mixture Models (GMM)
P(x) = Σ_k π_k N(x; μ_k, Σ_k)

**EM Algorithm:**
- E-step: r_{nk} = π_k N(x_n;μ_k,Σ_k) / Σ_j π_j N(x_n;μ_j,Σ_j)
- M-step: μ_k = Σ_n r_{nk}x_n / Σ_n r_{nk}; similarly for Σ_k, π_k
- Monotonically increases log-likelihood; converges to local max

### Hierarchical Clustering
- **Agglomerative (bottom-up):** Start with singleton clusters; merge closest
- Linkage: single (min dist), complete (max dist), average, Ward (minimize variance)
- **Divisive (top-down):** Start with one cluster; split

### DBSCAN
Density-based; no need to specify k. ε-neighborhood, min_samples threshold.
- Core point, border point, noise point
- O(n log n) with spatial index
- Finds arbitrary shapes; sensitive to ε

### Spectral Clustering
Graph Laplacian L = D - W; cluster using eigenvectors.
Captures non-convex structure; O(n³) eigendecomposition.

## Dimensionality Reduction

### PCA (Principal Component Analysis)
Find orthogonal directions of maximum variance.
Eigendecomposition of covariance C = (1/n)X^TX.
Top k eigenvectors = principal components.
- Minimizes reconstruction error
- Kernel PCA: nonlinear via kernel trick
- Probabilistic PCA: generative model; handles missing data

### t-SNE (t-Distributed Stochastic Neighbor Embedding)
- High-dim similarities: p_{ij} = (p_{j|i}+p_{i|j})/2n (Gaussian kernel)
- Low-dim similarities: q_{ij} ∝ (1+||y_i-y_j||²)^{-1} (Student t with 1 df — heavy tail prevents crowding)
- Minimize KL(P||Q) via gradient descent
- **Not for new points** (no out-of-sample extension without parametric version)
- Perplexity hyperparameter ≈ expected neighborhood size (5-50)

### UMAP (Uniform Manifold Approximation)
- Topological foundations: fuzzy simplicial sets
- Faster than t-SNE; preserves global structure better
- Has parametric variant; scales to millions of points

### Autoencoders
Encoder f_θ: X → Z, Decoder g_φ: Z → X
L = ||x - g_φ(f_θ(x))||²

**Variants:**
- Sparse AE: L1 penalty on activations
- Denoising AE: reconstruct from corrupted input — learns robust features
- Contractive AE: ||∂f(x)/∂x||²_F penalty — stable to input perturbations

## Self-Supervised Learning

### Contrastive Learning (SimCLR, MoCo)
Learn representations where augmented views of same image are close, different images are far.

SimCLR loss (NT-Xent):
L = -log[exp(sim(z_i,z_j)/τ) / Σ_{k≠i} exp(sim(z_i,z_k)/τ)]

**SimCLR:** Large batches (4096+); MLP projection head; strong augmentations.
**MoCo:** Momentum encoder as key encoder; queue of negatives — works with small batches.

### Non-Contrastive (BYOL, SimSiam)
No negatives needed. Prevent collapse via:
- **BYOL:** EMA (exponential moving average) target network
- **SimSiam:** Stop-gradient on one branch

### Masked Self-Supervised Learning
- **BERT:** Mask 15% of tokens; predict masked. Bidirectional context.
- **MAE (Masked Autoencoder):** Mask 75% of image patches; reconstruct pixels.
  - Only unmasked patches through encoder (efficient)
  - Heavy decoder reconstructs all patches
- **BEiT:** Predict discrete visual tokens (dVAE codebook) instead of pixels

### Pretext Tasks
- Rotation prediction (0°, 90°, 180°, 270°)
- Jigsaw puzzle solving
- Colorization (predict color from grayscale)
- Next frame prediction
- Instance discrimination

## Generative Unsupervised Models
See Generative Models document for VAE, GAN, Diffusion Models.

## Evaluation of Unsupervised Learning
- **Clustering:** NMI, ARI (require ground truth); Silhouette score (internal)
- **Representations:** Linear probing (freeze backbone, train linear classifier)
- **Generative models:** FID, IS, precision/recall for images; perplexity for text
`
},

// ══════════════════════════════════════════════════════
// PhD IN COMPUTER SCIENCE
// ══════════════════════════════════════════════════════
{
slug: "cs-phd-algorithms-complexity",
title: "CS: Algorithms and Computational Complexity",
tags: ["computer-science","phd-cs","algorithms","complexity","theory"],
body: `# Algorithms and Computational Complexity

## Asymptotic Analysis
- O (big-O): upper bound — f(n) = O(g(n)) if ∃c,n₀: f(n) ≤ cg(n) ∀n≥n₀
- Ω (big-Omega): lower bound
- Θ (Theta): tight bound — both O and Ω
- o (little-o): strict upper — lim f/g = 0
- ω (little-omega): strict lower

**Master theorem:** T(n) = aT(n/b) + f(n)
- f(n) = O(n^{log_b a - ε}): T = Θ(n^{log_b a})
- f(n) = Θ(n^{log_b a}): T = Θ(n^{log_b a} log n)
- f(n) = Ω(n^{log_b a + ε}), regularity: T = Θ(f(n))

## Sorting
| Algorithm | Average | Worst | Space | Stable |
|-----------|---------|-------|-------|--------|
| Merge sort | O(n log n) | O(n log n) | O(n) | Yes |
| Quicksort | O(n log n) | O(n²) | O(log n) | No |
| Heapsort | O(n log n) | O(n log n) | O(1) | No |
| Timsort | O(n log n) | O(n log n) | O(n) | Yes |

**Lower bound for comparison sort:** Ω(n log n) — decision tree argument: n! leaves need height ≥ log(n!)

**Linear time sorts (non-comparison):**
- Counting sort: O(n+k) for values in [0,k]
- Radix sort: O(d(n+k)) for d digits
- Bucket sort: O(n) average for uniform distribution

## Graph Algorithms

### Shortest Paths
- **Dijkstra:** O((V+E) log V) with binary heap; non-negative weights
- **Bellman-Ford:** O(VE); handles negative weights; detects negative cycles
- **Floyd-Warshall:** O(V³); all-pairs; DP on intermediate vertices

### Minimum Spanning Tree
- **Prim's:** O(E log V); greedy, grow from single vertex
- **Kruskal's:** O(E log E); sort edges, union-find for cycle detection
- **Borůvka's:** O(E log V); parallel-friendly

### Network Flow
- **Max-flow min-cut theorem:** Max flow = capacity of minimum s-t cut
- **Ford-Fulkerson:** O(E · |f*|); augmenting paths via DFS
- **Edmonds-Karp:** O(VE²); BFS augmenting paths
- **Push-relabel:** O(V²√E); practical
- Applications: bipartite matching, image segmentation, scheduling

### Strongly Connected Components
- **Kosaraju:** Two DFS passes on G and G^T; O(V+E)
- **Tarjan:** Single DFS; low-link values; O(V+E)

## Dynamic Programming
Optimal substructure + overlapping subproblems.
- Memoization (top-down) vs tabulation (bottom-up)

**Classic problems:**
- Longest Common Subsequence: O(mn) time+space
- Edit distance (Levenshtein): O(mn); Hirschberg: O(mn) time, O(min(m,n)) space
- Matrix chain multiplication: O(n³)
- 0/1 Knapsack: O(nW); pseudo-polynomial
- Optimal BST: O(n²) — Knuth's optimization → O(n²) but constant lower

## Complexity Classes

### P vs NP
- **P:** Decision problems solvable in poly time by deterministic TM
- **NP:** Verifiable in poly time by deterministic TM; solvable by nondeterministic TM in poly time
- **NP-hard:** At least as hard as any NP problem (via poly reduction)
- **NP-complete:** NP ∩ NP-hard

### Key NP-complete Problems
SAT (Cook-Levin theorem, 1971) — first NP-complete. Reductions: 3-SAT → clique → vertex cover → independent set → Hamiltonian cycle → TSP.

### Beyond NP
- **co-NP:** Complement of NP (e.g., UNSAT)
- **PSPACE:** Poly space; PSPACE-complete: QBF
- **EXP:** Exponential time
- **#P:** Counting problems (e.g., #SAT — count satisfying assignments)
- **BPP:** Randomized poly time (bounded error); BPP ⊆ PSPACE
- **ZPP:** Zero-error randomized; ZPP = RP ∩ co-RP
- **IP = PSPACE:** Interactive proofs

### Approximation
For NP-hard optimization problems, find near-optimal solutions.
- ε-approximation: |ALG - OPT| ≤ ε·OPT
- **PTAS:** Poly-time approximation scheme; (1+ε) for any ε>0
- **FPTAS:** Fully poly; poly in n and 1/ε

Vertex Cover: 2-approx (greedy maximal matching)
TSP (metric): 1.5-approx (Christofides algorithm)
Set Cover: O(log n)-approx; cannot do better unless P=NP (Feige 1998)

## Randomized Algorithms
- **Las Vegas:** Always correct; expected poly time (QuickSort, randomized min-cut)
- **Monte Carlo:** Always terminates; correct with high probability (Freivald's algorithm)
- **Randomized min-cut (Karger):** O(n² log n) — contract random edge until 2 nodes
- **Hashing:** Universal hashing, cuckoo hashing, bloom filters (false positives, no false negatives)
- **Probabilistic method:** Existence proofs — if E[X] > 0, instance exists where X > 0
`
},

{
slug: "cs-phd-distributed-systems",
title: "CS: Distributed Systems — Theory and Practice",
tags: ["computer-science","phd-cs","distributed-systems","consensus","cap-theorem"],
body: `# Distributed Systems

## Fundamental Limits

### CAP Theorem (Brewer 2000, Lynch & Gilbert 2002)
In the presence of a network **Partition**, a distributed system can guarantee at most one of:
- **Consistency:** Every read receives the most recent write or error
- **Availability:** Every request receives a non-error response

**Practical interpretation:** Partitions are unavoidable. Choose CP (strong consistency, may refuse requests during partition — HBase, Zookeeper) or AP (available, may return stale data — Cassandra, DynamoDB).

### PACELC
Extension: Even without partition (E), tradeoff between Latency (L) and Consistency (C).
MySQL (PA/EC), DynamoDB (PA/EL), Spanner (PC/EC).

### FLP Impossibility (Fischer, Lynch, Paterson 1985)
No deterministic consensus algorithm can guarantee termination in an asynchronous system with even one possible faulty process. Consensus is impossible in pure async model.

**Practice:** Use timeouts (partial synchrony assumption). Paxos and Raft work under partial synchrony.

## Consistency Models (strongest to weakest)
1. **Linearizability (atomic):** Operations appear instantaneous; global total order consistent with real time
2. **Sequential consistency:** Total order consistent with each process's order (not necessarily real time)
3. **Causal consistency:** Causally related operations ordered consistently; concurrent ops may differ
4. **Eventual consistency:** Given no updates, all replicas converge eventually

## Consensus Algorithms

### Paxos (Lamport 1989)
Two phases with quorums (majority).

**Phase 1 (Prepare/Promise):**
- Proposer sends Prepare(n) to quorums
- Acceptors promise not to accept proposals < n; return highest accepted value

**Phase 2 (Accept/Accepted):**
- Proposer sends Accept(n, v) — v from highest promised or proposer's choice
- Acceptors accept if no higher promise; send Accepted to learners

**Dueling proposers:** Multiple proposers can livelock (not progress); use randomized backoff or designated leader. Multi-Paxos: leader elected once, Phase 1 done once per leader term.

### Raft (Ongaro & Ousterhout 2014)
Designed for understandability. Equivalent to Multi-Paxos.

**Leader election:** Terms; candidate requests votes; wins majority. Randomized timeout prevents split votes.

**Log replication:** Leader receives entries; replicates to followers; commits when majority acknowledge. Log matching property: if two logs have entry with same index+term, all preceding entries identical.

**Safety:** Only candidates with up-to-date log can win election (compare last log entry term then index).

### BFT (Byzantine Fault Tolerance)
Handles malicious (Byzantine) nodes. PBFT (Castro & Liskov): tolerates f Byzantine faults with 3f+1 nodes. O(n²) messages per consensus round. Blockchain consensus variants: PBFT, Tendermint.

## Distributed Transactions

### Two-Phase Commit (2PC)
- **Phase 1:** Coordinator sends PREPARE; participants vote Yes/No
- **Phase 2:** If all Yes → COMMIT; else → ABORT
- **Problem:** Blocking — coordinator failure after some participants committed leaves them blocked

### Three-Phase Commit (3PC)
Adds pre-commit phase; non-blocking under single failure. Assumes synchronous network (impractical).

### Saga Pattern
Long-running distributed transactions without distributed locking.
Sequence of local transactions with compensating transactions for rollback.
Choreography (events) or Orchestration (central coordinator).

## Clock and Ordering

### Lamport Timestamps
Logical clocks: if a → b then L(a) < L(b). Not converse.
L(e) = max(L_local, L_received) + 1

### Vector Clocks
V_i[j] = number of events at process j known to process i.
Captures causality precisely: a → b iff V(a) < V(b) (componentwise).

### Google Spanner TrueTime
GPS + atomic clocks; bounded clock uncertainty [earliest, latest].
Commit wait: delay commit until TT.after(commit_timestamp) is certain.
Enables external consistency (linearizability) at global scale.

## Distributed Storage Patterns
- **Consistent hashing:** Map keys to ring; nodes responsible for arc; O(1/n) key reassignment on node add/remove. Used in Cassandra, DynamoDB.
- **Quorum reads/writes:** W + R > N for strong consistency. W=N, R=1 (write-heavy); W=1, R=N (read-heavy).
- **Log-structured storage (LSM trees):** Write to in-memory memtable → flush to SSTable → compaction. Used in Cassandra, RocksDB, BigTable.
- **CRDT (Conflict-free Replicated Data Types):** Data structures with merge operation that is commutative, associative, idempotent. G-Counter, OR-Set, LWW-Register. Enables strong eventual consistency.
`
},

// ══════════════════════════════════════════════════════
// PhD IN ROBOTICS / INTELLIGENT SYSTEMS
// ══════════════════════════════════════════════════════
{
slug: "robotics-phd-slam-perception",
title: "Robotics: SLAM, Perception, and State Estimation",
tags: ["robotics","phd-robotics","slam","perception","kalman-filter"],
body: `# SLAM, Perception, and State Estimation

## State Estimation Problem
Estimate robot state x_t from noisy sensors z_1:t and controls u_1:t.
**Bayes filter:** Bel(x_t) = η P(z_t|x_t) ∫ P(x_t|u_t,x_{t-1}) Bel(x_{t-1}) dx_{t-1}

## Kalman Filter (Linear Gaussian)
Assumes linear dynamics, Gaussian noise. Optimal estimator for linear systems.

**Predict:**
x̂_{t|t-1} = F_t x̂_{t-1|t-1} + B_t u_t
P_{t|t-1} = F_t P_{t-1|t-1} F_t^T + Q_t

**Update:**
K_t = P_{t|t-1} H_t^T (H_t P_{t|t-1} H_t^T + R_t)^{-1}
x̂_{t|t} = x̂_{t|t-1} + K_t(z_t - H_t x̂_{t|t-1})
P_{t|t} = (I - K_t H_t)P_{t|t-1}

K_t = Kalman gain. Q = process noise, R = measurement noise.

### Extended Kalman Filter (EKF)
Nonlinear f(x,u), h(x) — linearize via Jacobians.
F = ∂f/∂x|_{x̂}, H = ∂h/∂x|_{x̂}
First-order approximation; diverges if linearization poor.

### Unscented Kalman Filter (UKF)
Sigma points: deterministic samples capturing mean and covariance. Propagated through nonlinear f, h. O(n²) vs EKF's O(n) but more accurate.

### Particle Filter (Sequential Monte Carlo)
Represent Bel(x_t) as weighted particle set {x_t^i, w_t^i}.
- Prediction: sample x_t^i ~ P(x_t|u_t, x_{t-1}^i)
- Update: w_t^i = P(z_t|x_t^i)
- Resample: new particles proportional to weights (prevents degeneracy)
Handles multimodal distributions; expensive for high-dimensional state.

## SLAM (Simultaneous Localization and Mapping)
Joint estimation of robot trajectory x_{1:t} and map m.

### EKF-SLAM
State = [robot pose; all landmark positions]. Grows quadratically with landmarks. Correlations maintained (dense covariance). O(n²) update.

### Graph SLAM (g²o, GTSAM)
Nodes = poses and landmarks. Edges = relative constraints from observations.
Optimize: minimize sum of squared residuals (MAP estimation).
Gauss-Newton or Levenberg-Marquardt on sparse graph. Much more efficient.

### Factor Graphs
Bipartite graph: variable nodes ↔ factor nodes.
Factor = local function of connected variables.
Sum-product algorithm: belief propagation for efficient inference.

### Visual SLAM
ORB-SLAM3: ORB features; Essential/Homography matrix for initialization; PnP for tracking; bundle adjustment; loop closure via DBoW2.
Direct methods (LSD-SLAM, DSO): minimize photometric error; no features; semi-dense maps.

### LiDAR SLAM
NDT (Normal Distributions Transform) scan matching.
LOAM: point cloud segmentation + feature extraction (edge/planar) + odometry + mapping.
Loop closure: ICP or generalized ICP; SC-LeGO-LOAM.

## Computer Vision for Robotics

### Camera Models
Pinhole: [u,v,1]^T = K [R|t] [X,Y,Z,1]^T
K = [[fx,0,cx],[0,fy,cy],[0,0,1]] — intrinsic matrix
Distortion: radial (k1,k2,k3), tangential (p1,p2).

### Stereo Vision
Disparity d = u_L - u_R. Depth Z = fB/d (f=focal length, B=baseline).
Block matching, semi-global matching (SGM).

### Structure from Motion (SfM)
Reconstruct 3D from multiple views.
Essential matrix E = [t]×R encodes relative pose for calibrated cameras.
8-point algorithm → SVD. RANSAC for robust estimation.
Bundle adjustment: optimize all poses + 3D points jointly.

### Optical Flow
Apparent motion of image pixels between frames.
**Lucas-Kanade:** Constant flow assumption in neighborhood; least-squares.
**Horn-Schunck:** Global smoothness regularization; dense flow.
Deep: FlowNet, PWC-Net, RAFT — trained end-to-end.

## Motion Planning

### Configuration Space (C-space)
Map robot workspace to C-space where robot = point.
C_free = configurations avoiding collision.
Planning in C-space, not workspace.

### Sampling-Based Methods
- **PRM (Probabilistic Roadmap):** Sample C_free; build graph; query with Dijkstra
- **RRT (Rapidly-exploring Random Tree):** Grow tree toward random samples; O(log n) near-optimal with RRT*
- **RRT*:** Asymptotically optimal; rewire on better paths found

### Potential Fields
Attractive potential toward goal + repulsive potential from obstacles.
∇U → velocity command. Fast but local minima problem.
`
},

{
slug: "robotics-phd-control-theory",
title: "Robotics: Control Theory and Robot Dynamics",
tags: ["robotics","phd-robotics","control-theory","dynamics","kinematics"],
body: `# Control Theory and Robot Dynamics

## Robot Kinematics

### Forward Kinematics
Given joint angles θ → end-effector pose T.
**Denavit-Hartenberg (DH) convention:**
^{i-1}T_i = R_z(θ_i) T_z(d_i) T_x(a_i) R_x(α_i)
4 parameters per joint: θ, d, a, α.
Chain of homogeneous transforms: T = T_0^1 · T_1^2 · ... · T_{n-1}^n

### Inverse Kinematics
Given pose T → joint angles θ. Nonlinear, possibly no solution or infinite solutions.
- **Closed form:** For special geometries (Pieper's condition: 3 consecutive axes intersect)
- **Numerical:** Jacobian pseudoinverse: θ_dot = J^+ x_dot; iterative; local minimum problem
- **Jacobian:** J(θ) = ∂x/∂θ; linear map from joint velocities to end-effector velocities

**Singularities:** det(J)=0; loss of DOF; infinite joint velocities needed.
Damped least squares: J^+ = J^T(JJ^T + λ²I)^{-1} — avoids singularity issues.

## Robot Dynamics

### Euler-Lagrange Formulation
L = T - V (Lagrangian = kinetic - potential energy)
d/dt(∂L/∂q̇_i) - ∂L/∂q_i = τ_i

**Equation of motion:**
M(q)q̈ + C(q,q̇)q̇ + G(q) = τ

- M(q): inertia matrix (symmetric, positive definite)
- C(q,q̇): Coriolis and centrifugal matrix
- G(q): gravity vector
- τ: joint torques

### Newton-Euler Formulation
Recursive; computationally O(n) vs Lagrangian O(n⁴).
Forward recursion: propagate velocities/accelerations from base to end.
Backward recursion: propagate forces/torques from end to base.
Standard for real-time control.

## Control Architectures

### PID Control
u(t) = K_p e(t) + K_i ∫e(t)dt + K_d ė(t)
Transfer function: C(s) = K_p + K_i/s + K_d·s

Tuning methods: Ziegler-Nichols (step/oscillation methods), pole placement, auto-tuning.
Integral windup: saturate integral term when output saturated.
Derivative kick: use derivative of measurement, not error: -K_d ẏ(t).

### State-Space Control
Ẋ = AX + Bu, Y = CX + Du
**Controllability:** Rank([B, AB, A²B,...,A^{n-1}B]) = n → can reach any state
**Observability:** Rank([C; CA; CA²;...;CA^{n-1}]) = n → can estimate any state from output

**Pole placement:** Choose K so A-BK has desired eigenvalues → stable, fast response.

### LQR (Linear Quadratic Regulator)
Minimize: J = ∫₀^∞ (x^T Q x + u^T R u) dt
Solution: u* = -Kx where K = R^{-1}B^TP, P = solution to algebraic Riccati equation.
Optimal tradeoff between state error and control effort via Q, R tuning.

### MPC (Model Predictive Control)
At each timestep, solve optimization over finite horizon:
min_{u_{t:t+N}} Σ_{k=t}^{t+N} [x_k^T Q x_k + u_k^T R u_k] + x_{t+N}^T P_f x_{t+N}
subject to: dynamics, state/input constraints.
Apply first control u_t, re-solve at t+1. Handles constraints explicitly.
Linear MPC: QP solver; Nonlinear MPC: NLP solver (slower).

## Dynamics Learning and Adaptive Control

### Adaptive Control
Online update of controller parameters to handle uncertainty.
Model reference adaptive control (MRAC): adapt to match reference model.
Self-tuning regulators: online system identification + controller redesign.

### Gaussian Process Regression for Dynamics
Learn residual dynamics Δf(x,u) = f(x,u) - f̂_nom(x,u).
GP prior + observations → posterior → uncertainty quantification.
GP-MPC: incorporate uncertainty into safety constraints.

## Manipulation

### Grasp Analysis
Grasp wrench space, force closure, form closure.
Contact mechanics: Coulomb friction cone, soft finger contact.
Quality metrics: largest ball in wrench space, volume of convex hull.

### Deformable Object Manipulation
State representation challenge (infinite-dimensional).
Simulation-to-real transfer; learning-based approaches.
`
},

// ══════════════════════════════════════════════════════
// PhD IN ELECTRICAL ENGINEERING & COMPUTER SCIENCE
// ══════════════════════════════════════════════════════
{
slug: "eecs-phd-digital-signal-processing",
title: "EECS: Digital Signal Processing and Information Theory",
tags: ["eecs","phd-eecs","signal-processing","information-theory","dsp"],
body: `# Digital Signal Processing and Information Theory

## Signals and Systems

### Fourier Transform
X(f) = ∫_{-∞}^∞ x(t) e^{-j2πft} dt
x(t) = ∫_{-∞}^∞ X(f) e^{j2πft} df

Properties: Linearity, shift, scaling, convolution ↔ multiplication, Parseval's theorem.
**DFT:** X[k] = Σ_{n=0}^{N-1} x[n] e^{-j2πkn/N}

### FFT (Fast Fourier Transform)
Cooley-Tukey: O(N log N) vs naive DFT O(N²). Divide-and-conquer on DFT.
Decimation in time (DIT): split even/odd samples recursively.

### Z-Transform
X(z) = Σ_{n=-∞}^∞ x[n] z^{-n}
Region of convergence (ROC) determines stability and causality.
Poles inside unit circle → stable causal system.

### Filter Design
**FIR:** h[n] for finite duration; linear phase; always stable; Parks-McClellan algorithm.
**IIR:** Infinite impulse response; more efficient; possible instability; Butterworth, Chebyshev, elliptic designs. Bilinear transform from analog prototype.

## Sampling Theory
**Nyquist-Shannon:** If x(t) bandlimited to B Hz, sample at f_s ≥ 2B without aliasing.
**Aliasing:** Frequencies fold: f_aliased = |f - k·f_s| for nearest k.
Anti-aliasing filter before ADC.

**Oversampling and sigma-delta ADC:** Oversample M× → noise shaping → decimate. Trading bits for bandwidth.

## Information Theory (Shannon 1948)

### Entropy
H(X) = -Σ_x P(x) log₂ P(x) [bits]
Maximum entropy: uniform distribution → H = log₂|X|.
Conditional: H(X|Y) = -Σ_{x,y} P(x,y) log P(x|y).
**Chain rule:** H(X,Y) = H(X) + H(Y|X).

### Mutual Information
I(X;Y) = H(X) - H(X|Y) = H(Y) - H(Y|X) = H(X)+H(Y)-H(X,Y)
I(X;Y) ≥ 0; I = 0 iff independent. Processing can't increase mutual information (data processing inequality).

### Channel Capacity
C = max_{P(X)} I(X;Y) [bits/channel use]
**AWGN channel:** C = ½ log₂(1 + SNR) [bits/sample]
Shannon's channel coding theorem: Reliable communication possible at rate R < C; impossible for R > C.

### Source Coding
**Shannon's source coding theorem:** Lossless compression requires ≥ H(X) bits/symbol.
**Huffman coding:** Optimal prefix code; greedy algorithm on probability-sorted tree.
**Arithmetic coding:** Approaches entropy; encodes sequence as interval in [0,1).
**Lempel-Ziv (LZ77/LZ78):** Dictionary-based; asymptotically optimal; practical (gzip, deflate).

## Computer Architecture

### Pipeline Hazards
- **Structural:** Two instructions need same hardware
- **Data:** Instruction needs result not yet available. Forwarding, stalling (bubbles).
- **Control:** Branch outcome unknown. Branch prediction (static, dynamic: 2-bit saturating counter, BTB, neural predictor).

**Out-of-order execution:** Tomasulo algorithm; reservation stations; register renaming eliminates WAR/WAW hazards; ROB for in-order commit.

### Memory Hierarchy
Register → L1 cache (1-4 cycles) → L2 (10 cycles) → L3 (30-40 cycles) → DRAM (100+ cycles) → SSD → HDD.

**Cache organization:** Direct-mapped, set-associative, fully-associative.
Replacement: LRU, PLRU, random.
Write policy: write-through, write-back with dirty bit.

**Virtual Memory:** Page tables; TLB for translation; multi-level page tables; ASLR for security.

### GPU Architecture
SIMD (Single Instruction Multiple Data) at scale.
Warps (32 threads) execute in lockstep.
Memory hierarchy: registers, shared memory (L1), L2, global memory.
Latency hiding: many warps in flight; context switch when memory access stalls.
CUDA/ROCm programming model: grid → blocks → threads.

### Interconnects
PCIe: CPU-GPU bandwidth ~32 GB/s (Gen4 ×16)
NVLink: GPU-GPU ~600 GB/s
InfiniBand / RoCE: GPU cluster networking; RDMA
`
},

{
slug: "eecs-phd-vlsi-embedded",
title: "EECS: VLSI Design and Embedded Systems",
tags: ["eecs","phd-eecs","vlsi","embedded-systems","hardware"],
body: `# VLSI Design and Embedded Systems

## VLSI Design Flow
Specification → RTL (Verilog/VHDL) → Logic Synthesis → Floorplan → Place & Route → Signoff → Tapeout

### RTL Design
Register Transfer Level: describe hardware as registers and combinational logic.
Synchronous design: all registers clocked; timing analysis tractable.
**Critical path:** Longest combinational delay between registers; limits clock frequency.
Setup time: data must be stable before clock edge.
Hold time: data must remain stable after clock edge.

### Logic Synthesis
RTL → gate-level netlist. Technology mapping: map generic gates to library cells.
Optimization: area vs timing vs power tradeoff.
Static Timing Analysis (STA): verify timing closure; slack = required arrival - actual arrival.

### CMOS Transistors
NMOS: n-type channel; strong pull-down.
PMOS: p-type channel; strong pull-up.
**Complementary CMOS:** NMOS pull-down network, PMOS pull-up network. Only one network conducting at once → low static power.
**CMOS switching energy:** E = α·C_L·V_DD² per cycle (α = activity factor).
**Leakage:** Subthreshold current; dominant at low activity; exponential in V_th.

### FinFET / GAAFET
3D transistor structures; better electrostatic control; reduced short-channel effects.
GAAFET (gate-all-around): next generation; sheets or nanowires.

### Process Technology Nodes
28nm, 16nm/14nm (FinFET), 7nm, 5nm, 3nm (GAAFET). Each node ~0.7× linear scaling.
**Dennard scaling ended ~2006:** Can no longer reduce voltage with transistor size → power wall.
**Dark silicon:** At advanced nodes, large portions of chip must be powered off at any time.

## Embedded Systems

### Real-Time Systems
Hard real-time: deadline miss = system failure (flight control, ABS).
Soft real-time: deadline miss = degraded performance (video streaming).
Firm real-time: deadline miss = result worthless but not dangerous.

**Schedulability analysis:**
Rate Monotonic (RM): assign priority by period (shorter period = higher priority). Schedulable if Σ C_i/T_i ≤ n(2^{1/n}-1) ≈ 0.69 for large n.
EDF (Earliest Deadline First): optimal for uniprocessor; schedule task with nearest deadline. Schedulable if Σ C_i/T_i ≤ 1.

### RTOS Concepts
- **Task scheduling:** Preemptive priority; context switch cost
- **Priority inversion:** Low-priority task holds resource needed by high-priority. Solution: Priority Inheritance Protocol, Priority Ceiling Protocol.
- **Semaphores vs mutexes:** Binary semaphore for signaling; mutex with ownership for mutual exclusion
- **Memory:** Static allocation preferred in safety-critical (no heap fragmentation)

### DMA (Direct Memory Access)
Peripheral transfers data to/from memory without CPU.
CPU sets up DMA: source, destination, count, direction. DMA engine handles burst transfer. CPU interrupted on completion.
Frees CPU for computation during I/O.

### Communication Protocols
- **SPI:** Master-slave; MOSI/MISO/SCK/CS; full-duplex; no addressing; up to 50+ MHz
- **I²C:** Multi-master; 2 wires (SDA, SCL); addressing (7-bit, 127 devices); 100/400kHz standard
- **UART:** Asynchronous; start/stop bits; no clock line; RS-232/485
- **CAN:** Differential bus; arbitration without collision; automotive (ISO 11898)
- **Ethernet/EtherCAT:** Industrial real-time control

### Low-Power Design
- **Clock gating:** Disable clock to idle logic blocks
- **Power gating:** Cut power to unused blocks (memory retention with smaller retention supply)
- **DVFS (Dynamic Voltage and Frequency Scaling):** Reduce V and f at low load; E ∝ CV²
- **Duty cycling:** Sleep between events (BLE, LoRa devices; μA average)
`
},

// ══════════════════════════════════════════════════════
// GENERATIVE MODELS
// ══════════════════════════════════════════════════════
{
slug: "genai-phd-diffusion-models",
title: "Generative AI: Diffusion Models — Theory and Architecture",
tags: ["generative-models","phd-genai","diffusion","score-matching","ddpm"],
body: `# Diffusion Models

## Forward Process (Noising)
Define a Markov chain that gradually adds Gaussian noise:
q(x_t|x_{t-1}) = N(x_t; √(1-β_t)x_{t-1}, β_t I)
where β_t is a noise schedule (linear, cosine, or learned).

**Closed form at time t:**
q(x_t|x_0) = N(x_t; √ᾱ_t x_0, (1-ᾱ_t)I)
where ᾱ_t = Π_{s=1}^t (1-β_s)
So: x_t = √ᾱ_t x_0 + √(1-ᾱ_t) ε, ε ~ N(0,I)

As t → T: x_T ≈ N(0,I) regardless of x_0.

## Reverse Process (Denoising)
Learn p_θ(x_{t-1}|x_t) = N(x_{t-1}; μ_θ(x_t,t), Σ_θ(x_t,t))

Optimal posterior: q(x_{t-1}|x_t,x_0) = N(x_{t-1}; μ̃_t, β̃_t I)
where μ̃_t = (√ᾱ_{t-1}β_t/(1-ᾱ_t))x_0 + (√(1-β_t)(1-ᾱ_{t-1})/(1-ᾱ_t))x_t

## Training Objective (DDPM, Ho et al. 2020)
Predict noise ε from noisy image:
L_simple = E_{t,x_0,ε}[||ε - ε_θ(x_t, t)||²]
(Simplified ELBO; ignores variance weighting)

Equivalent to: predict x̂_0 = (x_t - √(1-ᾱ_t)ε_θ) / √ᾱ_t

## Score Matching (Song et al.)
Score function: s_θ(x,t) = ∇_x log p_t(x)
**Denoising Score Matching:** s_θ(x_t,t) ≈ -ε_θ(x_t,t)/√(1-ᾱ_t)

**Stochastic Differential Equations (SDE) perspective:**
Forward SDE: dx = f(x,t)dt + g(t)dW
Reverse SDE: dx = [f(x,t) - g²(t)∇_x log p_t(x)]dt + g(t)dW̄
Score function enables SDE reversal → flexible sampling.

## Sampling

### DDPM Sampling
x_{t-1} = μ_θ(x_t,t) + σ_t z, z ~ N(0,I)
T=1000 steps typical → slow.

### DDIM (Denoising Diffusion Implicit Models)
Non-Markovian sampling; skip timesteps.
x_{t-prev} = √ᾱ_{t-prev}·x̂_0(x_t) + √(1-ᾱ_{t-prev}-σ²)·ε_θ(x_t,t) + σ·z
η=0: deterministic (ODE); η=1: DDPM.
10-50 steps for comparable quality.

### DPM-Solver
High-order ODE solver; 10-20 steps; fastest exact sampler.

### Classifier-Free Guidance (CFG)
Train conditional (class c) and unconditional (c=∅) jointly via random dropout.
ε̂ = ε_θ(x_t,∅) + w[ε_θ(x_t,c) - ε_θ(x_t,∅)]
w=7.5 typical; higher w → better quality, less diversity.

## Architectures

### U-Net (DDPM, Stable Diffusion)
Encoder-decoder with skip connections. Residual blocks + attention at multiple scales.
Time conditioning via sinusoidal embedding → AdaGN (adaptive group norm).
Class/text conditioning via cross-attention.

### Latent Diffusion Models (Stable Diffusion, DALL-E 3)
Compress image to latent z via VAE: z = E(x), x ≈ D(z).
Run diffusion in latent space → 4-8× cheaper.
Text conditioning: CLIP / T5 text encoder → cross-attention in U-Net.

### DiT (Diffusion Transformer)
Patchify image → sequence of patches → Transformer (GPT-like).
AdaLN-Zero for conditioning: shift/scale from timestep + class.
Scales better than U-Net; used in Sora-style video models.

## Video Generation
Challenge: temporal consistency across frames.
- **3D attention:** Extend spatial attention to spatio-temporal cubes
- **Factored attention:** Spatial attention over frames + temporal attention over time
- **Video diffusion models:** x_t is now a video tensor
- Motion consistency via optical flow supervision or CLIP video encoders
- Key models: Make-A-Video, Imagen Video, Sora (speculated DiT-based)

## Text-to-Image Pipelines
DALL-E 3: rich caption generation → diffusion model (caption recaptioning for alignment)
Stable Diffusion XL: two-stage pipeline; base + refiner
Flux (Black Forest): Rectified flow + DiT architecture; state of art (2024)
`
},

{
slug: "genai-phd-gans-vaes",
title: "Generative AI: GANs and Variational Autoencoders",
tags: ["generative-models","phd-genai","gans","vae","generative"],
body: `# GANs and Variational Autoencoders

## Variational Autoencoders (VAE)

### Latent Variable Model
p_θ(x) = ∫ p_θ(x|z) p(z) dz — intractable integral
Introduce approximate posterior q_φ(z|x).

### ELBO (Evidence Lower Bound)
log p_θ(x) ≥ E_{q_φ(z|x)}[log p_θ(x|z)] - KL(q_φ(z|x) || p(z))
= Reconstruction term - KL regularization

**Training:** Maximize ELBO jointly over θ, φ.
Encoder q_φ outputs μ(x), σ(x). Sample z = μ + σ·ε, ε ~ N(0,I) — **reparameterization trick** enables backprop through sampling.
Decoder p_θ(x|z): Bernoulli (binary), Gaussian (continuous), or discretized.

### β-VAE
ELBO_β = E[log p(x|z)] - β·KL(q(z|x)||p(z))
β > 1 → stronger disentanglement; worse reconstruction.
Disentanglement: each latent dim controls independent generative factor.

### VQ-VAE (Vector Quantized VAE)
Discrete latent space: codebook {e_k}_{k=1}^K.
Encoder → nearest codebook vector: z_q = argmin_k ||z_e - e_k||
Straight-through estimator for gradient through argmin.
VQ-VAE-2: hierarchical; top level = global structure, bottom = local details.

## Generative Adversarial Networks (GANs)

### Original GAN (Goodfellow et al., 2014)
Generator G: z → x̂ (z ~ p_z, typically N(0,I))
Discriminator D: x → [0,1] (real/fake probability)

**Minimax objective:**
min_G max_D V(D,G) = E_x[log D(x)] + E_z[log(1-D(G(z)))]

Nash equilibrium: G produces p_g = p_data; D(x) = 0.5 everywhere.
**Non-saturating loss for G:** max E_z[log D(G(z))] — avoids vanishing gradient early.

### Training Difficulties
- **Mode collapse:** G maps many z to few modes
- **Vanishing gradients:** D too strong → G gets no signal
- **Oscillation:** No guarantee of convergence in GAN minimax game

### Wasserstein GAN (WGAN)
Earth mover's / Wasserstein-1 distance: W(p,q) = inf_{γ∈Π(p,q)} E_{(x,y)~γ}[||x-y||]
Critic (no sigmoid) optimizes: max_f E_{x~p}[f(x)] - E_{z}[f(G(z))]
subject to f being 1-Lipschitz.
**Weight clipping** or **gradient penalty (WGAN-GP)**: ||∇f(x̂)||₂ = 1 enforced via penalty.
More stable training; meaningful loss metric.

### Progressive GAN (ProGAN)
Grow generator and discriminator progressively: 4×4 → 8×8 → ... → 1024×1024.
Fade in new layers to avoid shock. Minibatch standard deviation feature. Pixelwise normalization.

### StyleGAN / StyleGAN2
Mapping network f: z → w (intermediate latent space, 8-layer MLP).
**AdaIN:** Adaptive Instance Normalization transfers style via w at each layer.
StyleGAN2: Demodulated convolutions; PPL (Path Length) regularization.
Fine-grained control: coarse styles (identity) from early layers; fine styles (texture) from late layers.

### Conditional GANs
- **CGAN:** Condition on class label y: D(x,y), G(z,y)
- **Pix2Pix:** Image translation; paired training; U-Net G + PatchGAN D
- **CycleGAN:** Unpaired; cycle consistency: F(G(x)) ≈ x
- **BigGAN:** Class-conditional; truncation trick (sample from truncated p_z)

## Evaluation Metrics

### FID (Fréchet Inception Distance)
FID = ||μ_r - μ_g||² + Tr(Σ_r + Σ_g - 2(Σ_r Σ_g)^{1/2})
Features from Inception-v3; lower = better. Reference for all image generation.

### Inception Score (IS)
IS = exp(E_x[KL(p(y|x) || p(y))]) — high confidence + high diversity. Sensitive to mode collapse; less reliable than FID.

### Precision and Recall
Precision: what fraction of generated images are realistic? (samples in data manifold)
Recall: what fraction of real data is covered? (diversity)
FID combines both but imperfectly.

### CLIP Score
Cosine similarity between CLIP embeddings of image and text prompt. Measures text-image alignment (not image quality).
`
},

// ══════════════════════════════════════════════════════
// EXPLAINABLE AI (XAI)
// ══════════════════════════════════════════════════════
{
slug: "xai-phd-explainability",
title: "Explainable AI (XAI) — Comprehensive Framework",
tags: ["xai","explainable-ai","phd-xai","interpretability","shap","lime"],
body: `# Explainable AI (XAI)

## Taxonomy

### Intrinsic vs Post-Hoc
- **Intrinsic:** Model is inherently interpretable (linear regression, decision trees, rule lists)
- **Post-hoc:** Explain black-box after training (SHAP, LIME, saliency maps)

### Global vs Local
- **Global:** Explain overall model behavior — what features matter most?
- **Local:** Explain single prediction — why did the model predict this for this instance?

### Model-Agnostic vs Model-Specific
- **Model-agnostic:** Works for any model (SHAP, LIME)
- **Model-specific:** Exploits architecture (gradient-based saliency for neural nets, TCAV)

## SHAP (SHapley Additive exPlanations)

### Shapley Values (from game theory)
Attribution of prediction to features, averaging over all possible feature coalitions.
φ_i(f,x) = Σ_{S⊆F\{i}} [|S|!(|F|-|S|-1)!/|F|!][f(S∪{i}) - f(S)]

Properties:
- **Efficiency:** Σ φ_i = f(x) - E[f(X)]
- **Symmetry:** Identical features get equal attribution
- **Dummy:** Feature not affecting f gets φ=0
- **Additivity:** SHAP values of ensembles = sum of SHAP values

### Computing SHAP
- **TreeSHAP:** Exact O(TLD²) for tree ensembles (Lundberg 2020); polynomial, not exponential
- **KernelSHAP:** Model-agnostic; samples coalitions; regresses to get attributions; approximate
- **DeepSHAP:** BackPropagation-based for neural nets; approximation via DeepLIFT

### SHAP Values Usage
- **Bar plots:** Mean |SHAP| per feature — global importance
- **Beeswarm plots:** SHAP value distributions per feature — direction of effect
- **Waterfall plots:** Local explanation — how each feature pushed from E[f] to f(x)
- **Dependence plots:** SHAP(feature) vs feature value — interaction and nonlinearity

## LIME (Local Interpretable Model-Agnostic Explanations)

### Algorithm (Ribeiro et al., 2016)
For instance x to explain:
1. Sample z ~ N(x) (perturbed instances near x)
2. Weight samples: π_x(z) = exp(-D(x,z)²/σ²)
3. Get f(z) from black-box
4. Fit sparse linear model g: argmin_g L(f,g,π_x) + Ω(g)
5. Return coefficients of g as explanation

**Tabular:** Perturb by sampling from marginal distribution per feature.
**Text:** Toggle presence/absence of words.
**Image:** Toggle superpixel segments.

### Limitations
- Locality ill-defined; sampling distribution matters
- Not consistent: different runs may give different explanations (for same x)
- Local linearity assumption may not hold
- Superpixel segmentation affects image explanations significantly

## Gradient-Based Methods (Neural Networks)

### Vanilla Gradients
Saliency = |∂ŷ/∂x| — pixels that most affect output.
Noisy; high-frequency artifacts; shows what changes output, not what the model "uses."

### Integrated Gradients (Sundararajan et al., 2017)
IG_i(x) = (x_i - x'_i) · ∫₀¹ (∂F(x'+α(x-x'))/∂x_i) dα
x' = baseline (e.g., black image, zero embedding).
Axioms: Sensitivity, Implementation invariance.
Approximated by summing m gradient evaluations along interpolation path.

### GradCAM
Spatial saliency for CNNs using gradients into final convolutional layer.
α_k^c = (1/Z)ΣΣ ∂y^c/∂A^k_{ij} (global average pooling of gradients)
L^c_GradCAM = ReLU(Σ_k α_k^c A^k)
Class-discriminative; localizes object regions.

### SHAP for Neural Networks
SmoothGrad: reduce gradient noise by averaging over N(x, σ²) perturbations.
Attention: attention weights ≠ explanations (Jain & Wallace 2019); post-hoc corrections needed.

## Concept-Based Explanations

### TCAV (Testing with Concept Activation Vectors)
1. Define concept C with examples/counter-examples
2. Train linear classifier on penultimate layer activations → direction v_C in activation space
3. TCAV score: fraction of inputs where ∂f_class/∂v_C > 0 (model is sensitive to concept)
Interpretable concepts (e.g., "stripes" for zebra prediction) vs arbitrary directions.

### Concept Bottleneck Models (CBM)
Predict intermediate human-defined concepts first, then predict from concepts.
y = h(c), c = g(x). Fully interpretable if c is human-labeled. Enables concept-level intervention.

## Counterfactual Explanations
"What is the minimal change to x that would change the prediction to y'?"
Wachter et al.: argmin_x' λ(f(x')-y')² + ||x-x'||₂²
DiCE: diverse set of counterfactuals. Must be actionable (plausible, feasible changes).

## Evaluation of XAI
- **Faithfulness/Fidelity:** Do explanations reflect what the model actually does? (perturbation tests)
- **Plausibility:** Do explanations match human intuition?
- **Human studies:** Do explanations help humans make better decisions? (gold standard)
- **Completeness:** Does explanation fully describe model behavior?
- **Robustness:** Are explanations stable under small input perturbations?

**Shortcut learning detection:** Models that predict from spurious correlations. Explanations reveal unexpected features being used.
`
},

// ══════════════════════════════════════════════════════
// QUANTUM MACHINE LEARNING
// ══════════════════════════════════════════════════════
{
slug: "qml-phd-quantum-computing",
title: "Quantum Computing Foundations for ML",
tags: ["quantum-ml","phd-qml","quantum-computing","qubits","circuits"],
body: `# Quantum Computing Foundations

## Quantum Mechanics Postulates

### State Space
Quantum state: |ψ⟩ ∈ H (Hilbert space), normalized: ⟨ψ|ψ⟩ = 1.
Single qubit: |ψ⟩ = α|0⟩ + β|1⟩, |α|² + |β|² = 1.
Bloch sphere: |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ}sin(θ/2)|1⟩

### Superposition
Qubit exists in combination of |0⟩ and |1⟩ until measured.
Measurement collapses to |0⟩ with probability |α|², |1⟩ with probability |β|².
Non-deterministic: cannot clone unknown quantum state (no-cloning theorem).

### Entanglement
Multi-qubit state NOT expressible as product of single-qubit states.
Bell state: |Φ⁺⟩ = (|00⟩ + |11⟩)/√2 — measuring one qubit instantly determines other.
EPR paradox; violation of Bell inequalities (experimentally confirmed).

### Quantum Gates
Unitary operations U: U†U = I (reversible, preserve norm).

**Single qubit:**
- X (NOT): [[0,1],[1,0]]
- H (Hadamard): [[1,1],[1,-1]]/√2 — creates superposition
- Z: [[1,0],[0,-1]] — phase flip
- S = √Z, T = ⁴√Z — phase rotations
- R_z(θ) = diag(e^{-iθ/2}, e^{iθ/2})

**Two qubit:**
- CNOT: flip target if control |1⟩: [[1,0,0,0],[0,1,0,0],[0,0,0,1],[0,0,1,0]]
- SWAP, controlled-Z, Toffoli (3-qubit, universal classical)

**Universal gate set:** H, T, CNOT generates all unitaries (approximately).

## Quantum Algorithms

### Grover's Search (1996)
Unsorted database of N items; find marked item.
Classical: O(N) queries. Quantum: O(√N) queries — quadratic speedup.

Oracle U_f: |x⟩ → (-1)^{f(x)}|x⟩ (marks solution states)
Diffusion operator: inversion about average.
Amplitude amplification: O(√N) iterations boost solution amplitude to ~1.

**Quantum speedup is real but limited:** Oracle calls only; database loading O(N) classically.

### Shor's Algorithm (1994)
Integer factoring: classical best O(exp(n^{1/3})) — quantum O(n³).
Breaks RSA encryption. Requires ~4000 logical qubits (error-corrected) for 2048-bit keys.
**Quantum Fourier Transform** subroutine: O(n²) gates vs classical O(n2^n).

### HHL Algorithm (Harrow-Hassidim-Lloyd, 2009)
Solve Ax = b in O(log N) time — exponential speedup over classical O(N).
**Caveats:** Quantum RAM for loading b; reading out x requires O(N) measurements; sparsity/condition number requirements. Speedup often vanishes in practice.

## Variational Quantum Algorithms (NISQ era)

### Variational Quantum Eigensolver (VQE)
Find ground state energy: E_0 = min_ψ ⟨ψ|H|ψ⟩.
Parameterized ansatz |ψ(θ)⟩ = U(θ)|0⟩.
Measure ⟨H⟩ on quantum device; optimize θ classically (COBYLA, gradient-based).
Chemistry applications: molecular ground states for drug discovery.

### QAOA (Quantum Approximate Optimization Algorithm)
Combinatorial optimization (MaxCut, TSP).
Alternating problem unitary e^{-iγH_P} and mixing unitary e^{-iβH_B}.
Depth p → 2p parameters (γ, β). Classical optimization of angles.
p→∞: exact solution. NISQ: p=1,2 practical; limited quantum advantage demonstrated.

## Quantum Error Correction

### Error Types
Bit flip: |0⟩ → |1⟩ (X error). Phase flip: |+⟩ → |−⟩ (Z error). Depolarizing: random Pauli.

### Stabilizer Codes
Logical qubit encoded in multiple physical qubits.
- 3-qubit bit flip code: |0_L⟩ = |000⟩, |1_L⟩ = |111⟩. Detects/corrects 1 bit flip.
- Shor code: 9 physical qubits → 1 logical; corrects any 1-qubit error.
- Surface code: 2D lattice; ~1000 physical qubits per logical at 0.1% error rate.

**Threshold theorem:** Below error threshold (~1%), error rate improves exponentially with code size.
**Fault-tolerant quantum computing:** Need ~10⁶ physical qubits for cryptographically relevant Shor's. Current SOTA: 100-1000 physical qubits with ~0.1-1% error.
`
},

{
slug: "qml-phd-quantum-ml-algorithms",
title: "Quantum Machine Learning — Algorithms and Limitations",
tags: ["quantum-ml","phd-qml","qml-algorithms","variational-circuits","quantum-kernels"],
body: `# Quantum Machine Learning Algorithms

## Parameterized Quantum Circuits (PQC) as ML Models

### Architecture
Data encoding → trainable unitary U(θ) → measurement → classical post-processing.

**Encoding strategies:**
- **Basis encoding:** x_i → binary string; exponential depth
- **Amplitude encoding:** |ψ⟩ = Σ_i x_i|i⟩/||x||; exponential compression; O(N) state prep
- **Angle encoding:** R_z(x_i) gates; O(n) depth; feature map φ: x → |φ(x)⟩

**Expressibility:** Ability to approximate arbitrary unitaries. High expressibility ↔ trainability tradeoff.
**Entangling capability:** How much entanglement the circuit generates.

### Barren Plateaus
Critical challenge in QML. Gradient variance vanishes exponentially with system size:
Var[∂L/∂θ_k] = O(2^{-n})
Gradient becomes exponentially small → training fails.

**Causes:**
- Random initialization on large circuits
- Global cost functions (measuring all qubits)
- Hardware noise

**Mitigations:** Local cost functions, structured initialization (QAOA-like), layerwise training, noise-adapted initialization.

## Quantum Kernels

### Quantum Feature Map
φ: x → |φ(x)⟩ implicitly defines kernel K(x,z) = |⟨φ(x)|φ(z)⟩|²
Estimated from quantum device; classically hard to compute for large n.

### Quantum Kernel SVM
1. Compute quantum kernel matrix K_ij = |⟨φ(x_i)|φ(x_j)⟩|² on quantum device
2. Train classical SVM with this kernel matrix

**Quantum advantage condition (Huang et al., 2021):**
Advantage exists only if quantum kernel K(x,z) is hard to compute classically AND relevant to the problem.
Most datasets → classical kernels equivalent. Quantum advantage narrow.

### Projected Quantum Kernels
Alternative: K(x,z) = exp(-γ||f(x)-f(z)||²) where f(x) = ⟨φ(x)|M|φ(x)⟩ — classical features from quantum circuit.
Avoids exponential measurements; more practical.

## Quantum Neural Networks (QNN)

### Continuous Variable QNN
Optical quantum computing; Gaussian gates + non-Gaussian.
Keras-like interface in Strawberry Fields (Xanadu).

### Discrete Variable QNN
Qubit-based PQC; gradient computed via parameter shift rule:
∂⟨M⟩/∂θ_k = [⟨M(θ_k+π/2)⟩ - ⟨M(θ_k-π/2)⟩]/2
Exact gradient (not finite difference); O(p) circuits for p parameters.

### Quantum Transfer Learning
Pre-trained classical CNN → quantum layer → fine-tune on small dataset.
Tested on small classification tasks; marginal/no practical advantage over classical.

## Quantum Generative Models

### Quantum GAN
Generator: PQC generates quantum state → sample classical data via measurement
Discriminator: classical or quantum network
Training: adversarial; quantum generator harder to simulate classically.
Patché et al.: mode collapse issue similar to classical GANs.

### Quantum Boltzmann Machines
Boltzmann distribution P(v,h) ∝ exp(-E(v,h)) modeled by quantum system.
Quantum tunneling aids sampling of complex distributions.
D-Wave hardware used for QBM experiments.

## Critical Assessment: Does QML Work?

### Arguments For
- Expressibility: certain distributions provably hard to sample classically
- Quantum kernel advantage: exists in structured problems with hardness guarantees
- Quantum speedup for specific linear algebra: HHL, QPCA (with caveats)

### Arguments Against (Dequantization)
Tang (2019): Quantum-inspired classical algorithm matches qPCA. Many "exponential" QML speedups matched by classical sampling algorithms (dequantization).
Data loading bottleneck: O(N) to load N classical data points eliminates speedup.
Barren plateaus: training scales poorly.
NISQ noise: current hardware too noisy for deep circuits.

### Realistic Near-Term Value
- Quantum chemistry (VQE): genuine near-term application
- Optimization (QAOA): limited quantum advantage for structured problems
- Quantum sensing: definite advantage (not ML but related)
- Fault-tolerant QML: genuine speedups may materialize post-NISQ (~2030+)

**Honest assessment:** QML is scientifically exciting but commercial advantage over classical ML remains unproven for general tasks. Monitor hardware progress at ~100 logical qubits threshold.
`
},

// ══════════════════════════════════════════════════════
// NATURAL LANGUAGE PROCESSING
// ══════════════════════════════════════════════════════
{
slug: "nlp-phd-transformers-llms",
title: "NLP: Transformer Architecture and Large Language Models",
tags: ["nlp","phd-nlp","transformers","llm","attention","gpt","bert"],
body: `# Transformer Architecture and Large Language Models

## Attention Mechanism (Vaswani et al., 2017)

### Scaled Dot-Product Attention
Q = XW_Q, K = XW_K, V = XW_V  (d_model × d_k projections)
Attention(Q,K,V) = softmax(QK^T / √d_k) V

√d_k scaling: prevents softmax saturation when d_k is large (dot products grow in magnitude).
Complexity: O(n²d) — quadratic in sequence length.

### Multi-Head Attention
MultiHead(Q,K,V) = Concat(head_1,...,head_h) W_O
head_i = Attention(QW_Q_i, KW_K_i, VW_V_i)
h heads learn different attention patterns. h=8, d_k=64 for Transformer-base.

### Types of Attention
- **Self-attention (encoder):** Q=K=V from same sequence; full bidirectional
- **Masked self-attention (decoder):** Causal mask; can only attend to past positions: A_{ij}=-∞ for j>i
- **Cross-attention:** Q from decoder, K/V from encoder; conditions generation on input

## Positional Encoding

### Sinusoidal (original)
PE(pos,2i) = sin(pos/10000^{2i/d}), PE(pos,2i+1) = cos(pos/10000^{2i/d})
Absolute; generalizes to unseen lengths somewhat.

### RoPE (Rotary Position Embedding — LLaMA, GPT-NeoX)
Encode relative position via rotation: x_m and x_n interact as f(x_m, m)^T f(x_n, n) = g(x_m, x_n, m-n).
Naturally decays with distance; excellent length generalization with YaRN/NTK extension.

### ALiBi (Attention with Linear Biases)
A_{ij} -= m·(i-j) where m is head-specific slope. Simple; strong length generalization.

## Pre-training Paradigms

### Masked Language Modeling (BERT)
Mask 15% of tokens; predict them using bidirectional context.
[MASK] 80%, random token 10%, unchanged 10%.
Captures bidirectional context; NOT autoregressive — can't generate.
Fine-tuning: add task head; full model fine-tuned on labeled data.

### Causal Language Modeling (GPT)
Predict next token: P(w_t | w_1,...,w_{t-1}).
Autoregressive; triangular attention mask; generative.
Scaling laws (Kaplan et al.): loss L ∝ N^{-α} (N = params), D^{-β} (D = data). Optimal compute: tokens ≈ 20× params (Chinchilla).

### Prefix LM (T5, UL2)
Bidirectional attention on prefix (encoder); causal on completion (decoder).
Flexible: can be used for generation and classification.

## Tokenization

### Byte Pair Encoding (BPE)
Start with character vocabulary. Iteratively merge most frequent pair.
GPT-2, GPT-4, LLaMA use BPE variants. Vocab size typically 32K-100K.

### WordPiece (BERT)
Merge to maximize language model likelihood. Splits rare words into subwords.

### SentencePiece
Language-agnostic; operates on raw text (no whitespace assumptions); used in T5, LLaMA.

## Scaling Laws

### Kaplan Scaling Laws (OpenAI, 2020)
L(N) ∝ N^{-0.076} (parameters)
L(D) ∝ D^{-0.095} (dataset tokens)
L(C) ∝ C^{-0.050} (compute FLOPs)
Smooth power laws across 7 orders of magnitude. Loss additively separable.

### Chinchilla (Hoffmann et al., 2022)
Optimal token count ≈ 20× parameter count.
GPT-3 (175B params) should have trained on ~3.5T tokens (not 300B).
LLaMA series: smaller models trained longer → same compute, better inference cost.

## Architecture Variants

### Encoder-Only (BERT, RoBERTa)
Good for: classification, NER, extractive QA. Bad for: generation.

### Decoder-Only (GPT, LLaMA, Mistral, Claude)
Good for: generation, few-shot learning, long context. Most current LLMs.

### Encoder-Decoder (T5, BART)
Good for: translation, summarization, structured generation.

### Key Architectural Improvements
- **GQA (Grouped Query Attention):** Share K/V heads across query groups; reduces KV cache; used in LLaMA-2/3
- **MoE (Mixture of Experts):** Route tokens to subset of expert FFN layers (sparse activation). Mixtral 8×7B; active params ~13B but 47B total. Grok-1, GPT-4 (speculated).
- **Flash Attention:** Tiling + recomputation; O(n²) compute but O(n) memory; 3-8× speedup.
- **KV Cache:** Store K/V from past tokens; O(n·d) memory; critical for efficient inference.
- **Sliding Window Attention (Mistral):** Local window + sparse global; O(n·w) instead of O(n²).

## Instruction Tuning and Alignment
- **SFT (Supervised Fine-Tuning):** Train on (instruction, response) pairs
- **RLHF:** Human preference → reward model → PPO fine-tuning (InstructGPT)
- **DPO (Direct Preference Optimization):** Skip reward model; optimize directly on preferences. L_DPO = -E[log σ(β log π_θ(y_w|x)/π_ref - β log π_θ(y_l|x)/π_ref)]. Simpler, often comparable to RLHF.
- **ORPO:** Odds ratio penalty integrated into SFT; no reference model needed.
`
},

{
slug: "nlp-phd-rag-and-retrieval",
title: "NLP: RAG, Retrieval, and Knowledge-Augmented Generation",
tags: ["nlp","phd-nlp","rag","retrieval","embeddings","vector-search"],
body: `# RAG and Retrieval-Augmented Generation

## Why RAG?
LLMs have static knowledge (training cutoff), hallucinate facts, can't scale to entire knowledge bases within context. RAG augments LLM with dynamic retrieval.

## Dense Retrieval

### Bi-Encoder (DPR — Dense Passage Retrieval)
Encode query q and passage p separately: E_q(q), E_p(p).
Score: sim(q,p) = E_q(q)^T E_p(p) — dot product or cosine.
Train: contrastive loss — positive (relevant) passage rank above negatives.
Hard negatives: BM25 top-k minus relevant → better discriminative training.
**Efficiency:** Pre-compute all passage embeddings; nearest neighbor search at inference.

### Cross-Encoder (Re-ranker)
Concatenate [q; SEP; p] through encoder; classification head for relevance score.
More accurate (attention sees both q and p together) but O(|P|) inference — not scalable for full corpus.
**Two-stage:** Bi-encoder retrieves top-k (100-1000); cross-encoder re-ranks to top-k' (10-20).

### Embeddings
- text-embedding-3-large (OpenAI): 3072 dims; best general purpose
- E5, GTE, BGE: open source competitive embeddings
- Matryoshka Representation Learning (MRL): train one model; truncate to 256/512/1024 dims without retraining

## Vector Databases

### Approximate Nearest Neighbor (ANN)
Exact NN: O(n·d) per query — too slow for millions of docs.

**HNSW (Hierarchical NSW):**
Multi-layer graph; greedy search from coarse to fine layers.
O(log n) build, O(log n) query (approximate). Used in: Weaviate, Qdrant, pgvector.

**IVF (Inverted File Index):**
Cluster centroids; search top-k clusters; exact within cluster.
IVF + PQ (Product Quantization): compress vectors 4-64× — trades recall for memory.
Used in: FAISS (Meta), Pinecone.

**Options:** Pinecone, Weaviate, Qdrant, Milvus, pgvector (Postgres extension), Chroma.

### BM25 (Sparse Retrieval)
BM25(q,d) = Σ IDF(t_i) · (tf(t_i,d)(k1+1)) / (tf(t_i,d)+k1(1-b+b·|d|/avgdl))
k1=1.5, b=0.75 typical. Still competitive for keyword-heavy queries.

## RAG Architectures

### Naive RAG
Query → retrieve top-k → concatenate with query → LLM generates.
Simple but: retrieval errors compound; context window limits; no query reformulation.

### Advanced RAG

**Query transformation:**
- HyDE (Hypothetical Document Embeddings): Generate hypothetical answer → embed → retrieve
- Multi-query: Generate 3-5 query variants; retrieve for each; union results (coverage)
- Step-back prompting: More abstract question → retrieve → answer specific question

**Retrieval:**
- Hybrid search: BM25 + dense retrieval; RRF (Reciprocal Rank Fusion) combination
- Metadata filtering: pre-filter by date, source, category
- Contextual chunk headers: prepend document title/section to each chunk

**Post-retrieval:**
- Re-ranking: cross-encoder or Cohere Rerank
- Context compression: LLMLingua, selective compression
- FLARE: Forward-Looking Active REtrieval; generate until uncertain; retrieve when uncertain

### Modular / Agentic RAG
- **Self-RAG:** LLM decides when to retrieve (retrieve token), critiques retrieval (relevance, support tokens)
- **CRAG (Corrective RAG):** Evaluate retrieved docs; if low quality → web search fallback
- **Graph RAG (Microsoft):** Build knowledge graph from corpus; community summarization; graph traversal + retrieval

## Chunking Strategies
- **Fixed size:** 512/1024 tokens; overlap 20%; simple; ignores semantics
- **Recursive text splitter:** Split on paragraphs, sentences, words hierarchically
- **Semantic:** Group sentences by embedding similarity; preserves semantic units
- **Document structure:** Split on headers (Markdown, HTML); preserves document logic
- **Late chunking (JinaAI):** Embed full document; chunk embeddings after; context preserved
- **Contextual retrieval (Anthropic):** Prepend chunk-specific context generated by Claude before embedding

## Evaluation
- **Retrieval:** Recall@k, MRR, NDCG — does relevant doc appear in top-k?
- **Generation:** RAGAS framework: faithfulness (supported by context?), answer relevance, context precision, context recall
- **End-to-end:** EM (Exact Match), F1 for extractive; LLM-as-judge for generative; human eval gold standard
`
},

{
slug: "nlp-phd-nlp-fundamentals",
title: "NLP: Foundational Tasks, Evaluation, and Classical Methods",
tags: ["nlp","phd-nlp","sequence-labeling","parsing","machine-translation","evaluation"],
body: `# NLP Foundational Tasks and Methods

## Text Classification

### Naive Bayes
P(c|d) ∝ P(c)·Π_{w∈d} P(w|c)
With Laplace smoothing: P(w|c) = (count(w,c)+1)/(Σ count(w',c)+|V|)
Fast, interpretable, strong baseline. Assumes conditional independence (naive).

### Classical Feature Engineering
TF-IDF: tf(t,d)·log(N/df(t)) — term frequency weighted by inverse document frequency.
N-gram features, character n-grams (robust to morphology, spelling errors).
Linear SVM with TF-IDF still competitive for many classification tasks.

## Sequence Labeling

### CRF (Conditional Random Field)
P(y|x) = (1/Z(x)) exp(Σ_t Σ_k λ_k f_k(y_t, y_{t-1}, x, t))
Global normalization: consider all possible label sequences.
Captures label dependencies (O→I valid; B→I valid; O→I invalid in BIO).
Viterbi algorithm: O(T|L|²) for inference. Used in NER, POS tagging.

### Neural Sequence Labeling
BiLSTM-CRF: bidirectional LSTM encodes context; CRF models label dependencies.
Transformer + linear head: state of art for NER with domain adaptation.
BIO / BIOES tagging schemes.

## Parsing

### Dependency Parsing
Directed graph: head → dependent arcs. Universal Dependencies (UD) standard.
**Arc-eager/arc-standard:** Transition-based; O(n); trained as classifier on gold transitions.
**Graph-based (Biaffine):** Score all arcs; max spanning tree. O(n²) but globally optimal.

### Constituency Parsing
Phrase structure trees. CKY algorithm: O(n³|G|) DP.
Modern: span-based neural parsing; BERT embeddings of spans; direct classification.

## Machine Translation

### Sequence-to-Sequence
Encoder reads source; decoder generates target token by token.
Attention mechanism (Bahdanau, 2015): first attention in NLP. Alignment weights over encoder states.
Transformer: now standard; parallelizable; global context.

### Evaluation
**BLEU (Bilingual Evaluation Understudy):**
BLEU = BP · exp(Σ w_n log p_n)
p_n = modified n-gram precision (clipped by reference count).
BP = brevity penalty: min(1, exp(1-r/c)).
Widely used; correlates poorly with human judgment for modern systems; better metrics: COMET, BLEURT.

**COMET:** Neural metric trained on human judgments. Better correlation than BLEU.

## Text Generation Evaluation

### ROUGE (Recall-Oriented Understudy for Gisting Evaluation)
ROUGE-N: n-gram recall overlap with reference. ROUGE-L: longest common subsequence.
Used for summarization evaluation. Same limitations as BLEU.

### BERTScore
Contextual token matching using BERT embeddings: F1 of max similarity token matching.
Better handles paraphrasing than surface n-gram overlap.

### LLM-as-Judge
GPT-4 or Claude evaluates generations on criteria (helpfulness, harmlessness, accuracy).
MT-Bench: multi-turn benchmark judged by GPT-4.
Arena-style ELO: human pairwise comparisons (LMSYS Chatbot Arena).
Gold standard: human evaluation with clear rubrics.

## Dialogue Systems

### Task-Oriented Dialogue
Natural Language Understanding → Dialogue State Tracking → Policy → Natural Language Generation.
DST: track slot values (restaurant: type=Italian, area=center, price=cheap).
Policy: decide next action based on dialogue state and database query results.

### Open-Domain Dialogue
Neural models trained on Reddit, Twitter, persona-conditioned data.
DialoGPT, BlenderBot, Llama Chat.
Evaluation: perplexity, F1, human ratings for engagingness/coherence/sensibleness.

## Coreference Resolution
Link mentions referring to same entity. John said he left → {John, he}.
Neural: span representations; pairwise scoring of mention pairs (Lee et al.).
Antecedent scoring: sum of mention detection + pairwise compatibility scores.
`
},

];

// ─── Seed runner ─────────────────────────────────────────────────────────────
async function seed() {
  console.log(`Seeding ${DOCS.length} PhD-level documents into tenant ${TENANT_ID}...`);
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

    const existing = await prisma.kbDocument.findFirst({
      where: { tenantId: TENANT_ID, slug: doc.slug },
    });

    if (existing) {
      await prisma.kbDocument.update({
        where: { id: existing.id },
        data: {
          title: doc.title, body: doc.body,
          status: KbDocumentStatus.published, updatedBy: CREATED_BY,
          tags: { deleteMany: {}, create: tagIds.map(tagId => ({ tagId })) },
        },
      });
      updated++;
    } else {
      await prisma.kbDocument.create({
        data: {
          tenantId: TENANT_ID, title: doc.title, slug: doc.slug, body: doc.body,
          status: KbDocumentStatus.published, createdBy: CREATED_BY, updatedBy: CREATED_BY,
          tags: { create: tagIds.map(tagId => ({ tagId })) },
        },
      });
      created++;
    }
    process.stdout.write(`  ${existing ? "updated" : "created"}: ${doc.slug}\n`);
  }

  console.log(`\nDone. Created: ${created}, Updated: ${updated}, Total: ${DOCS.length}`);
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
