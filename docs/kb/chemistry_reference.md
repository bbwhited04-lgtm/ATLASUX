# Chemistry Reference — HLE Benchmark Knowledge Base

> 6% of HLE questions.
> Covers: General Chemistry, Organic Chemistry, Inorganic Chemistry,
> Physical Chemistry, Analytical Chemistry, Biochemistry

---

## 1. Atomic Structure & Periodicity

### Quantum Numbers
- **n** (principal): 1, 2, 3, ... — energy level, shell size
- **l** (angular): 0 to n-1 — orbital shape (s=0, p=1, d=2, f=3)
- **m_l** (magnetic): -l to +l — orbital orientation
- **m_s** (spin): ±1/2

### Electron Configuration Rules
- **Aufbau**: Fill lowest energy orbitals first (1s 2s 2p 3s 3p 4s 3d ...)
- **Pauli exclusion**: No two electrons share all four quantum numbers
- **Hund's rule**: Maximize spin in degenerate orbitals before pairing
- **Exceptions**: Cr = [Ar]3d⁵4s¹ (half-filled d stability), Cu = [Ar]3d¹⁰4s¹

### Periodic Trends
| Property | Across Period (→) | Down Group (↓) |
|---|---|---|
| Atomic radius | Decreases | Increases |
| Ionization energy | Increases | Decreases |
| Electronegativity | Increases | Decreases |
| Electron affinity | Increases (generally) | Decreases |
| Metallic character | Decreases | Increases |

---

## 2. Chemical Bonding

### Bond Types
- **Ionic**: Transfer of electrons (ΔEN > 1.7 typically), lattice structures
- **Covalent**: Sharing of electrons (ΔEN < 1.7), molecular/network
- **Metallic**: Electron sea model, delocalized electrons
- **Hydrogen bond**: H bonded to F, O, N interacting with lone pair (~5-30 kJ/mol)
- **Van der Waals**: London dispersion (instantaneous dipoles), dipole-dipole

### VSEPR Theory
| Electron Pairs | Molecular Geometry | Bond Angle | Example |
|---|---|---|---|
| 2 | Linear | 180° | CO₂ |
| 3 | Trigonal planar | 120° | BF₃ |
| 4 | Tetrahedral | 109.5° | CH₄ |
| 5 | Trigonal bipyramidal | 90°/120° | PCl₅ |
| 6 | Octahedral | 90° | SF₆ |
| 3 (1 lone pair) | Bent | ~117° | SO₂ |
| 4 (1 lone pair) | Trigonal pyramidal | ~107° | NH₃ |
| 4 (2 lone pairs) | Bent | ~104.5° | H₂O |

### Molecular Orbital Theory
- σ and σ* (bonding and antibonding from head-on overlap)
- π and π* (from lateral overlap)
- **Bond order** = (bonding e⁻ - antibonding e⁻) / 2
- O₂ is paramagnetic (2 unpaired e⁻ in π* orbitals) — explained by MO, not Lewis

### Hybridization
| Hybridization | Geometry | Example |
|---|---|---|
| sp | Linear | BeCl₂, C₂H₂ |
| sp² | Trigonal planar | BF₃, C₂H₄ |
| sp³ | Tetrahedral | CH₄, NH₃ |
| sp³d | Trigonal bipyramidal | PCl₅ |
| sp³d² | Octahedral | SF₆ |

---

## 3. Thermodynamics & Kinetics

### Thermodynamic Quantities
- **Enthalpy (H)**: Heat content at constant pressure, ΔH = q_p
- **Entropy (S)**: Disorder/microstates, ΔS_univ > 0 for spontaneous
- **Gibbs free energy**: ΔG = ΔH - TΔS
  - ΔG < 0: spontaneous
  - ΔG = 0: equilibrium
  - ΔG > 0: non-spontaneous
- **Standard conditions**: 25°C (298 K), 1 atm, 1 M

### Hess's Law
- ΔH_rxn = Σ ΔH_f°(products) - Σ ΔH_f°(reactants)
- Path independent — enthalpy is a state function

