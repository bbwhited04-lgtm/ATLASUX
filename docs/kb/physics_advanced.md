# Physics — Advanced / PhD-Level Reference

> Companion to physics_reference.md. Covers graduate and research-level
> topics: Quantum Field Theory, Condensed Matter, General Relativity (advanced),
> Statistical Mechanics (advanced), AMO Physics, Nuclear/Particle Physics

---

## 1. Quantum Field Theory

### Canonical Quantization
- **Free scalar field**: φ(x) = ∫ d³k/(2π)³ 1/√(2ω_k) [a_k e^{-ikx} + a_k† e^{ikx}]
- **Commutation**: [a_k, a_{k'}†] = (2π)³δ³(k-k')
- **Propagator (Feynman)**: ⟨0|T{φ(x)φ(y)}|0⟩ = ∫ d⁴k/(2π)⁴ · i/(k²-m²+iε)
- **Wick's theorem**: Time-ordered products = sum of all contractions (normal-ordered + propagators)
- **LSZ reduction**: S-matrix elements from amputated Green's functions

### Path Integral Formulation
- **Partition function**: Z = ∫ Dφ exp(iS[φ]/ℏ)
- **Generating functional**: Z[J] = ∫ Dφ exp(i∫(L + Jφ)d⁴x)
- **Connected diagrams**: W[J] = -i ln Z[J]
- **Effective action (1PI)**: Γ[φ_cl] = W[J] - ∫ Jφ_cl d⁴x (Legendre transform)

### Renormalization
- **UV divergences**: Loop integrals diverge at high momenta
- **Regularization**: Dimensional regularization (d = 4-ε), cutoff, Pauli-Villars
- **Counterterms**: Absorb infinities into redefined parameters (mass, coupling, field strength)
- **Renormalizable theories**: Only finitely many counterterm structures needed
  - QED: renormalizable; QCD: renormalizable; Gravity: non-renormalizable
- **Renormalization group**: β(g) = μ dg/dμ describes running of coupling
  - QCD: β < 0 (asymptotic freedom), coupling decreases at high energy
  - QED: β > 0, coupling increases at high energy (Landau pole)
- **Wilsonian RG**: Integrate out high-momentum modes successively; effective theory at each scale
- **Callan-Symanzik equation**: [μ∂/∂μ + β∂/∂g + nγ]G^(n) = 0

### Gauge Theories
- **Local gauge invariance**: ψ(x) → e^{iα(x)T^a}ψ(x), requires covariant derivative D_μ = ∂_μ - igA_μ^a T^a
- **Yang-Mills**: Non-abelian gauge theory, L = -¼F^a_{μν}F^{aμν} + ψ̄(iD̸-m)ψ
- **Field strength**: F^a_{μν} = ∂_μA^a_ν - ∂_νA^a_μ + gf^{abc}A^b_μA^c_ν
- **Faddeev-Popov ghosts**: Required for consistent path integral quantization of gauge theories
- **BRST symmetry**: Global symmetry of gauge-fixed + ghost action, ensures unitarity
- **Anomalies**: Classical symmetries broken by quantum effects
  - Chiral anomaly (ABJ): ∂_μj^μ_5 = (e²/16π²)F_{μν}F̃^{μν}
  - Anomaly cancellation: Essential for consistency of Standard Model

### QED
- **Lagrangian**: L = -¼F_{μν}F^{μν} + ψ̄(iD̸-m)ψ
- **Vertex factor**: -ieγ^μ
- **Electron self-energy**: Mass and wave-function renormalization
- **Vacuum polarization**: Running of α; α(M_Z) ≈ 1/128
- **Anomalous magnetic moment**: g-2 = α/π + O(α²) + ... (Schwinger)
- **Lamb shift**: 2S₁/₂ - 2P₁/₂ splitting in hydrogen from QED loop corrections

### QCD
- **Gauge group**: SU(3)_color with 8 gluons
- **Asymptotic freedom**: Coupling α_s decreases at high energy (Gross, Politzer, Wilczek)
- **Confinement**: Quarks and gluons cannot be isolated (not proven rigorously — Millennium Prize)
- **Chiral symmetry breaking**: ⟨ψ̄ψ⟩ ≠ 0, gives constituent quark masses, pions as pseudo-Goldstone bosons
- **ΛQCD ≈ 200 MeV**: Scale where α_s becomes strong
- **Lattice QCD**: Non-perturbative numerical computation on spacetime lattice

### Electroweak Theory
- **Gauge group**: SU(2)_L × U(1)_Y → U(1)_EM after symmetry breaking
- **Higgs mechanism**: ⟨φ⟩ ≠ 0 breaks gauge symmetry, gives mass to W±, Z⁰
  - W mass: M_W = gv/2 ≈ 80.4 GeV, Z mass: M_Z = M_W/cos θ_W ≈ 91.2 GeV
  - v = 246 GeV (Higgs VEV)
- **Weinberg angle**: sin²θ_W ≈ 0.231
- **CKM matrix**: Quark flavor mixing, parametrized by 3 angles + 1 CP phase
- **PMNS matrix**: Neutrino flavor mixing (confirmed by oscillation experiments)
- **Neutrino oscillations**: P(ν_α→ν_β) = sin²(2θ)sin²(Δm²L/4E)

---

## 2. Condensed Matter Physics

### Band Theory
- **Bloch's theorem**: ψ_{nk}(r) = e^{ik·r}u_{nk}(r), u periodic
- **Brillouin zone**: Primitive cell of reciprocal lattice, contains all distinct k
- **Band gap**: Energy gap between valence and conduction bands
  - Metal: bands overlap or partially filled
  - Semiconductor: small gap (Si: 1.1 eV, GaAs: 1.4 eV)
  - Insulator: large gap (> 3 eV)
- **Density of states**: g(E) = dN/dE, determines thermodynamic properties
- **Fermi surface**: Constant-energy surface at E_F in k-space

### Transport
- **Drude model**: σ = ne²τ/m (classical conductivity)
- **Boltzmann transport**: f(r,k,t) distribution function, collisions via relaxation time
- **Hall effect**: R_H = 1/(nec), determines carrier sign and density
- **Quantum Hall effect**: σ_xy = νe²/h, ν = integer (IQHE) or fraction (FQHE)
  - Laughlin wavefunction (ν=1/m): Ψ = ∏_{i<j}(z_i-z_j)^m exp(-Σ|z_i|²/4l²)
  - Topological invariant: Chern number classifies quantized Hall conductance (TKNN)

### Superconductivity
- **BCS theory**: Cooper pairs (k↑, -k↓) form condensate below T_c
  - Gap equation: Δ = V·g(E_F)·Δ·∫ tanh(E/(2kT))/(2E) dε
  - Δ(0) ≈ 1.76 kT_c (weak coupling)
- **Meissner effect**: B = 0 inside superconductor (perfect diamagnetism)
- **London penetration depth**: λ = √(m/(μ₀ne²))
- **Ginzburg-Landau**: F = F_n + α|ψ|² + β|ψ|⁴/2 + |(ℏ/2m*∇-eA)ψ|²/(2m*) + B²/(2μ₀)
  - Type I: κ = λ/ξ < 1/√2, abrupt transition
  - Type II: κ > 1/√2, mixed state with vortex lattice (H_{c1} < H < H_{c2})
- **Josephson effect**: I = I_c sin(Δφ) (DC), V = (ℏ/2e)dΔφ/dt (AC)
- **High-T_c**: Cuprates (YBa₂Cu₃O₇, T_c ≈ 93 K), iron pnictides, mechanism debated

### Magnetism
- **Heisenberg model**: H = -J Σ_{<ij>} S_i · S_j
  - J > 0: ferromagnetic, J < 0: antiferromagnetic
- **Ising model**: H = -J Σ σ_iσ_j (σ = ±1), exact solution in 2D (Onsager)
- **Curie-Weiss**: χ = C/(T - T_c) above transition
- **Spin waves (magnons)**: ω = Dk² (ferromagnet), ω = c|k| (antiferromagnet)
- **Kondo effect**: Anomalous resistivity minimum from magnetic impurity scattering

### Topological Phases
- **Topological insulator**: Bulk gap + topologically protected surface states
  - Z₂ invariant classifies 2D and 3D topological insulators
  - Surface: single Dirac cone, no backscattering from non-magnetic impurities
- **Berry phase**: γ = ∮ A·dk where A_n = i⟨n|∇_k|n⟩ (Berry connection)
- **Chern number**: C = (1/2π)∫_BZ F dk_x dk_y (Berry curvature integral)
- **Weyl semimetal**: Linear crossing of bands, chiral anomaly in solid state

### Strongly Correlated Systems
- **Hubbard model**: H = -t Σ c†_iσ c_jσ + U Σ n_i↑n_i↓
  - Half-filling + large U → Mott insulator
- **Luttinger liquid**: 1D interacting fermions, no quasiparticles, power-law correlations
- **Fractional quantum Hall**: Anyonic excitations (neither bosons nor fermions)
  - Topological order: ground state degeneracy depends on topology
- **Heavy fermion**: Large effective mass from Kondo lattice, m* ~ 100-1000 m_e

---

## 3. General Relativity (Advanced)

### Differential Geometry for GR
- **Metric signature**: (-,+,+,+) (mostly plus convention)
- **Covariant derivative**: ∇_μ V^ν = ∂_μV^ν + Γ^ν_{μλ}V^λ
- **Riemann tensor**: R^ρ_{σμν} = ∂_μΓ^ρ_{νσ} - ∂_νΓ^ρ_{μσ} + Γ^ρ_{μλ}Γ^λ_{νσ} - Γ^ρ_{νλ}Γ^λ_{μσ}
- **Bianchi identity**: ∇_{[λ}R^ρ_{σ]μν} = 0 → ∇_μG^{μν} = 0 (conservation)
- **Weyl tensor**: Traceless part of Riemann, measures tidal forces; vanishes iff conformally flat

### Exact Solutions
- **Schwarzschild**: ds² = -(1-r_s/r)dt² + (1-r_s/r)^{-1}dr² + r²dΩ², r_s = 2GM/c²
  - Event horizon at r = r_s; singularity at r = 0
- **Kerr**: Rotating black hole, parametrized by M and J (angular momentum)
  - Ergosphere: region where frame dragging forces co-rotation
  - Penrose process: Extract energy from ergosphere
  - Kerr bound: a = J/M ≤ M (extremal Kerr at a = M)
- **Reissner-Nordström**: Charged BH, two horizons for Q < M
- **Kerr-Newman**: Most general stationary BH (M, J, Q) — uniqueness theorems
- **de Sitter/anti-de Sitter**: Maximally symmetric spacetimes with Λ > 0 / Λ < 0
- **FLRW**: ds² = -dt² + a(t)²[dr²/(1-kr²) + r²dΩ²], k = -1, 0, +1

### Black Hole Thermodynamics
- **Bekenstein-Hawking entropy**: S = A/(4l_P²) = kA c³/(4Gℏ)
- **Hawking temperature**: T = ℏc³/(8πGMk_B) = ℏκ/(2πck_B) where κ = surface gravity
- **Four laws**: 0th: κ constant on horizon; 1st: dM = (κ/8πG)dA + ΩdJ + ΦdQ; 2nd: δA ≥ 0; 3rd: κ → 0 unattainable
- **Information paradox**: Hawking radiation appears thermal → unitarity violation? (active research)
- **Penrose diagrams**: Conformal diagrams showing causal structure at infinity

### Gravitational Waves
- **Linearized gravity**: g_{μν} = η_{μν} + h_{μν}, |h| << 1
- **Wave equation**: □h̄_{μν} = -16πGT_{μν}/c⁴ (Lorenz gauge)
- **Polarizations**: h_+ and h_× (two independent transverse-traceless modes)
- **Quadrupole formula**: P = (G/5c⁵)⟨I⃛_{ij}I⃛^{ij}⟩ (radiated power)
- **LIGO detection (2015)**: GW150914, binary BH merger, confirmed GR prediction
- **Chirp mass**: M_c = (m₁m₂)^{3/5}/(m₁+m₂)^{1/5}, determines frequency evolution

### Cosmology (Advanced)
- **Friedmann equations**: H² = 8πGρ/3 - k/a² + Λ/3; ä/a = -4πG(ρ+3p)/3 + Λ/3
- **Equation of state**: w = p/ρ (matter: w=0, radiation: w=1/3, Λ: w=-1)
- **Critical density**: ρ_c = 3H²/(8πG)
- **Density parameters**: Ω_m + Ω_r + Ω_Λ + Ω_k = 1
- **Inflation**: Exponential expansion solves horizon, flatness, monopole problems
  - Slow-roll: ε = (M_P²/2)(V'/V)² << 1, η = M_P²(V''/V) << 1
  - Generates nearly scale-invariant primordial perturbations (confirmed by CMB)
- **CMB anisotropies**: ΔT/T ~ 10⁻⁵, acoustic peaks, Sachs-Wolfe effect
  - Power spectrum C_l encodes cosmological parameters
  - Planck results: Ω_bh² ≈ 0.0224, Ω_ch² ≈ 0.120, H₀ ≈ 67.4 km/s/Mpc, n_s ≈ 0.965
- **Dark energy**: w ≈ -1, consistent with cosmological constant, ~68% of energy density
- **Structure formation**: Linear perturbation theory, Jeans instability, transfer function, matter power spectrum P(k)

---

## 4. Statistical Mechanics (Advanced)

### Phase Transitions and Critical Phenomena
- **Landau theory**: F = F₀ + a(T-T_c)φ² + bφ⁴ + ... (order parameter expansion)
- **Critical exponents**: α (specific heat), β (order parameter), γ (susceptibility), δ (critical isotherm), η (correlation function), ν (correlation length)
  - Mean field: β=1/2, γ=1, ν=1/2, η=0, α=0(disc), δ=3
  - 3D Ising: β≈0.326, γ≈1.237, ν≈0.630
- **Universality**: Critical exponents depend only on dimension and symmetry, not microscopic details
- **Scaling relations**: α + 2β + γ = 2 (Rushbrooke), γ = ν(2-η) (Fisher), hyperscaling: dν = 2-α
- **Renormalization group**: Wilson's approach — coarse-grain, rescale, renormalize
  - Fixed points determine universality classes
  - Relevant/irrelevant operators near fixed point
  - Upper critical dimension: d_c = 4 for Ising (mean field exact above d_c)
- **Kosterlitz-Thouless**: Topological transition in 2D XY model, vortex unbinding

### Quantum Statistical Mechanics
- **Second quantization**: Creation/annihilation operators for many-body systems
- **Green's functions**: G(k,ω) = single-particle propagator, spectral function A(k,ω)
- **Matsubara formalism**: Imaginary time τ ∈ [0,β], frequencies ω_n = 2nπT (bosons), (2n+1)πT (fermions)
- **BEC**: Below T_c = 2πℏ²/(mk_B)(n/ζ(3/2))^{2/3}, macroscopic occupation of ground state
- **Superfluidity**: Landau criterion: v_s < min(ε(p)/p) for superflow stability
- **Feynman diagrams (finite-T)**: Same as QFT but with Matsubara frequencies

### Non-equilibrium Statistical Mechanics
- **Fluctuation-dissipation theorem**: Response function related to equilibrium correlations
  - χ''(ω) = (1-e^{-βω})/2 · S(ω)
- **Boltzmann equation**: ∂f/∂t + v·∇f + F·∂f/∂p = C[f] (collision integral)
- **Linear response (Kubo)**: σ(ω) related to current-current correlation function
- **Onsager reciprocal relations**: L_{ij} = L_{ji} for transport coefficients

---

## 5. Atomic, Molecular, and Optical (AMO) Physics

### Atomic Structure (Beyond Hydrogen)
- **Hartree-Fock**: Self-consistent field method for multi-electron atoms
- **Configuration interaction**: Linear combination of Slater determinants
- **LS coupling (Russell-Saunders)**: L = Σl_i, S = Σs_i, J = L+S (light atoms)
- **jj coupling**: j_i = l_i + s_i first, then J = Σj_i (heavy atoms)
- **Term symbols**: ²ˢ⁺¹L_J (e.g., ³P₂ for ground state of oxygen)
- **Hund's rules**: (1) Maximize S, (2) Maximize L, (3) J = |L-S| if shell < half-full, J = L+S if > half-full

### Laser Physics
- **Stimulated emission**: Rate = B₂₁ρ(ν)N₂ (Einstein B coefficient)
- **Population inversion**: N₂ > N₁ required for lasing
- **Rate equations**: dN₂/dt = R_pump - N₂/τ₂ - B₂₁ρN₂ + B₁₂ρN₁
- **Cavity modes**: Standing waves, mode spacing Δν = c/(2L)
- **Q-factor**: Q = 2πν₀E/P_loss (energy stored/dissipated per cycle)
- **Mode-locking**: Ultrashort pulses, Δt ≈ 1/Δν_bandwidth

### Quantum Optics
- **Coherent states**: |α⟩ = e^{-|α|²/2} Σ (α^n/√n!)|n⟩, minimum uncertainty
- **Squeezed states**: Reduced noise in one quadrature below vacuum level
- **Photon statistics**: Poisson (coherent), super-Poisson (thermal), sub-Poisson (non-classical)
- **Hong-Ou-Mandel effect**: Two indistinguishable photons on beam splitter always exit together
- **Jaynes-Cummings model**: H = ℏω_c a†a + ½ℏω_a σ_z + ℏg(aσ_+ + a†σ_-) (atom-cavity)
- **Cavity QED**: Strong coupling g > κ, γ (cavity decay, atomic decay)

### Ultracold Atoms
- **Laser cooling**: Doppler limit T_D = ℏΓ/(2k_B), sub-Doppler: Sisyphus, sub-recoil
- **Magneto-optical trap (MOT)**: Combines laser cooling + magnetic trapping
- **BEC in dilute gases**: 1995 (Cornell, Wieman — Rb; Ketterle — Na)
  - Gross-Pitaevskii equation: iℏ∂ψ/∂t = (-ℏ²∇²/(2m) + V + g|ψ|²)ψ
- **Optical lattices**: Standing wave creates periodic potential for atoms, simulates condensed matter
- **Feshbach resonance**: Tune interactions via magnetic field near molecular bound state

---

## 6. Nuclear Physics

### Nuclear Structure
- **Shell model**: Magic numbers (2, 8, 20, 28, 50, 82, 126) from spin-orbit splitting
- **Liquid drop model**: B = a_V A - a_S A^{2/3} - a_C Z(Z-1)/A^{1/3} - a_A(N-Z)²/A ± δ(A)
  - Semi-empirical mass formula (Bethe-Weizsäcker)
- **Deformed nuclei**: Prolate/oblate shapes, rotational bands
- **Collective excitations**: Giant dipole resonance, quadrupole vibrations

### Nuclear Reactions
- **Cross section**: σ = reaction rate / (flux × target density)
- **Compound nucleus**: Intermediate state, decays independently of formation
- **Direct reactions**: Fast, peripheral (stripping, pickup, knockout)
- **Fusion**: Coulomb barrier ~ Z₁Z₂e²/(R₁+R₂), overcome by tunneling at stellar energies
  - pp chain: 4p → ⁴He + 2e⁺ + 2ν_e + 26.7 MeV (Sun)
  - CNO cycle: Dominant for M > 1.3M☉
- **Fission**: Spontaneous or neutron-induced, Q ~ 200 MeV per event
  - Criticality: k = neutrons in gen(n+1)/gen(n), k=1 critical

### Particle Physics (Beyond Standard Model)
- **Hierarchy problem**: Why M_Higgs << M_Planck? Radiative corrections drive it up
- **Supersymmetry (SUSY)**: Each particle has superpartner differing by spin ½
  - Solves hierarchy problem, provides dark matter candidate (neutralino)
  - Not yet observed at LHC
- **Grand Unified Theories**: SU(5), SO(10) unifying SU(3)×SU(2)×U(1) at ~10¹⁶ GeV
- **String theory**: 1D extended objects, requires extra dimensions (10D or 11D)
  - Types: I, IIA, IIB, heterotic SO(32), heterotic E₈×E₈
  - M-theory: 11D, unifies all five string theories
- **AdS/CFT (Maldacena)**: Duality between gravity in AdS_{d+1} and CFT on d-dim boundary
  - Strongest form: Type IIB on AdS₅ × S⁵ ↔ N=4 SYM in 4D
  - Applications: Strong coupling in QCD, condensed matter, quantum information
