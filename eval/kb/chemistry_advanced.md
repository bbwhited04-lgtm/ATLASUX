# Chemistry — Advanced / PhD-Level Reference

> Companion to chemistry_reference.md. Covers graduate and research-level
> topics: Advanced Organic Synthesis, Organometallic Chemistry, Computational
> Chemistry, Advanced Spectroscopy, Supramolecular Chemistry, Catalysis,
> Materials Chemistry, Chemical Biology

---

## 1. Advanced Organic Chemistry

### Pericyclic Reactions (Woodward-Hoffmann Rules)
- **Electrocyclic**: Ring opening/closing, thermal conrotatory (4n e⁻) / disrotatory (4n+2 e⁻)
  - Photochemical: Reversed stereoselectivity
- **Cycloaddition**: [4+2] Diels-Alder (suprafacial-suprafacial, thermal allowed)
  - [2+2] thermally forbidden, photochemically allowed
  - Endo rule: Kinetic preference for endo transition state (secondary orbital interactions)
  - Regioselectivity: "ortho/para" rule for unsymmetrical dienes and dienophiles
- **Sigmatropic rearrangements**: [3,3] Cope, Claisen (predictable stereochemistry via chair-like TS)
  - [1,5]-H shift: Suprafacial, thermally allowed; [1,3]-H shift: Suprafacial forbidden thermally
- **Frontier molecular orbital (FMO) theory**: HOMO-LUMO interactions determine reactivity
  - Diels-Alder: HOMO_diene + LUMO_dienophile (normal demand) or inverse demand

### Named Reactions (Graduate-Level)
| Reaction | Type | Key Features |
|---|---|---|
| Suzuki coupling | Pd-catalyzed C-C | Boronic acid + aryl halide, Pd(0)/Pd(II) cycle |
| Heck reaction | Pd-catalyzed C-C | Aryl halide + alkene, syn β-hydride elimination |
| Sonogashira | Pd/Cu-catalyzed C-C | Aryl halide + terminal alkyne |
| Buchwald-Hartwig | Pd-catalyzed C-N | Aryl halide + amine, ligand-dependent |
| Negishi | Pd-catalyzed C-C | Organozinc + aryl halide |
| Olefin metathesis | Ru-catalyzed | Grubbs catalyst, RCM/ROMP/CM |
| Wittig | Ylide + aldehyde | Phosphonium ylide → alkene, E/Z selectivity |
| Sharpless epoxidation | Asymmetric | Ti(OiPr)₄, diethyl tartrate, TBHP, allylic alcohols |
| Sharpless dihydroxylation | Asymmetric | OsO₄ (cat.), K₃Fe(CN)₆, (DHQD)₂PHAL or (DHQ)₂PHAL |
| Evans aldol | Asymmetric | Oxazolidinone auxiliary, boron or titanium enolate |
| CBS reduction | Asymmetric | Corey-Bakshi-Shibata, oxazaborolidine catalyst |
| Swern oxidation | Alcohol → aldehyde | DMSO/(COCl)₂, mild, no over-oxidation |
| Dess-Martin | Alcohol → aldehyde/ketone | Periodinane, mild conditions |
| Julia-Lythgoe | E-alkene synthesis | Sulfone + aldehyde |
| HWE (Horner-Wadsworth-Emmons) | E-alkene | Phosphonate ester + aldehyde |

### Asymmetric Catalysis
- **Chiral ligands**: BINAP (Noyori), salen (Jacobsen), BOX, PHOX, DuPhos
- **Noyori asymmetric hydrogenation**: Ru-BINAP, reduction of C=C, C=O
- **Jacobsen epoxidation**: Mn-salen, unfunctionalized alkenes
- **Organocatalysis**: Proline-catalyzed aldol (List/Barbas), MacMillan's iminium catalysis
  - Enamine catalysis: HOMO activation
  - Iminium catalysis: LUMO activation
  - NHC (N-heterocyclic carbene) catalysis: Umpolung of aldehydes
- **Enzyme mimicry**: Designed metal catalysts mimicking enzyme active sites
- **Dynamic kinetic resolution**: Racemization + selective reaction → >50% yield of single enantiomer

