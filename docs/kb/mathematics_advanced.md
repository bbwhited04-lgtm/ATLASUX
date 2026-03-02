# Mathematics — Advanced / PhD-Level Reference

> Companion to mathematics_reference.md. Covers graduate and research-level
> topics that appear in HLE questions: algebraic geometry, representation
> theory, model theory, set theory, differential geometry, functional analysis,
> algebraic topology, analytic number theory, stochastic processes.

---

## 1. Algebraic Geometry

### Varieties and Schemes
- **Affine variety**: Zero set V(I) of ideal I ⊆ k[x₁,...,xₙ], k algebraically closed
- **Hilbert's Nullstellensatz**: I(V(J)) = √J (radical of J)
  - Weak form: Maximal ideals of k[x₁,...,xₙ] are (x₁-a₁,...,xₙ-aₙ)
- **Zariski topology**: Closed sets = algebraic sets; not Hausdorff, not intuitive
- **Scheme (Grothendieck)**: Spec(R) with structure sheaf O_X; generalizes varieties to allow nilpotents, non-algebraically closed fields, arithmetic geometry
- **Morphism of schemes**: Pair (f, f#) — continuous map + sheaf morphism
- **Projective variety**: Closed subvariety of Pⁿ, defined by homogeneous polynomials
- **Segre embedding**: P^m × P^n ↪ P^{(m+1)(n+1)-1}
- **Veronese embedding**: P^n ↪ P^N via degree-d monomials

### Sheaves and Cohomology
- **Sheaf**: Presheaf satisfying gluing and locality axioms
- **Čech cohomology**: H^i(X, F) computed from open covers
- **Derived functors**: Sheaf cohomology via injective resolutions
- **Serre duality**: H^i(X, F) ≅ H^{n-i}(X, ω_X ⊗ F^∨)^∨ for smooth projective X of dim n
- **Riemann-Roch (curves)**: l(D) - l(K-D) = deg(D) - g + 1
  - Generalizations: Hirzebruch-Riemann-Roch, Grothendieck-Riemann-Roch
- **GAGA (Serre)**: Analytic coherent sheaves on projective varieties correspond to algebraic ones

### Curves
- **Genus**: g = (d-1)(d-2)/2 for smooth plane curve of degree d
- **Riemann-Hurwitz**: 2g_Y - 2 = n(2g_X - 2) + Σ(e_P - 1) for degree-n cover Y → X
- **Jacobian**: Abelian variety of dimension g parametrizing line bundles of degree 0
- **Abel-Jacobi map**: C → Jac(C), P ↦ O(P - P₀) mod linear equivalence
- **Modulispace M_g**: 3g-3 dimensional (g ≥ 2), Deligne-Mumford compactification M̄_g

### Intersection Theory
- **Bézout's theorem**: deg(C₁ ∩ C₂) = deg(C₁)·deg(C₂) in P² (with multiplicity)
- **Chow ring**: A*(X), graded ring of algebraic cycles modulo rational equivalence
- **Chern classes**: c_i(E) ∈ A^i(X) for vector bundle E, total Chern class c(E) = Σc_i(E)

---

## 2. Algebraic Number Theory

### Number Fields
- **Number field**: Finite extension K/Q; ring of integers O_K
- **Discriminant**: Δ_K = det(σ_i(α_j))² for integral basis {α_j}
- **Dedekind domain**: O_K is a Dedekind domain — unique factorization into prime ideals
- **Ramification**: Prime p ramifies in K iff p | Δ_K
- **Splitting behavior**: p·O_K = ∏ P_i^{e_i}, Σ e_i f_i = [K:Q] where f_i = [O_K/P_i : F_p]

### Class Group and Units
- **Class group Cl(K)**: Ideal classes = fractional ideals / principal ideals; measures failure of unique factorization
- **Class number formula**: h_K = w|Δ_K|^{1/2}/(2^{r₁}(2π)^{r₂}R_K) · Res_{s=1}ζ_K(s)
- **Dirichlet's unit theorem**: O_K^× ≅ μ_K × Z^{r₁+r₂-1} (finite torsion × free part)
- **Regulator**: R_K = |det(log|σ_i(u_j)|)| for fundamental units u_j

### L-functions
- **Riemann zeta**: ζ(s) = Σ n^{-s} = ∏_p (1-p^{-s})^{-1}, Re(s) > 1
- **Functional equation**: ξ(s) = ξ(1-s) where ξ(s) = π^{-s/2}Γ(s/2)ζ(s)
- **Riemann Hypothesis**: All non-trivial zeros of ζ(s) have Re(s) = 1/2
- **Dirichlet L-functions**: L(s,χ) = Σ χ(n)n^{-s} for character χ
- **Dirichlet's theorem**: Infinitely many primes in any arithmetic progression a, a+d, a+2d,... with gcd(a,d)=1
- **Prime Number Theorem**: π(x) ~ x/ln(x), equivalently ψ(x) ~ x (Chebyshev function)
- **Dedekind zeta**: ζ_K(s) = Σ_{I⊆O_K} N(I)^{-s} = ∏_P (1-N(P)^{-s})^{-1}

### p-adic Numbers
- **p-adic valuation**: v_p(a/b) = v_p(a) - v_p(b) where v_p(p^k m) = k, gcd(m,p)=1
- **p-adic absolute value**: |x|_p = p^{-v_p(x)}
- **Q_p**: Completion of Q w.r.t. |·|_p; Z_p = {x ∈ Q_p : |x|_p ≤ 1}
- **Hensel's lemma**: Lift roots modulo p to roots in Z_p
- **Hasse-Minkowski**: Quadratic form over Q represents 0 iff it does over R and all Q_p
- **Adeles**: A_Q = R × ∏'_p Q_p (restricted product); ideles A_Q^×

### Class Field Theory
- **Artin reciprocity**: For abelian extension K/F, Gal(K/F) ≅ C_F/N_{K/F}(C_K) where C_F = A_F^×/F^×
- **Local class field theory**: Gal(K^ab/K) ≅ K̂^× for local field K
- **Kronecker-Weber**: Every abelian extension of Q is contained in a cyclotomic field

---

## 3. Representation Theory

### Finite Groups
- **Character**: χ_V(g) = Tr(ρ(g)), class function
- **Orthogonality**: (1/|G|)Σ_g χ_V(g)χ̄_W(g) = δ_{V,W} (for irreducible V,W)
- **Number of irreducibles** = number of conjugacy classes
- **Character table**: Square matrix, rows = irreps, columns = conjugacy classes
- **Regular representation**: Contains each irrep with multiplicity = dim
- **Burnside's theorem**: Group of order p^a q^b is solvable

### Lie Groups and Lie Algebras
- **Lie algebra**: Vector space with bracket [·,·] satisfying bilinearity, antisymmetry, Jacobi identity
- **Exponential map**: exp: g → G mapping Lie algebra to Lie group
- **Adjoint representation**: Ad: G → GL(g), ad: g → gl(g), ad(X)(Y) = [X,Y]
- **Killing form**: B(X,Y) = Tr(ad X ∘ ad Y); non-degenerate ⟺ g is semisimple
- **Cartan subalgebra**: Maximal abelian subalgebra of semisimple g
- **Root system**: Eigenvalues of ad(h) for h ∈ h; Dynkin diagrams classify simple Lie algebras

### Classification of Simple Lie Algebras
| Type | Dynkin Diagram | Dim | Example |
|---|---|---|---|
| A_n | ○—○—...—○ (n nodes) | n²+2n | sl(n+1) |
| B_n | ○—○—...—○⟹○ | 2n²+n | so(2n+1) |
| C_n | ○—○—...—○⟸○ | 2n²+n | sp(2n) |
| D_n | ○—○—...—○<○ (fork) | 2n²-n | so(2n) |
| E_6, E_7, E_8 | Exceptional | 78, 133, 248 | |
| F_4 | ○—○⟹○—○ | 52 | |
| G_2 | ○⟹≡○ | 14 | |

### Highest Weight Theory
- **Weight**: Eigenvalue of Cartan subalgebra action
- **Dominant integral weights**: λ with ⟨λ,α_i^∨⟩ ∈ Z_≥0 for all simple roots
- **Theorem**: Irreducible finite-dimensional representations of semisimple g ↔ dominant integral weights
- **Weyl character formula**: ch(V_λ) = Σ_{w∈W}(-1)^{l(w)} e^{w(λ+ρ)-ρ} / ∏_{α>0}(1-e^{-α})
- **Weyl dimension formula**: dim V_λ = ∏_{α>0} ⟨λ+ρ,α⟩/⟨ρ,α⟩

---

## 4. Differential Geometry

### Manifolds and Tangent Spaces
- **Smooth manifold**: Topological space with smooth atlas (compatible charts)
- **Tangent space T_pM**: Vector space of derivations at p, dim = dim M
- **Tangent bundle TM**: ∪_p T_pM, smooth manifold of dim 2n
- **Cotangent bundle T*M**: Dual; sections are 1-forms

### Differential Forms and de Rham Cohomology
- **k-form**: Section of Λ^k T*M, antisymmetric multilinear on tangent vectors
- **Exterior derivative**: d: Ω^k → Ω^{k+1}, d² = 0
- **de Rham cohomology**: H^k_dR(M) = ker(d: Ω^k → Ω^{k+1}) / im(d: Ω^{k-1} → Ω^k)
- **de Rham theorem**: H^k_dR(M) ≅ H^k(M; R) (singular cohomology)
- **Stokes' theorem**: ∫_M dω = ∫_{∂M} ω (generalizes all classical integral theorems)
- **Poincaré duality**: H^k(M) ≅ H^{n-k}(M) for closed oriented n-manifold
- **Hodge theory**: On compact Riemannian manifold, every cohomology class has unique harmonic representative: Δω = 0

### Riemannian Geometry
- **Metric tensor**: g = Σ g_{ij} dx^i ⊗ dx^j, positive definite symmetric bilinear form
- **Levi-Civita connection**: Unique torsion-free metric-compatible connection
- **Christoffel symbols**: Γ^k_{ij} = ½g^{kl}(∂_i g_{jl} + ∂_j g_{il} - ∂_l g_{ij})
- **Geodesic equation**: ẍ^k + Γ^k_{ij}ẋ^i ẋ^j = 0
- **Riemann curvature tensor**: R^l_{ijk} measures failure of parallel transport to commute
- **Ricci curvature**: R_{ij} = R^k_{ikj} (trace of Riemann tensor)
- **Scalar curvature**: R = g^{ij}R_{ij} (trace of Ricci)
- **Sectional curvature**: K(σ) = R(X,Y,Y,X)/(g(X,X)g(Y,Y)-g(X,Y)²) for plane σ spanned by X,Y
- **Gauss-Bonnet (2D)**: ∫_M K dA = 2πχ(M)
- **Gauss-Bonnet-Chern (general)**: ∫_M Pf(Ω/(2π)) = χ(M) for Pfaffian of curvature

### Fiber Bundles
- **Principal G-bundle**: P → M with fiber G, transition functions in G
- **Associated vector bundle**: P ×_G V for representation G → GL(V)
- **Connection on principal bundle**: g-valued 1-form A on P (gauge field)
- **Curvature**: F = dA + A∧A (field strength)
- **Chern-Weil theory**: Characteristic classes from invariant polynomials of curvature

---

## 5. Advanced Topology

### Homotopy Theory
- **Homotopy groups**: π_n(X, x₀) = [S^n, X]_* (based maps up to homotopy)
- **Long exact sequence of fibration**: ... → π_n(F) → π_n(E) → π_n(B) → π_{n-1}(F) → ...
- **Whitehead's theorem**: f: X → Y is a homotopy equivalence iff f_*: π_n(X) → π_n(Y) is iso for all n (for CW complexes)
- **Freudenthal suspension**: π_n(S^k) ≅ π_{n+1}(S^{k+1}) for n < 2k-1 (stable range)
- **Stable homotopy groups of spheres**: π_n^s = lim π_{n+k}(S^k) — extremely hard to compute

### Spectral Sequences
- **Serre spectral sequence**: For fibration F → E → B:
  E_2^{p,q} = H^p(B; H^q(F)) ⟹ H^{p+q}(E)
- **Adams spectral sequence**: Computes stable homotopy groups from Ext over Steenrod algebra
- **Leray-Serre**: Relates cohomology of total space to base and fiber
- **Convergence**: E_r^{p,q} → E_{r+1}^{p,q} via differentials d_r, eventually stabilizes to E_∞

### K-Theory
- **K^0(X)**: Grothendieck group of vector bundles over X
- **K^1(X)**: Defined via suspension or automorphisms
- **Bott periodicity**: K^{n+2}(X) ≅ K^n(X) (complex), K^{n+8}(X) ≅ K^n(X) (real)
- **Atiyah-Singer Index Theorem**: ind(D) = ∫_M ch(E)·Td(M) for elliptic operator D
  - Connects analytical data (kernel dimensions) to topological invariants

### Knot Theory
- **Knot invariants**: Alexander polynomial Δ(t), Jones polynomial V(q), HOMFLY-PT
- **Skein relations**: Recursive formula relating knot invariants of crossing changes
- **Knot group**: π₁(S³ \ K), fundamental group of knot complement
- **Seifert genus**: Minimum genus of spanning surface
- **Thurston's geometrization**: Knot complements decompose into geometric pieces

---

## 6. Functional Analysis

### Banach Spaces
- **Complete normed vector space**
- **Open Mapping Theorem**: Surjective bounded linear map between Banach spaces is open
- **Closed Graph Theorem**: Linear map T: X → Y between Banach spaces is bounded iff graph(T) is closed
- **Uniform Boundedness Principle (Banach-Steinhaus)**: Pointwise bounded family of operators is uniformly bounded
- **Hahn-Banach Theorem**: Bounded linear functional on subspace extends to full space preserving norm

### Hilbert Spaces
- **Complete inner product space**
- **Riesz Representation**: Every continuous linear functional on H is inner product with fixed element
- **Spectral theorem (compact self-adjoint)**: Countable orthonormal eigenbasis, eigenvalues → 0
- **Spectral theorem (unbounded self-adjoint)**: T = ∫λ dE_λ via spectral measure
- **Compact operators**: C(H) — image of unit ball has compact closure; approximable by finite-rank
- **Fredholm operators**: Finite-dimensional kernel and cokernel; index = dim ker - dim coker

### Distributions (Schwartz)
- **Distribution**: Continuous linear functional on C_c^∞ (test functions)
- **Tempered distribution**: Continuous on Schwartz space S(R^n)
- **Dirac delta**: δ(φ) = φ(0), derivative of Heaviside step function
- **Fourier transform of distributions**: Extends classical FT to distributions via duality

---

## 7. Set Theory (Advanced)

### Cardinals and Ordinals
- **Ordinal arithmetic**: α + β, α · β, α^β (not commutative)
- **Cardinal arithmetic**: ℵ_0 + ℵ_0 = ℵ_0, ℵ_0 · ℵ_0 = ℵ_0, 2^ℵ_0 = c (continuum)
- **Continuum Hypothesis**: c = ℵ_1 (independent of ZFC — Gödel/Cohen)
- **König's theorem**: cf(2^κ) > κ for all κ

### Forcing (Cohen)
- **Purpose**: Construct models of ZFC where certain statements hold/fail
- **Generic filter**: G ⊆ P intersecting all dense sets in ground model
- **Names**: P-names interpreted via G to get elements of extension M[G]
- **Key results**: CH is independent of ZFC; Martin's Axiom; Suslin's Hypothesis

### Large Cardinals
- **Inaccessible**: κ is regular, strong limit (2^λ < κ for all λ < κ)
- **Measurable**: κ admits non-principal κ-complete ultrafilter
- **Supercompact**: For every λ ≥ κ, there exists elementary embedding j: V → M with crit(j) = κ and M^λ ⊆ M
- **Consistency strength hierarchy**: ZFC < inaccessible < Mahlo < measurable < supercompact < ...

---

## 8. Stochastic Processes & Advanced Probability

### Martingales
- **Definition**: E[X_{n+1} | F_n] = X_n (fair game)
- **Optional stopping theorem**: E[X_τ] = E[X_0] under appropriate integrability conditions
- **Martingale convergence**: L¹-bounded martingale converges a.s.
- **Doob's maximal inequality**: P(max_{k≤n} X_k ≥ λ) ≤ E[X_n⁺]/λ

### Brownian Motion
- **Definition**: Continuous process, independent Gaussian increments, B_0 = 0
- **Properties**: Almost surely continuous, nowhere differentiable, B_t ~ N(0,t)
- **Itô's formula**: df(B_t) = f'(B_t)dB_t + ½f''(B_t)dt
- **Stochastic integral**: ∫₀^t f(s)dB_s — defined as L² limit of Riemann sums
- **Girsanov theorem**: Change of measure to change drift of Brownian motion

### Stochastic Calculus
- **Itô's lemma (general)**: For dX_t = μ dt + σ dB_t:
  df(t,X_t) = (f_t + μf_x + ½σ²f_{xx})dt + σf_x dB_t
- **Black-Scholes**: dS = μS dt + σS dB_t → C = SN(d₁) - Ke^{-rT}N(d₂)
- **Feynman-Kac**: Solution to certain PDEs expressed as expectations of stochastic processes
- **SDE existence/uniqueness**: Lipschitz coefficients guarantee pathwise unique strong solution

### Markov Chains (Advanced)
- **Ergodic theorem**: Time average → space average for irreducible positive-recurrent chains
- **Coupling**: Construct two copies on same probability space to meet
- **Mixing time**: Time to approach stationarity, t_mix = min{t : ||P^t(x,·) - π||_TV ≤ 1/4}
- **Spectral gap**: 1 - λ_2 where λ_2 is second-largest eigenvalue of transition matrix

---

## 9. Model Theory

### Key Concepts
- **Structure**: Domain + interpretations of function/relation/constant symbols
- **Elementary equivalence**: M ≡ N iff they satisfy same first-order sentences
- **Elementary embedding**: j: M → N preserving all first-order formulas with parameters
- **Type**: Complete consistent set of formulas with parameters
- **Saturated model**: Realizes all types over all small parameter sets
- **Quantifier elimination**: Every formula equivalent to quantifier-free formula (e.g., algebraically closed fields, real closed fields, Presburger arithmetic)

### Stability Theory (Shelah)
- **Stable theory**: Number of types over finite sets is bounded
- **Strongly minimal**: Every definable subset of M is finite or cofinite
- **Morley's theorem**: Categorical in one uncountable cardinal → categorical in all uncountable cardinals
- **Classification theorem (Shelah)**: Countable first-order theories are either "classifiable" or have maximally many models
- **Forking**: Generalized notion of algebraic independence in stable theories

---

## 10. Homological Algebra

### Chain Complexes
- **Chain complex**: ... → C_{n+1} →^{d_{n+1}} C_n →^{d_n} C_{n-1} → ..., d² = 0
- **Homology**: H_n = ker d_n / im d_{n+1}
- **Short exact sequence**: 0 → A → B → C → 0
- **Long exact sequence**: Connecting homomorphism δ: H_n(C) → H_{n-1}(A)

### Derived Functors
- **Projective resolution**: ... → P₁ → P₀ → M → 0 (P_i projective)
- **Injective resolution**: 0 → M → I⁰ → I¹ → ... (I^i injective)
- **Ext**: Right-derived functors of Hom; Ext^n(A,B) = H^n(Hom(P_•,B))
- **Tor**: Left-derived functors of ⊗; Tor_n(A,B) = H_n(P_• ⊗ B)
- **Ext^1(A,B)**: Classifies extensions 0 → B → E → A → 0

### Derived Categories
- **Derived category D(A)**: Localization of chain complexes at quasi-isomorphisms
- **Triangulated category**: Shift functor [1], distinguished triangles, octahedral axiom
- **Derived equivalence**: D^b(A) ≅ D^b(B) does NOT imply A ≅ B (Morita for derived)