### Chemical Kinetics
- **Rate law**: Rate = k[A]^m[B]^n (determined experimentally)
- **Integrated rate laws**:
  - Zero order: [A] = [A]₀ - kt, t₁/₂ = [A]₀/(2k)
  - First order: ln[A] = ln[A]₀ - kt, t₁/₂ = ln(2)/k
  - Second order: 1/[A] = 1/[A]₀ + kt, t₁/₂ = 1/(k[A]₀)
- **Arrhenius equation**: k = A·e^(-Ea/RT)
  - ln(k₂/k₁) = (Ea/R)(1/T₁ - 1/T₂)
- **Transition state theory**: Reactants → activated complex → products
- **Catalysts**: Lower Ea, not consumed, don't change ΔG

---

## 4. Equilibrium

### Law of Mass Action
- K_eq = [products]^coefficients / [reactants]^coefficients
- **K_p** = K_c(RT)^Δn for gas-phase reactions
- Pure solids and liquids excluded from expression

### Le Chatelier's Principle
- Add reactant → shift right (toward products)
- Remove product → shift right
- Increase T: shifts toward endothermic direction
- Increase P: shifts toward fewer moles of gas
- Catalyst: no effect on equilibrium position

### Acid-Base Equilibria
- **pH** = -log[H⁺], **pOH** = -log[OH⁻], pH + pOH = 14 (at 25°C)
- **Ka × Kb = Kw** = 1.0 × 10⁻¹⁴ (at 25°C)
- **Henderson-Hasselbalch**: pH = pKa + log([A⁻]/[HA])
- **Buffer**: Weak acid + conjugate base, resists pH change
- **Strong acids**: HCl, HBr, HI, HNO₃, H₂SO₄, HClO₃, HClO₄
- **Strong bases**: Group 1 hydroxides, Ca(OH)₂, Sr(OH)₂, Ba(OH)₂

### Solubility
- **K_sp** = [cation]^m[anion]^n for dissolution equilibrium
- **Common ion effect**: Shared ion decreases solubility
- **Q vs K_sp**: Q > K_sp → precipitate forms

---

## 5. Electrochemistry

### Key Equations
- **Standard cell potential**: E°_cell = E°_cathode - E°_anode
- **Nernst equation**: E = E° - (RT/nF)ln(Q) = E° - (0.0592/n)log(Q) at 25°C
- **ΔG° = -nFE°** (links thermodynamics to electrochemistry)
- **Faraday's constant**: F = 96,485 C/mol e⁻

### Electrochemical Cells
- **Galvanic (voltaic)**: Spontaneous reaction (E° > 0, ΔG < 0)
  - Anode = oxidation (−), Cathode = reduction (+)
- **Electrolytic**: Non-spontaneous, requires external voltage
  - Anode = oxidation (+), Cathode = reduction (−)

### Standard Reduction Potentials (selected)
| Half-Reaction | E° (V) |
|---|---|
| F₂ + 2e⁻ → 2F⁻ | +2.87 |
| Au³⁺ + 3e⁻ → Au | +1.50 |
| Ag⁺ + e⁻ → Ag | +0.80 |
| Cu²⁺ + 2e⁻ → Cu | +0.34 |
| 2H⁺ + 2e⁻ → H₂ | 0.00 (ref) |
| Fe²⁺ + 2e⁻ → Fe | -0.44 |
| Zn²⁺ + 2e⁻ → Zn | -0.76 |
| Al³⁺ + 3e⁻ → Al | -1.66 |
| Li⁺ + e⁻ → Li | -3.04 |

---

## 6. Organic Chemistry

### Functional Groups
| Group | Formula | Example |
|---|---|---|
| Alkane | C-C | Ethane (C₂H₆) |
| Alkene | C=C | Ethylene (C₂H₄) |
| Alkyne | C≡C | Acetylene (C₂H₂) |
| Alcohol | -OH | Ethanol |
| Aldehyde | -CHO | Acetaldehyde |
| Ketone | -CO- | Acetone |
| Carboxylic acid | -COOH | Acetic acid |
| Ester | -COO- | Ethyl acetate |
| Amine | -NH₂ | Methylamine |
| Amide | -CONH₂ | Acetamide |
| Ether | -O- | Diethyl ether |

