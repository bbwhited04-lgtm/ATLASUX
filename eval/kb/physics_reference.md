# Physics Reference — HLE Benchmark Knowledge Base

> 11% of HLE questions. Second highest priority.
> Covers: Classical Mechanics, Electrodynamics, Quantum Mechanics, Thermodynamics,
> Statistical Mechanics, General Relativity, Particle Physics, Astronomy

---

## 1. Classical Mechanics

### Newton's Laws
1. F = 0 ⟹ v = const (inertial frames)
2. F = dp/dt = ma (for constant mass)
3. F₁₂ = -F₂₁ (action-reaction)

### Lagrangian Mechanics
- **Lagrangian**: L = T - V (kinetic - potential energy)
- **Euler-Lagrange**: d/dt(∂L/∂q̇) - ∂L/∂q = 0
- **Noether's Theorem**: Continuous symmetry → conserved quantity
  - Time translation → energy conservation
  - Space translation → momentum conservation
  - Rotation → angular momentum conservation

### Hamiltonian Mechanics
- **Hamiltonian**: H = Σ pᵢq̇ᵢ - L (Legendre transform of L)
- **Hamilton's equations**: q̇ = ∂H/∂p, ṗ = -∂H/∂q
- **Poisson brackets**: {f,g} = Σ(∂f/∂q ∂g/∂p - ∂f/∂p ∂g/∂q)
- **Liouville's theorem**: Phase space density is conserved along trajectories

### Key Results
- **Kepler's Laws**: 1) Elliptical orbits 2) Equal areas in equal times 3) T² ∝ a³
- **Vis-viva**: v² = GM(2/r - 1/a)
- **Reduced mass**: μ = m₁m₂/(m₁+m₂)
- **Moment of inertia**: I = Σ mᵢrᵢ², parallel axis: I = I_cm + Md²

---

## 2. Electrodynamics

### Maxwell's Equations
- **Gauss (E)**: ∇·E = ρ/ε₀
- **Gauss (B)**: ∇·B = 0
- **Faraday**: ∇×E = -∂B/∂t
- **Ampère-Maxwell**: ∇×B = μ₀J + μ₀ε₀ ∂E/∂t

### Key Relations
- **Lorentz force**: F = q(E + v×B)
- **Coulomb's law**: F = kq₁q₂/r² where k = 1/(4πε₀) ≈ 8.99×10⁹ N·m²/C²
- **Biot-Savart**: dB = (μ₀/4π)(Idl×r̂)/r²
- **Poynting vector**: S = (1/μ₀)E×B (energy flux)
- **Wave equation**: ∇²E = μ₀ε₀ ∂²E/∂t², c = 1/√(μ₀ε₀)
- **Impedance of free space**: Z₀ = √(μ₀/ε₀) ≈ 377 Ω

### EM Waves
- **Speed of light**: c = 2.998×10⁸ m/s
- **Energy**: E = hf = hc/λ
- **Radiation pressure**: P = I/c (absorbed), P = 2I/c (reflected)
- **Larmor formula**: P = q²a²/(6πε₀c³) (radiated power from accelerating charge)

---

## 3. Quantum Mechanics

### Foundations
- **Schrödinger equation (time-dependent)**: iℏ∂ψ/∂t = Ĥψ
- **Schrödinger equation (time-independent)**: Ĥψ = Eψ
- **Born rule**: P(x) = |ψ(x)|²
- **Uncertainty principle**: ΔxΔp ≥ ℏ/2
- **Commutator**: [x̂,p̂] = iℏ

### Hydrogen Atom
- **Energy levels**: E_n = -13.6 eV/n²
- **Bohr radius**: a₀ = ℏ²/(me²) ≈ 0.529 Å
- **Quantum numbers**: n (principal), l (angular, 0 to n-1), m_l (-l to l), m_s (±1/2)
- **Degeneracy**: 2n² states at level n