### Retrosynthetic Analysis (Corey)
- **Transform**: Reverse of a synthetic reaction
- **Synthon**: Idealized reactive intermediate
- **Strategic bond disconnections**: C-C bonds adjacent to functional groups
- **FGI (Functional Group Interconversion)**: Convert to more readily accessible FG
- **Convergent vs linear synthesis**: Convergent preferred for efficiency
- **Total synthesis milestones**: Woodward (chlorophyll, vitamin B₁₂), Corey (prostaglandins), Nicolaou (taxol), Baran (manzamine A — step-economical)

---

## 2. Organometallic Chemistry

### Fundamental Concepts
- **18-electron rule**: Stable complexes have 18 valence electrons (like noble gas configuration)
  - Exceptions: 16e⁻ for d⁸ square planar (Pd(II), Pt(II), Rh(I), Ir(I))
- **Oxidation state counting**: Ionic model vs covalent model
- **Hapticity**: η^n — number of contiguous atoms in ligand bound to metal (η⁵-Cp, η⁶-benzene)
- **Cone angle (Tolman)**: Steric parameter for phosphine ligands (PPh₃: 145°, P(OMe)₃: 107°)
- **Electronic parameter (TEP)**: ν(CO) in Ni(CO)₃L — lower frequency = more electron-donating L

### Elementary Reactions
| Reaction | Electron Count | Oxidation State |
|---|---|---|
| Oxidative addition | +2e⁻ | +2 |
| Reductive elimination | -2e⁻ | -2 |
| Migratory insertion | -2e⁻ (1,1 or 1,2) | 0 |
| β-Hydride elimination | +2e⁻ | 0 |
| Ligand substitution | 0 | 0 |
| Transmetalation | 0 | 0 |

### Catalytic Cycles
- **Pd-catalyzed cross-coupling**: Oxidative addition (ArX + Pd(0)) → Transmetalation (R-M) → Reductive elimination (Ar-R + Pd(0))
- **Olefin metathesis (Chauvin)**: [2+2] cycloaddition of metal carbene + alkene → metallacyclobutane → [2+2] retro
  - Grubbs I/II catalysts, Hoveyda-Grubbs, Schrock Mo/W alkylidenes
- **Ziegler-Natta polymerization**: Ti or Zr catalysts, stereospecific olefin polymerization (isotactic, syndiotactic)
  - Metallocene catalysts: ansa-zirconocenes with MAO cocatalyst
- **Hydroformylation**: Alkene + CO + H₂ → aldehyde (Rh or Co catalyst)
- **Wacker oxidation**: Ethylene + O₂ → acetaldehyde (Pd(II)/Cu(II) catalytic)

---

## 3. Physical Chemistry (Advanced)

### Quantum Chemistry
- **Hartree-Fock (HF)**: Self-consistent field, single Slater determinant, captures exchange but not correlation
- **Basis sets**: STO-3G (minimal), 6-31G*, cc-pVTZ (correlation-consistent), aug- (diffuse functions)
- **Electron correlation methods**:
  - MP2 (Møller-Plesset): Second-order perturbation theory, captures dynamic correlation
  - CCSD(T): "Gold standard" — coupled cluster with singles, doubles, perturbative triples
  - Full CI: Exact within basis set, exponentially expensive
- **DFT (Density Functional Theory)**: E[ρ] = T_s[ρ] + V_ext[ρ] + J[ρ] + E_xc[ρ]
  - Kohn-Sham equations: Map interacting problem to non-interacting with same density
  - Functionals: LDA → GGA (PBE, BLYP) → hybrid (B3LYP) → range-separated (ωB97X-D) → double-hybrid
  - B3LYP: Most widely used, ~1-3 kcal/mol accuracy for many organic reactions
  - Dispersion corrections: -D3, -D4 (Grimme) for non-covalent interactions
- **TDDFT**: Time-dependent DFT for excited states, UV-Vis spectra
- **Multi-reference methods**: CASSCF, CASPT2 for systems with near-degenerate states (diradicals, excited states, transition metals)

### Statistical Thermodynamics
- **Partition function**: q = Σ g_i e^{-ε_i/(kT)}
  - Translational: q_t = (2πmkT/h²)^{3/2} · V
  - Rotational (linear): q_r = kT/(σBhc) where B = rotational constant
  - Vibrational: q_v = 1/(1-e^{-hν/(kT)})
- **Thermodynamic functions from q**: U = kT²(∂lnQ/∂T)_V, S = kT(∂lnQ/∂T)_V + klnQ
- **Transition state theory (Eyring)**: k = (kT/h)·(Q‡/Q_R)·e^{-E₀/(kT)}
  - Eyring equation: k = (kT/h)e^{-ΔG‡/(RT)}
  - ΔG‡ = ΔH‡ - TΔS‡

