# Computer Science & AI — Advanced / PhD-Level Reference

> Companion to computer_science_reference.md. Covers graduate and research-level
> topics: Advanced Algorithms, Computational Complexity, Type Theory, Programming
> Language Theory, Advanced ML/AI, Distributed Systems, Quantum Computing

---

## 1. Advanced Algorithms

### Approximation Algorithms
- **Approximation ratio**: ALG(I)/OPT(I) ≤ α for minimization (α ≥ 1)
- **Vertex Cover**: 2-approximation via maximal matching (tight under UGC)
- **Set Cover**: O(log n)-approximation (greedy), best possible unless P=NP
- **TSP (metric)**: Christofides 3/2-approximation (best known for decades); recent Karlin-Klein-Oveis Gharan slightly better
- **MAX-CUT**: Goemans-Williamson 0.878-approximation via SDP relaxation + randomized rounding
- **Knapsack**: FPTAS — (1-ε)-approximation in O(n/ε²) time
- **Inapproximability**: PCP theorem → some problems hard to approximate within certain factors
  - Clique: n^{1-ε}-hard (Håstad), Set Cover: (1-ε)ln n-hard

### Randomized Algorithms
- **BPP**: Bounded-error probabilistic polynomial time
- **RP/coRP**: One-sided error randomized classes
- **Schwartz-Zippel**: Random evaluation of polynomial — P(p(r)=0) ≤ d/|S| for degree d, r from S
- **Fingerprinting**: Compare large objects via hash (Freivalds' matrix verification)
- **Random walks on graphs**: Cover time, hitting time, commute time
- **Lovász Local Lemma**: If bad events are mostly independent and individually unlikely, can avoid all simultaneously

### Streaming and Sublinear Algorithms
- **Count-Min Sketch**: Frequency estimation, ε-approximation in O(1/ε × log(1/δ)) space
- **HyperLogLog**: Cardinality estimation in O(log log n) bits per counter
- **AMS sketch**: Frequency moments estimation (Alon-Matias-Szegedy)
- **Property testing**: Determine if object has property or is ε-far, in o(n) queries
  - Graph property testing: Bipartiteness testable in O(1/ε²) queries

### Parameterized Complexity
- **FPT**: Fixed-parameter tractable — O(f(k)·n^c) for parameter k
- **W-hierarchy**: W[1]-hard problems unlikely FPT (Clique parameterized by solution size)
- **Kernelization**: Polynomial-time reduction to instance of size f(k)
  - Vertex Cover has 2k kernel, k-Path has randomized O(k^{2.5} log k) kernel

### Online Algorithms
- **Competitive ratio**: ALG/OPT (or vice versa for maximization)
- **Ski rental**: Deterministic 2-competitive, randomized e/(e-1)-competitive
- **Paging**: k-competitive (LRU, FIFO), Ω(log k) randomized lower bound (Fiat et al.)
- **Online learning**: Multiplicative weights/Hedge, O(√T) regret

---

## 2. Advanced Complexity Theory

### Circuit Complexity
- **AC⁰**: Constant-depth, polynomial-size, unbounded fan-in circuits
  - PARITY ∉ AC⁰ (Furst-Saxe-Sipser / Håstad switching lemma)
- **NC**: Efficient parallel computation, NC^k = O(log^k n) depth, polynomial size
  - NC¹ ⊆ L ⊆ NL ⊆ NC² ⊆ P
- **P/poly**: Polynomial-size circuits (with advice), contains BPP
  - If NP ⊆ P/poly then PH collapses to Σ₂ (Karp-Lipton)

### Counting Complexity
- **#P**: Count number of accepting paths of NP machine
  - #P-complete: #SAT, permanent of 0-1 matrix (Valiant)
- **⊕P**: Parity of #P, ⊕SAT is ⊕P-complete
- **Toda's theorem**: PH ⊆ P^{#P} — polynomial hierarchy reducible to counting

### Communication Complexity
- **Deterministic**: D(f) = minimum bits exchanged to compute f(x,y)
- **Randomized**: R(f), allows shared randomness, bounded error
- **Equality**: D(EQ) = n+1, R(EQ) = O(log n) (fingerprinting)
- **Disjointness**: R(DISJ) = Ω(n) (hardest function for communication)
- **Log-rank conjecture**: D(f) ≤ (log rank(M_f))^c for communication matrix M_f

### Quantum Complexity
- **BQP**: Bounded-error quantum polynomial time
  - BPP ⊆ BQP ⊆ PP ⊆ PSPACE
- **Shor's algorithm**: Factor n-bit integer in O(n³) quantum time (vs sub-exponential classical)
- **Grover's algorithm**: Search unstructured database of N items in O(√N) (quadratic speedup)
- **QMA**: Quantum analog of NP (quantum proof, polynomial quantum verification)
- **Quantum supremacy**: Demonstrated by Google (2019, Sycamore 53 qubits, random circuit sampling)

---

## 3. Programming Language Theory

### Type Theory
- **Simply typed λ-calculus**: Types τ ::= α | τ₁ → τ₂, strong normalization (all terms terminate)
- **System F (polymorphic)**: Λα.M and M[τ] — type abstraction and application
  - Girard-Reynolds: Type inference undecidable in System F
- **Dependent types**: Types can depend on values — Π(x:A).B(x)
  - Curry-Howard: Proofs as programs, propositions as types
  - Σ(x:A).B(x) — dependent pairs (existential types)
- **Homotopy Type Theory (HoTT)**: Types as spaces, equality as paths, univalence axiom
- **Linear types**: Each value used exactly once (Girard's linear logic)
  - Applications: Resource management, session types, Rust's ownership

### Lambda Calculus
- **Church-Rosser**: If M →* N₁ and M →* N₂, then ∃P: N₁ →* P and N₂ →* P
- **Fixed-point combinator**: Y = λf.(λx.f(xx))(λx.f(xx))
- **De Bruijn indices**: Nameless representation, avoids α-conversion
- **Normalization**: Strong (all reduction sequences terminate) vs weak (some terminate)

### Program Verification
- **Hoare logic**: {P} S {Q} — if precondition P holds and S terminates, postcondition Q holds
  - Assignment: {P[e/x]} x := e {P}
  - Composition: {P} S₁ {Q}, {Q} S₂ {R} ⊢ {P} S₁;S₂ {R}
  - Loop invariant: {P ∧ B} S {P} ⊢ {P} while B do S {P ∧ ¬B}
- **Separation logic**: Extension for pointer programs, * (separating conjunction), -* (magic wand)
  - Frame rule: {P} C {Q} ⊢ {P * R} C {Q * R} if C doesn't modify R
- **Refinement types**: Types refined by predicates: {x:Int | x > 0}
- **Model checking**: Exhaustive state-space exploration (CTL, LTL temporal logics)
  - SPIN (Promela), NuSMV, TLA+ (Lamport)

### Concurrency Theory
- **Process algebras**: CCS (Milner), CSP (Hoare), π-calculus (mobile processes)
- **Bisimulation**: Behavioral equivalence — P ~ Q if they simulate each other step-by-step
- **Session types**: Types for communication protocols, ensure protocol compliance
- **Linearizability**: Each operation appears to take effect at a single point (Herlihy & Wing)

---

## 4. Advanced Machine Learning

### Theoretical Foundations
- **VC dimension**: Largest set shatterable by hypothesis class; d_VC
  - Sample complexity: m ≥ (1/ε)(d_VC ln(1/ε) + ln(1/δ)) for (ε,δ)-PAC learning
- **Rademacher complexity**: R_n(F) = E[sup_{f∈F} (1/n)Σ σ_if(x_i)] — measures richness of function class
  - Generalization bound: L(f) ≤ L̂(f) + 2R_n(F) + √(ln(1/δ)/(2n))
- **No Free Lunch**: No algorithm dominates all possible distributions
- **Bias-variance decomposition**: E[(f̂-f)²] = Bias² + Variance + σ²

### Deep Learning Theory
- **Universal approximation**: Single hidden layer with enough neurons approximates any continuous function
  - Depth vs width: Deeper networks can represent some functions exponentially more efficiently
- **Neural tangent kernel (NTK)**: In infinite-width limit, neural network training = kernel regression
- **Lottery ticket hypothesis**: Dense networks contain sparse subnetworks that train to same accuracy
- **Double descent**: Test error decreases, increases, then decreases again as model complexity grows
- **Loss landscape**: Local minima in overparameterized networks often near global minima quality

### Transformer Architecture (Advanced)
- **Self-attention**: Attention(Q,K,V) = softmax(QKᵀ/√d_k)V
  - Computational cost: O(n²d) for sequence length n, dimension d
- **Positional encoding**: Sinusoidal (original), learned, RoPE (rotary), ALiBi
- **Efficient attention**: FlashAttention (IO-aware), linear attention, sparse attention
- **Scaling laws (Kaplan et al.)**: L(N) ∝ N^{-α_N} for model size N, similar for data and compute
  - Chinchilla scaling: Optimal N/D ratio, train longer on more data with smaller model
- **Mixture of Experts (MoE)**: Sparse activation, router selects subset of expert networks
- **In-context learning**: Emergent ability at scale, mechanism debated (implicit Bayesian inference?)

### Reinforcement Learning (Advanced)
- **Policy gradient**: ∇J(θ) = E[Σ ∇log π_θ(a|s) · Q(s,a)]
- **TRPO**: Trust region policy optimization, KL constraint on policy update
- **PPO**: Clipped surrogate objective, simpler than TRPO
- **SAC**: Soft Actor-Critic, entropy-regularized, maximum entropy RL
- **Model-based RL**: Learn dynamics model, plan using learned model (Dreamer, MuZero)
- **RLHF**: Reinforcement Learning from Human Feedback
  - Train reward model from human preferences, then optimize policy via PPO against reward model
  - DPO (Direct Preference Optimization): Skip reward model, optimize policy directly from preferences

### Generative Models
- **VAE**: Encoder q(z|x) + decoder p(x|z), ELBO = E_q[log p(x|z)] - KL(q(z|x)||p(z))
- **GAN**: min_G max_D E[log D(x)] + E[log(1-D(G(z)))], mode collapse, training instability
  - StyleGAN, BigGAN, Progressive GAN
- **Diffusion models**: Forward process adds noise q(x_t|x_{t-1}), reverse process learns to denoise p_θ(x_{t-1}|x_t)
  - DDPM (Ho et al.), score matching, classifier-free guidance
  - Connection to score-based models: ε_θ estimates ∇_x log p(x_t)
- **Flow-based**: Normalizing flows, invertible transformations, exact likelihood
- **Autoregressive**: GPT family, p(x) = ∏ p(x_i|x_{<i}), exact likelihood, sequential generation

---

## 5. Distributed Systems

### Consensus
- **FLP impossibility**: No deterministic consensus in asynchronous system with even one crash failure
- **Paxos (Lamport)**: Leader-based consensus, prepare/promise/accept/learn phases
  - Multi-Paxos: Amortize leader election across multiple instances
- **Raft**: Equivalent to Multi-Paxos, designed for understandability
  - Leader election → log replication → safety (committed entries never lost)
- **Byzantine fault tolerance**: BFT requires 3f+1 nodes to tolerate f Byzantine faults
  - PBFT (Castro-Liskov): O(n²) messages per consensus round
  - Blockchain: Nakamoto consensus (Bitcoin), proof-of-stake (Ethereum 2.0)

### Consistency Models (Formal)
- **Linearizability**: Operations appear atomic at some point between invocation and response
- **Sequential consistency**: Operations from each process in order, some total order (Lamport)
- **Causal consistency**: Causally related operations ordered, concurrent may differ
- **Eventual consistency**: All replicas converge given no new updates
- **CRDTs**: Conflict-free replicated data types, mathematical merge guarantees convergence
  - G-Counter, PN-Counter, G-Set, OR-Set, LWW-Register

### CAP and PACELC
- **CAP**: During partition, choose Consistency or Availability (Brewer's theorem)
- **PACELC**: If Partition → C/A tradeoff; Else → Latency/Consistency tradeoff
- **Practical systems**: Cassandra (AP), HBase (CP), DynamoDB (configurable), Spanner (CP with TrueTime)

### Distributed Algorithms
- **Logical clocks**: Lamport timestamps (partial order), vector clocks (causal order)
- **Snapshot**: Chandy-Lamport algorithm, consistent global state without stopping
- **Leader election**: Bully algorithm, ring-based, Ω failure detector
- **Mutual exclusion**: Ricart-Agrawala (message-based), Maekawa (quorum-based)

---

## 6. Cryptography (Advanced)

### Public-Key Cryptography
- **RSA security**: Based on hardness of factoring n = pq; best classical: GNFS sub-exponential
- **Elliptic curve**: Points on y² = x³ + ax + b over F_p, group operation, ECDLP
  - Ed25519: Curve25519, ~128-bit security, fast signatures
- **Lattice-based**: Learning With Errors (LWE), Ring-LWE, post-quantum candidates
  - CRYSTALS-Kyber (key encapsulation), CRYSTALS-Dilithium (signatures) — NIST PQC standards
- **Homomorphic encryption**: Compute on encrypted data
  - Partially HE: RSA (multiplicative), Paillier (additive)
  - Fully HE: BFV, CKKS, TFHE — all data types, very slow (10³-10⁶× overhead)

### Zero-Knowledge Proofs
- **Definition**: Prover convinces verifier of statement truth without revealing anything else
  - Completeness, soundness, zero-knowledge
- **zk-SNARKs**: Succinct Non-interactive Arguments of Knowledge (Groth16, PLONK)
  - Proof size: O(1), verification: O(1), trusted setup (some variants)
  - Applications: Zcash, Ethereum rollups
- **zk-STARKs**: Transparent (no trusted setup), post-quantum, larger proofs
- **Interactive proofs**: IP = PSPACE (Shamir), MIP = NEXP, MIP* = RE

### Secure Computation
- **Garbled circuits (Yao)**: Two-party computation, one party garbles Boolean circuit
- **Secret sharing (Shamir)**: t-out-of-n threshold, polynomial interpolation
- **Oblivious transfer**: Sender has messages, receiver gets one without sender knowing which
- **MPC**: Multi-party computation — jointly compute function without revealing inputs
  - GMW protocol, BGW protocol, SPDZ (practical for arithmetic circuits)

---

## 7. Information Theory (Advanced)

### Channel Coding
- **Channel capacity**: C = max_{p(x)} I(X;Y)
  - BSC: C = 1 - H(p) where p = crossover probability
  - BEC: C = 1 - ε where ε = erasure probability
  - AWGN: C = ½log₂(1 + SNR)
- **LDPC codes**: Low-density parity-check, near Shannon limit, belief propagation decoding
- **Turbo codes**: Parallel concatenated codes, iterative decoding, within 0.5 dB of Shannon limit
- **Polar codes**: Capacity-achieving, successive cancellation decoding (Arıkan 2009)

### Rate-Distortion Theory
- **R(D)**: Minimum rate to describe source with distortion ≤ D
- **Gaussian source**: R(D) = ½log₂(σ²/D) for D ≤ σ²

### Network Information Theory
- **Multiple access channel**: Rate region, corner points from successive decoding
- **Broadcast channel**: Superposition coding, rate region (Marton's inner bound)
- **Relay channel**: Decode-and-forward, compress-and-forward
- **Distributed source coding**: Slepian-Wolf (lossless), Wyner-Ziv (lossy with side information)