### Angular Momentum
- **Orbital**: L² eigenvalues = ℏ²l(l+1), L_z eigenvalues = ℏm_l
- **Spin**: S² eigenvalues = ℏ²s(s+1), S_z eigenvalues = ℏm_s
- **Addition**: |j₁-j₂| ≤ j ≤ j₁+j₂ (Clebsch-Gordan)
- **Pauli matrices**: σ_x = [[0,1],[1,0]], σ_y = [[0,-i],[i,0]], σ_z = [[1,0],[0,-1]]

### Perturbation Theory
- **First-order energy**: E_n^(1) = ⟨n|H'|n⟩
- **First-order state**: |n^(1)⟩ = Σ_{m≠n} ⟨m|H'|n⟩/(E_n-E_m) |m⟩
- **Fermi's Golden Rule**: Γ = (2π/ℏ)|⟨f|H'|i⟩|²ρ(E_f) (transition rate)
- **Selection rules (dipole)**: Δl = ±1, Δm = 0,±1

### Key Systems
- **Harmonic oscillator**: E_n = ℏω(n + 1/2), [â,â†] = 1
- **Infinite square well**: E_n = n²π²ℏ²/(2mL²)
- **Particle in a box (3D)**: E = (π²ℏ²/(2m))(n_x²/L_x² + n_y²/L_y² + n_z²/L_z²)
- **Tunneling**: T ∝ exp(-2κd) where κ = √(2m(V₀-E))/ℏ

---

## 4. Thermodynamics & Statistical Mechanics

### Laws of Thermodynamics
- **0th**: Thermal equilibrium is transitive
- **1st**: dU = δQ - δW (energy conservation)
- **2nd**: dS ≥ δQ/T (entropy increases in isolated system)
- **3rd**: S → 0 as T → 0

### Key Relations
- **Ideal gas**: PV = nRT = NkT
- **Entropy**: S = k_B ln Ω (Boltzmann), S = -k_B Σ p_i ln p_i (Gibbs)
- **Free energies**: F = U - TS (Helmholtz), G = H - TS (Gibbs), H = U + PV (Enthalpy)
- **Maxwell relations**: (∂T/∂V)_S = -(∂P/∂S)_V, etc.
- **Equipartition**: ⟨E⟩ = (f/2)kT per degree of freedom f

### Statistical Ensembles
- **Microcanonical**: Fixed E, S = k_B ln Ω
- **Canonical**: Fixed T, Z = Σ e^{-βE_i}, F = -kT ln Z
- **Grand canonical**: Fixed T and μ, Z = Σ e^{-β(E_i - μN_i)}

### Distributions
- **Maxwell-Boltzmann**: f(v) = 4π(m/(2πkT))^{3/2} v² exp(-mv²/(2kT))
- **Fermi-Dirac**: f(E) = 1/(e^{(E-μ)/(kT)} + 1) (fermions)
- **Bose-Einstein**: f(E) = 1/(e^{(E-μ)/(kT)} - 1) (bosons)
- **Planck's law**: B(ν,T) = (2hν³/c²)/(e^{hν/(kT)} - 1)

---

## 5. Special & General Relativity

### Special Relativity
- **Lorentz factor**: γ = 1/√(1 - v²/c²)
- **Time dilation**: Δt = γΔt₀
- **Length contraction**: L = L₀/γ
- **Energy-momentum**: E² = (pc)² + (mc²)², E = γmc²
- **Relativistic momentum**: p = γmv
- **Doppler**: f_obs = f_src √((1+β)/(1-β)) (approaching)
- **4-velocity**: u^μ = (γc, γv)
- **Invariant interval**: ds² = -c²dt² + dx² + dy² + dz²

### General Relativity
- **Einstein field equation**: G_μν + Λg_μν = (8πG/c⁴)T_μν
- **Schwarzschild radius**: r_s = 2GM/c²
- **Gravitational redshift**: 1+z = 1/√(1 - r_s/r)
- **Geodesic equation**: d²x^μ/dτ² + Γ^μ_αβ (dx^α/dτ)(dx^β/dτ) = 0
- **Friedmann equation**: (ȧ/a)² = (8πG/3)ρ - kc²/a² + Λc²/3

---

## 6. Particle Physics & Standard Model