### Surface Chemistry
- **Langmuir isotherm**: θ = KP/(1+KP), single-layer adsorption, equivalent sites
- **BET isotherm**: Multilayer adsorption, surface area measurement
- **Chemisorption vs physisorption**: Chemical bonding (>40 kJ/mol) vs van der Waals (<40 kJ/mol)
- **Heterogeneous catalysis**: Adsorption → surface reaction → desorption
  - Langmuir-Hinshelwood: Both species adsorbed
  - Eley-Rideal: One adsorbed, one from gas phase
- **Sabatier principle**: Optimal catalyst binds intermediates neither too strongly nor too weakly (volcano plot)

---

## 4. Advanced Spectroscopy

### NMR (Advanced)
- **2D NMR**: COSY (¹H-¹H coupling), HSQC (¹H-¹³C one-bond), HMBC (¹H-¹³C multi-bond), NOESY/ROESY (through-space)
- **DEPT**: Determines CH₃, CH₂, CH, quaternary C
- **Coupling constants**: ³J_HH (Karplus equation: J = A cos²φ + B cosφ + C)
  - Axial-axial: ~10-12 Hz, axial-equatorial: ~3-5 Hz (cyclohexane)
- **Chemical shift anisotropy**: Orientation-dependent; averaged in solution (MAS in solid-state)
- **Relaxation**: T₁ (spin-lattice, longitudinal), T₂ (spin-spin, transverse)
- **Solid-state NMR**: Magic angle spinning (MAS), cross-polarization (CP), DNP enhancement

### Mass Spectrometry (Advanced)
- **Ionization methods**: ESI (biomolecules), MALDI (proteins, polymers), EI (small organic), APCI
- **Mass analyzers**: Quadrupole, TOF, Orbitrap (>100,000 resolution), FT-ICR (>1,000,000 resolution)
- **Tandem MS (MS/MS)**: CID fragmentation for structural elucidation
- **Proteomics**: Bottom-up (tryptic digest → peptide ID), top-down (intact protein)
- **Metabolomics**: Untargeted (global profiling) vs targeted (quantitative)
- **Native MS**: Preserve non-covalent complexes in gas phase

### X-ray Methods
- **Single crystal XRD**: 3D electron density map, R-factor < 0.05 (good), space groups
- **Powder XRD**: Phase identification, Rietveld refinement
- **EXAFS**: Local structure around specific atom (bond distances, coordination numbers)
- **XANES**: Oxidation state, electronic structure of absorbing atom
- **Small-angle X-ray scattering (SAXS)**: Size, shape of nanoparticles, proteins in solution

---

## 5. Supramolecular Chemistry

### Non-covalent Interactions
| Interaction | Strength (kJ/mol) | Example |
|---|---|---|
| Ion-ion | 100-350 | NaCl in vacuum |
| Ion-dipole | 50-200 | Na⁺(H₂O)₆ |
| Hydrogen bond | 10-40 | DNA base pairs |
| Halogen bond | 5-50 | I···N interactions |
| Cation-π | 5-80 | K⁺···benzene |
| π-π stacking | 2-50 | DNA base stacking |
| CH-π | 2-10 | Protein-ligand |
| Van der Waals | 0.5-5 | Noble gas dimers |
| Hydrophobic effect | Variable | Micelle formation |

### Host-Guest Chemistry
- **Crown ethers**: Selective cation binding (18-crown-6 for K⁺, 15-crown-5 for Na⁺)
- **Cryptands**: 3D analogs, higher selectivity and binding constants
- **Cyclodextrins**: α (6 glucose), β (7), γ (8) — hydrophobic cavity, hydrophilic exterior
- **Cucurbit[n]urils**: CB[7], CB[8] — extreme binding affinities (>10¹² M⁻¹ for some guests)
- **Calixarenes**: Phenol-formaldehyde macrocycles, conformational isomers (cone, partial cone, 1,2-alternate, 1,3-alternate)

### Self-Assembly
- **Molecular recognition**: Complementarity in size, shape, functionality
- **Cages and capsules**: Pd₁₂L₂₄ (Fujita), Fe₄L₆ tetrahedra
- **Metal-organic frameworks (MOFs)**: Porous crystalline materials, tunable pore size, gas storage, catalysis
  - MOF-5 (Zn₄O nodes + BDC linkers), HKUST-1, UiO-66 (Zr)
  - BET surface areas > 6000 m²/g for some MOFs
