# Computer Science & AI Reference — HLE Benchmark Knowledge Base

> 9% of HLE questions.
> Covers: Algorithms, Complexity Theory, AI/ML, Programming Languages,
> Cryptography, Data Science, Robotics

---

## 1. Algorithms & Data Structures

### Sorting (comparison-based lower bound: Ω(n log n))
| Algorithm | Best | Average | Worst | Space | Stable? |
|---|---|---|---|---|---|
| Merge sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick sort | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| Heap sort | O(n log n) | O(n log n) | O(n log n) | O(1) | No |
| Insertion sort | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Counting sort | O(n+k) | O(n+k) | O(n+k) | O(k) | Yes |
| Radix sort | O(nk) | O(nk) | O(nk) | O(n+k) | Yes |

### Graph Algorithms
- **BFS**: O(V+E), shortest path in unweighted graphs, level-order
- **DFS**: O(V+E), topological sort, cycle detection, connected components
- **Dijkstra**: O((V+E) log V), shortest path (non-negative weights)
- **Bellman-Ford**: O(VE), shortest path (handles negative weights, detects negative cycles)
- **Floyd-Warshall**: O(V³), all-pairs shortest path
- **Kruskal/Prim**: MST, O(E log E) / O((V+E) log V)
- **Ford-Fulkerson**: Max flow, O(VE²) (Edmonds-Karp)
- **Tarjan's**: Strongly connected components, O(V+E)

### Dynamic Programming
- **Optimal substructure** + **overlapping subproblems**
- **Knapsack**: O(nW) pseudo-polynomial
- **LCS**: O(mn), longest common subsequence
- **Edit distance**: O(mn), Levenshtein
- **Matrix chain multiplication**: O(n³)

### Key Data Structures
| Structure | Search | Insert | Delete | Notes |
|---|---|---|---|---|
| Hash table | O(1) avg | O(1) avg | O(1) avg | O(n) worst |
| BST (balanced) | O(log n) | O(log n) | O(log n) | AVL, Red-Black |
| B-tree | O(log n) | O(log n) | O(log n) | Disk-optimized |
| Heap | O(n) | O(log n) | O(log n) | Min/max in O(1) |
| Trie | O(k) | O(k) | O(k) | k = key length |
| Disjoint Set | O(α(n)) | O(α(n)) | - | Union-Find |

---

## 2. Complexity Theory

### Complexity Classes
- **P**: Decidable in polynomial time by deterministic TM
- **NP**: Verifiable in polynomial time (or decidable by nondeterministic TM in poly time)
- **NP-complete**: In NP and NP-hard (every NP problem reduces to it)
- **NP-hard**: At least as hard as every NP problem (may not be in NP)
- **PSPACE**: Decidable using polynomial space
- **EXPTIME**: Decidable in exponential time
- **P ⊆ NP ⊆ PSPACE ⊆ EXPTIME**
- **P vs NP**: Open problem — is P = NP?

### Classic NP-Complete Problems
- SAT (Boolean satisfiability) — Cook's theorem (first NP-complete problem)
- 3-SAT, Vertex Cover, Clique, Independent Set
- Hamiltonian Path/Cycle, Traveling Salesman (decision version)
- Subset Sum, Partition, Knapsack (decision version)
- Graph Coloring (k ≥ 3)

### Reductions
- **Polynomial reduction**: A ≤_p B means A reduces to B in polynomial time
- If B ∈ P and A ≤_p B, then A ∈ P
- If A is NP-hard and A ≤_p B, then B is NP-hard

---

## 3. Machine Learning

### Supervised Learning
- **Linear regression**: y = Xβ + ε, minimize MSE
- **Logistic regression**: P(y=1|x) = σ(w·x + b), minimize cross-entropy
- **SVM**: Maximize margin between classes, kernel trick for non-linear
- **Decision trees**: Recursive partitioning, split criteria (Gini, entropy)
- **Random forests**: Ensemble of trees with bagging + feature sampling
- **Gradient boosting**: Sequential ensemble, each tree corrects previous errors
- **k-NN**: Classify by majority of k nearest neighbors