### Reaction Types
- **Substitution**: SN1 (carbocation intermediate, racemization) vs SN2 (backside attack, inversion)
- **Elimination**: E1 (carbocation) vs E2 (concerted, anti-periplanar)
- **Addition**: Electrophilic (to alkenes), nucleophilic (to carbonyls)
- **Markovnikov's rule**: H adds to less substituted carbon (electrophilic addition)
- **Anti-Markovnikov**: Radical addition, hydroboration-oxidation
- **Zaitsev's rule**: More substituted alkene is major product (elimination)

### Stereochemistry
- **Chirality**: Non-superimposable mirror images, requires 4 different groups on carbon
- **R/S nomenclature**: Cahn-Ingold-Prelog priority rules, clockwise = R
- **Enantiomers**: Mirror images, same properties except optical rotation
- **Diastereomers**: Stereoisomers that are NOT mirror images
- **Meso compounds**: Achiral despite having stereocenters (internal mirror plane)
- **E/Z nomenclature**: For alkene geometric isomers (higher priority same side = Z)

### Aromaticity (Hückel's Rule)
- Planar, cyclic, fully conjugated
- **4n + 2 π electrons** (n = 0, 1, 2, ...): aromatic (2, 6, 10, 14 e⁻)
- **4n π electrons**: antiaromatic
- Benzene: 6 π electrons, aromatic
- Electrophilic aromatic substitution (EAS): Friedel-Crafts, halogenation, nitration, sulfonation

### Spectroscopy
- **IR**: O-H broad ~3200-3600 cm⁻¹, C=O sharp ~1700 cm⁻¹, N-H ~3300 cm⁻¹
- **¹H NMR**: Chemical shift (δ ppm), splitting (n+1 rule), integration = H count
- **¹³C NMR**: Number of unique carbons, DEPT for CH₃/CH₂/CH/C
- **Mass spec**: Molecular ion (M⁺), fragmentation pattern, base peak

---

## 7. Inorganic Chemistry

### Coordination Chemistry
- **Coordination number**: Number of bonds to central metal
- **Crystal field theory**: d-orbital splitting in octahedral (t₂g, eg) and tetrahedral fields
- **Spectrochemical series**: I⁻ < Br⁻ < Cl⁻ < F⁻ < OH⁻ < H₂O < NH₃ < en < NO₂⁻ < CN⁻ < CO
- **High spin vs low spin**: Weak field → high spin, strong field → low spin
- **CFSE**: Crystal field stabilization energy

### d-Block Chemistry
- **Oxidation states**: Transition metals have multiple (e.g., Fe²⁺/Fe³⁺, Mn²⁺ to Mn⁷⁺)
- **Color**: d-d transitions in partially filled d orbitals
- **Magnetism**: Unpaired electrons → paramagnetic, all paired → diamagnetic
- **Catalysis**: Variable oxidation states enable redox catalysis

---

## 8. Nuclear Chemistry

### Radioactive Decay
| Type | Particle | ΔZ | ΔA |
|---|---|---|---|
| Alpha (α) | ⁴₂He | -2 | -4 |
| Beta⁻ (β⁻) | e⁻ | +1 | 0 |
| Beta⁺ (β⁺) | e⁺ | -1 | 0 |
| Gamma (γ) | photon | 0 | 0 |
| Electron capture | - | -1 | 0 |

### Key Concepts
- **Half-life**: t₁/₂ = ln(2)/λ, N(t) = N₀·e^(-λt)
- **Binding energy**: E = Δm·c² (mass defect × c²)
- **Fission**: Heavy nucleus splits (U-235 + n → Ba + Kr + 3n)
- **Fusion**: Light nuclei combine (H → He, powers stars)
- **Nuclear stability**: N/Z ratio, belt of stability, magic numbers (2, 8, 20, 28, 50, 82, 126)