- **Mechanically interlocked molecules**: Rotaxanes, catenanes (Stoddart, Nobel 2016)
  - Molecular machines: Switches, motors, shuttles
- **Dynamic covalent chemistry**: Reversible covalent bonds (imines, disulfides, boronate esters) for self-correction

---

## 6. Chemical Biology

### Bioorthogonal Chemistry
- **Click chemistry (CuAAC)**: Azide + alkyne → 1,2,3-triazole (Sharpless/Meldal, Nobel 2022)
- **SPAAC**: Strain-promoted azide-alkyne cycloaddition (no Cu needed, Bertozzi, Nobel 2022)
- **Inverse electron demand Diels-Alder**: Tetrazine + trans-cyclooctene, extremely fast (k₂ > 10⁵ M⁻¹s⁻¹)
- **Staudinger ligation**: Azide + phosphine → amide
- **Applications**: Live cell labeling, in vivo imaging, protein modification, drug delivery

### Chemical Genetics
- **Forward chemical genetics**: Phenotype-based screening → identify target
- **Reverse chemical genetics**: Target-based screening → validate in cells
- **PROTACs**: Proteolysis-targeting chimeras, recruit E3 ubiquitin ligase to degrade target protein
- **Molecular glues**: Stabilize protein-protein interactions (thalidomide/lenalidomide → CRBN-neosubstrate degradation)
- **Fragment-based drug discovery**: Start with weak-binding fragments (MW < 300), grow/link to potent leads

### Protein Chemistry
- **Native chemical ligation (NCL)**: C-terminal thioester + N-terminal cysteine → peptide bond
- **Expressed protein ligation**: Intein-mediated thioester generation + NCL for semi-synthesis
- **Unnatural amino acid incorporation**: Amber suppression (orthogonal tRNA/aminoacyl-tRNA synthetase)
  - Site-specific labeling, cross-linking, bioorthogonal handles
- **Directed evolution**: Iterative mutagenesis + selection/screening (Arnold, Nobel 2018)
  - Error-prone PCR, DNA shuffling, phage display, FACS-based screening

---

## 7. Electrochemistry (Advanced)

### Electrode Kinetics
- **Butler-Volmer equation**: i = i₀[exp(αFη/RT) - exp(-(1-α)Fη/RT)]
  - i₀ = exchange current density, α = transfer coefficient, η = overpotential
- **Tafel equation**: η = a + b·log(i) (high overpotential limit)
- **Mass transport**: Fick's laws, Cottrell equation i(t) = nFAD^{1/2}C/(πt)^{1/2}
- **Cyclic voltammetry**: Peak separation ΔE_p = 59/n mV (reversible), scan rate dependence
  - Reversible: i_p = 0.4463nFA(nFD/RT)^{1/2}Cv^{1/2} (Randles-Sevcik)

### Energy Storage
- **Li-ion batteries**: LiCoO₂/graphite standard, LiFePO₄ (safer), NMC (high energy)
  - Anode: C₆ + xLi⁺ + xe⁻ → Li_xC₆
  - Cathode: LiMO₂ → Li_{1-x}MO₂ + xLi⁺ + xe⁻
  - Solid electrolyte interphase (SEI): Passivation layer on anode, critical for stability
- **Beyond Li-ion**: Na-ion, Li-S (high capacity but polysulfide shuttle problem), solid-state (oxide/sulfide electrolytes), Li-air
- **Supercapacitors**: EDLC (double-layer) and pseudocapacitive (faradaic)
- **Fuel cells**: PEM (Nafion membrane, Pt catalyst), SOFC (ceramic, high-T), alkaline

### Electrocatalysis
- **Oxygen evolution reaction (OER)**: 2H₂O → O₂ + 4H⁺ + 4e⁻, IrO₂/RuO₂ catalysts
- **Hydrogen evolution reaction (HER)**: 2H⁺ + 2e⁻ → H₂, Pt benchmark, MoS₂ alternative
- **CO₂ reduction**: CO₂ → CO, HCOO⁻, CH₃OH, C₂H₄ (selectivity is key challenge)
  - Cu is unique in producing C₂+ products
- **Nitrogen reduction**: N₂ + 6H⁺ + 6e⁻ → 2NH₃ (extremely challenging, competing HER)