### Fundamental Forces
| Force | Mediator | Relative Strength | Range |
|---|---|---|---|
| Strong | Gluon (8) | 1 | ~10⁻¹⁵ m |
| Electromagnetic | Photon | 1/137 | ∞ |
| Weak | W±, Z⁰ | 10⁻⁶ | ~10⁻¹⁸ m |
| Gravity | Graviton? | 10⁻³⁹ | ∞ |

### Quarks (6 flavors)
| Quark | Charge | Mass |
|---|---|---|
| Up (u) | +2/3 | ~2.2 MeV |
| Down (d) | -1/3 | ~4.7 MeV |
| Charm (c) | +2/3 | ~1.27 GeV |
| Strange (s) | -1/3 | ~96 MeV |
| Top (t) | +2/3 | ~173 GeV |
| Bottom (b) | -1/3 | ~4.18 GeV |

### Leptons (6)
| Lepton | Charge | Mass |
|---|---|---|
| Electron (e) | -1 | 0.511 MeV |
| Muon (μ) | -1 | 105.7 MeV |
| Tau (τ) | -1 | 1776.9 MeV |
| ν_e, ν_μ, ν_τ | 0 | < 1 eV |

### Conservation Laws
- Electric charge, baryon number, lepton number (each family)
- Color charge (strong interactions)
- CPT symmetry (always conserved)
- CP violation observed in K and B meson systems

### Key Particles
- Proton: uud, charge +1, mass 938.3 MeV, stable
- Neutron: udd, charge 0, mass 939.6 MeV, τ ≈ 880 s
- Higgs boson: mass ≈ 125.1 GeV, spin 0

---

## 7. Fundamental Constants

| Constant | Symbol | Value |
|---|---|---|
| Speed of light | c | 2.998 × 10⁸ m/s |
| Planck's constant | h | 6.626 × 10⁻³⁴ J·s |
| Reduced Planck | ℏ | 1.055 × 10⁻³⁴ J·s |
| Boltzmann constant | k_B | 1.381 × 10⁻²³ J/K |
| Gravitational constant | G | 6.674 × 10⁻¹¹ N·m²/kg² |
| Elementary charge | e | 1.602 × 10⁻¹⁹ C |
| Electron mass | m_e | 9.109 × 10⁻³¹ kg |
| Proton mass | m_p | 1.673 × 10⁻²⁷ kg |
| Avogadro's number | N_A | 6.022 × 10²³ /mol |
| Gas constant | R | 8.314 J/(mol·K) |
| Permittivity | ε₀ | 8.854 × 10⁻¹² F/m |
| Permeability | μ₀ | 4π × 10⁻⁷ T·m/A |
| Fine structure | α | ≈ 1/137.036 |
| Stefan-Boltzmann | σ | 5.670 × 10⁻⁸ W/(m²·K⁴) |

---

## 8. Astronomy & Astrophysics

### Stellar Physics
- **Hertzsprung-Russell diagram**: Luminosity vs temperature, main sequence L ∝ M^3.5
- **Stellar lifetime**: τ ∝ M/L ∝ M^{-2.5} (main sequence)
- **Chandrasekhar limit**: 1.4 M☉ (white dwarf upper mass)
- **Tolman-Oppenheimer-Volkoff limit**: ~2-3 M☉ (neutron star upper mass)
- **Eddington luminosity**: L_Edd = 4πGMc/κ (radiation pressure = gravity)

### Cosmology
- **Hubble's Law**: v = H₀d, H₀ ≈ 70 km/s/Mpc
- **Cosmological redshift**: 1+z = a₀/a(t)
- **CMB temperature**: T ≈ 2.725 K
- **Age of universe**: ~13.8 Gyr
- **Composition**: ~68% dark energy, ~27% dark matter, ~5% baryonic matter

### Magnitudes
- **Apparent magnitude**: m = -2.5 log₁₀(F/F₀)
- **Absolute magnitude**: M (magnitude at 10 pc)
- **Distance modulus**: m - M = 5 log₁₀(d/10pc)
- **Luminosity-distance**: d_L = d(1+z) for cosmological sources