### Deep Learning
- **Backpropagation**: Chain rule for computing gradients through network layers
- **Activation functions**: ReLU (max(0,x)), sigmoid (1/(1+e^{-x})), softmax
- **CNN**: Convolutional layers for spatial hierarchies (images)
- **RNN/LSTM/GRU**: Sequential data, hidden state carries information
- **Transformer**: Self-attention mechanism, O(n²) attention, parallelizable
  - Attention: softmax(QK^T/√d_k)V
  - Multi-head attention: Multiple attention heads concatenated
- **Batch normalization**: Normalize activations per mini-batch
- **Dropout**: Randomly zero activations during training (regularization)

### Unsupervised Learning
- **K-means**: Iteratively assign points to nearest centroid, update centroids
- **PCA**: Project to top-k eigenvectors of covariance matrix
- **Autoencoders**: Learn compressed representation, encoder-decoder
- **GANs**: Generator vs Discriminator adversarial training

### Key Concepts
- **Bias-variance tradeoff**: Error = Bias² + Variance + Irreducible noise
- **Overfitting**: Model learns noise, high variance, low training error
- **Regularization**: L1 (Lasso, sparsity), L2 (Ridge, weight decay)
- **Cross-validation**: k-fold for model selection
- **PAC learning**: Probably Approximately Correct framework

---

## 4. Information Theory & Coding

- **Entropy**: H(X) = -Σ p(x) log₂ p(x) bits
- **Channel capacity**: C = max_{p(x)} I(X;Y)
- **Shannon's theorem**: Reliable communication possible at rate < C
- **Huffman coding**: Optimal prefix-free code (greedy)
- **Error-correcting codes**: Hamming distance, Reed-Solomon

---

## 5. Cryptography

### Symmetric
- **AES**: Block cipher, 128/192/256-bit keys, SPN structure
- **One-time pad**: Perfectly secure if key is truly random, same length as message

### Asymmetric
- **RSA**: Based on factoring difficulty, n=pq, e·d ≡ 1 (mod φ(n))
- **Diffie-Hellman**: Key exchange, based on discrete log problem
- **Elliptic Curve**: Shorter keys for equivalent security to RSA

### Hash Functions
- **Properties**: Pre-image resistance, second pre-image resistance, collision resistance
- **SHA-256**: 256-bit output, used in Bitcoin and TLS
- **Birthday paradox**: ~√(2^n) = 2^{n/2} trials to find collision in n-bit hash

---

## 6. Automata Theory & Formal Languages

### Chomsky Hierarchy
| Type | Grammar | Automaton | Example |
|---|---|---|---|
| 3 (Regular) | A→aB, A→a | Finite automaton (DFA/NFA) | a*b+ |
| 2 (Context-free) | A→αBβ | Pushdown automaton | a^n b^n |
| 1 (Context-sensitive) | αAβ→αγβ | Linear-bounded automaton | a^n b^n c^n |
| 0 (Recursively enumerable) | Any | Turing machine | Halting problem |

### Key Results
- **Pumping lemma (regular)**: If L is regular, sufficiently long strings can be "pumped"
- **Pumping lemma (CFL)**: If L is context-free, similar pumping property
- **DFA = NFA** in expressive power (but NFA can be exponentially more compact)
- **CYK algorithm**: O(n³) parsing for any CFG

---

## 7. Operating Systems & Systems

- **Process vs Thread**: Process has own address space; threads share
- **Deadlock conditions (Coffman)**: Mutual exclusion, hold-and-wait, no preemption, circular wait
- **Virtual memory**: Page tables, TLB, page replacement (LRU, FIFO, Clock)
- **Scheduling**: FCFS, SJF, Round Robin, Priority, Multilevel feedback queue
- **Consistency models**: Sequential, causal, eventual
- **CAP theorem**: Can only have 2 of 3: Consistency, Availability, Partition tolerance
