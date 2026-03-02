# Engineering — Advanced / PhD-Level Reference

> Companion to engineering_reference.md. Covers graduate and research-level
> topics: Advanced Control Theory, VLSI/Nanoelectronics, RF/Microwave,
> Computational Mechanics (FEM), Advanced Fluid Dynamics, Turbomachinery,
> Composite Materials, Robotics, Quantum Computing Hardware

---

## 1. Advanced Control Systems

### Nonlinear Control
- **Lyapunov stability**: Find V(x) > 0 with V̇(x) ≤ 0 → stable; V̇ < 0 → asymptotically stable
  - LaSalle's invariance principle: Convergence to largest invariant set where V̇ = 0
- **Feedback linearization**: Transform nonlinear system to linear via coordinate change + feedback
  - Input-output linearization: Differentiate output until input appears
  - State-space linearization: Full state feedback (requires involutive distribution, Frobenius)
- **Sliding mode control**: Discontinuous control forcing state onto sliding surface s(x) = 0
  - Chattering: High-frequency switching near surface; mitigated by boundary layer
- **Backstepping**: Recursive Lyapunov design for strict-feedback systems ẋ₁ = f₁(x₁) + g₁(x₁)x₂
- **Adaptive control**: Model Reference Adaptive Control (MRAC), parameter estimation + control law update
  - Certainty equivalence: Use estimated parameters as if known
  - Persistent excitation: Required for parameter convergence

### Optimal Control
- **Pontryagin's Maximum Principle**: Necessary conditions via costate (adjoint) variables
  - Hamiltonian: H(x,u,λ) = L(x,u) + λᵀf(x,u)
  - ẋ = ∂H/∂λ, λ̇ = -∂H/∂x, ∂H/∂u = 0 (or u* maximizes H)
- **Dynamic programming (Bellman)**: V(x,t) = min_u ∫L dt + V_terminal
  - Hamilton-Jacobi-Bellman: -∂V/∂t = min_u [L + (∂V/∂x)ᵀf]
- **Linear Quadratic Regulator (LQR)**: J = ∫(xᵀQx + uᵀRu)dt, u* = -Kx, K = R⁻¹BᵀP
  - Algebraic Riccati equation (ARE): AᵀP + PA - PBR⁻¹BᵀP + Q = 0
- **Linear Quadratic Gaussian (LQG)**: LQR + Kalman filter for noisy systems
  - Separation principle: Design observer and controller independently
- **Model Predictive Control (MPC)**: Solve finite-horizon optimal control at each step, apply first input
  - Handles constraints explicitly, widely used in process control and autonomous vehicles

### Robust Control
- **H∞ control**: Minimize worst-case gain from disturbance to output
  - ||T_{zw}||_∞ < γ where T_{zw} is disturbance-to-output transfer function
- **μ-synthesis**: Structured singular value, handles parametric uncertainty
- **Small gain theorem**: Interconnection of ||G₁||·||G₂|| < 1 is stable
- **Structured uncertainty**: Δ-blocks representing model uncertainty, M-Δ framework

### Estimation Theory
- **Kalman filter**: Optimal linear estimator for Gaussian systems
  - Prediction: x̂_{k|k-1} = Ax̂_{k-1|k-1} + Bu_k, P_{k|k-1} = AP_{k-1|k-1}Aᵀ + Q
  - Update: K_k = P_{k|k-1}Cᵀ(CP_{k|k-1}Cᵀ + R)⁻¹, x̂_{k|k} = x̂_{k|k-1} + K_k(y_k - Cx̂_{k|k-1})
- **Extended Kalman Filter (EKF)**: Linearize about current estimate for nonlinear systems
- **Unscented Kalman Filter (UKF)**: Sigma points propagated through nonlinear functions
- **Particle filter**: Sequential Monte Carlo, handles arbitrary distributions, no linearity assumption

---

## 2. Advanced Electrical Engineering

### VLSI and Nanoelectronics
- **MOSFET scaling**: Gate length shrinking (now < 5 nm node), short-channel effects
  - DIBL (drain-induced barrier lowering), velocity saturation, hot carrier injection
- **FinFET**: 3D gate wraps around fin channel, better electrostatic control
- **Gate-all-around (GAA)**: Nanosheet/nanowire, successor to FinFET at sub-3nm
- **CMOS inverter**: P_dynamic = αCV²f, P_static = I_leak·V_DD (leakage dominates at small nodes)
- **Interconnect**: RC delay dominates at small nodes, Cu replaced by Co/Ru at contact level
- **Design for manufacturability**: Lithography limits, multi-patterning (EUV at 13.5 nm wavelength)

### RF and Microwave Engineering
- **S-parameters**: S₁₁ (input reflection), S₂₁ (forward transmission), S₁₂ (reverse), S₂₂ (output)
  - |S₂₁|² = power gain, |S₁₁|² = reflected power fraction
- **Smith chart**: Complex impedance visualization, matching network design
  - Normalized impedance z = Z/Z₀, center = Z₀ (matched)
- **Noise figure**: NF = 10log₁₀(SNR_in/SNR_out), cascaded: F_total = F₁ + (F₂-1)/G₁ + (F₃-1)/(G₁G₂)
- **Power amplifier classes**: A (linear, <50% η), B (push-pull, 78.5%), C (tuned, >90% but nonlinear)
  - Class E/F: Switching mode, high efficiency
- **Oscillator phase noise**: L(f_m) = (2FkT/P₀)(f₀/(2Q·f_m))² (Leeson model)
- **Antenna theory**: Friis equation: P_r = P_t G_t G_r (λ/(4πd))²
  - Array factor: AF = Σ w_n e^{jkd_n sinθ}, beamforming, MIMO

### Power Electronics
- **Switching converters**: Buck (step-down), boost (step-up), buck-boost, flyback
  - Duty cycle: V_out/V_in = D (buck), 1/(1-D) (boost)
- **Inverters**: DC→AC, PWM control, H-bridge, 3-phase
  - THD (total harmonic distortion): √(Σ V_n²)/V_1 for n > 1
- **Wide-bandgap semiconductors**: SiC (3.26 eV), GaN (3.4 eV) — higher voltage, temperature, frequency
- **Grid-tied inverters**: Maximum power point tracking (MPPT) for solar, anti-islanding
- **Motor drives**: FOC (field-oriented control), DTC (direct torque control) for AC motors

### Quantum Computing Hardware
- **Superconducting qubits**: Transmon (charge qubit with EJ >> EC), flux qubit, fluxonium
  - Coherence times: T₁ ~ 100-500 μs, T₂ ~ 50-200 μs (state of art)
  - Control: Microwave pulses (~4-8 GHz), dilution refrigerator (~10 mK)
- **Trapped ions**: ¹⁷¹Yb⁺, ⁴⁰Ca⁺, hyperfine or optical qubit states
  - Gates via laser-driven motional coupling (Mølmer-Sørensen, Cirac-Zoller)
  - Very high fidelity (>99.9% single-qubit, >99.5% two-qubit)
- **Photonic qubits**: Dual-rail encoding (which-path), measurement-based quantum computing
  - Boson sampling, photon-photon interaction via nonlinear media or measurement
- **Error correction**: Surface code, threshold ~1%, logical qubit from ~1000 physical qubits
  - Toric code: Z₂ topological order on torus, anyonic excitations

---

## 3. Advanced Mechanical Engineering

### Computational Mechanics
- **Finite Element Method (FEM)**: Weak form, discretization, element stiffness matrices, assembly
  - [K]{u} = {F} — global stiffness matrix equation
  - Element types: Triangular (T3, T6), quadrilateral (Q4, Q8), tetrahedral, hexahedral
  - Isoparametric elements: Same shape functions for geometry and displacement
  - Gauss quadrature: Numerical integration, n-point Gauss exact for polynomial degree 2n-1
  - Convergence: h-refinement (more elements), p-refinement (higher order), hp-refinement
- **Nonlinear FEM**: Geometric nonlinearity (large deformation), material nonlinearity (plasticity, hyperelasticity)
  - Newton-Raphson iteration: K_T Δu = R (tangent stiffness × displacement increment = residual)
  - Arc-length method (Riks): Tracks snap-through/snap-back behavior
- **Explicit dynamics**: Central difference time integration, Δt ≤ L_min/c (CFL condition)
  - Used for crash simulation, blast, high-velocity impact

### Fracture Mechanics
- **Linear elastic (LEFM)**: Stress intensity factor K_I = σ√(πa)·Y (mode I)
  - K_I = K_{Ic}: Fracture (plane strain fracture toughness)
- **J-integral**: Path-independent contour integral, J = ∫_Γ (W dy - T·∂u/∂x ds)
  - J = G (energy release rate) = K²/E' where E' = E (plane stress) or E/(1-ν²) (plane strain)
- **Crack tip plasticity**: Irwin's plastic zone: r_p = (1/2π)(K/σ_y)² (plane stress)
- **Fatigue crack growth**: Paris law: da/dN = C(ΔK)^m
  - Threshold ΔK_th below which no growth; K_max = K_Ic → fast fracture
- **CTOD/CTOA**: Crack tip opening displacement/angle for elastic-plastic fracture
- **Cohesive zone models**: Traction-separation law, avoid singularity at crack tip

### Advanced Fluid Dynamics
- **Turbulence**: Reynolds decomposition u = ū + u', Reynolds stress tensor -ρ⟨u'ᵢu'ⱼ⟩
- **Kolmogorov theory**: Energy cascade from integral scale L to Kolmogorov scale η = (ν³/ε)^{1/4}
  - Energy spectrum: E(k) ∝ k^{-5/3} (inertial subrange)
  - Reynolds number: Re = UL/ν, turbulent for Re >> 1
- **RANS**: Time-averaged Navier-Stokes, closure models (k-ε, k-ω SST, Spalart-Allmaras)
- **LES**: Resolve large eddies, model subgrid scale (Smagorinsky, dynamic models)
- **DNS**: Resolve all scales, grid ~ Re^{9/4} (prohibitively expensive for high Re)
- **Compressible flow**: Normal shock relations, oblique shocks, Prandtl-Meyer expansion
  - Rankine-Hugoniot: ρ₂/ρ₁ = (γ+1)M₁²/((γ-1)M₁²+2) for normal shock
- **Boundary layer**: Blasius solution (flat plate), δ ~ x/√(Re_x), skin friction C_f = 0.664/√(Re_x) (laminar)

### Composite Materials
- **Classical Laminate Theory (CLT)**: [A B; B D]{ε⁰, κ} = {N, M}
  - A: Extension stiffness, B: Coupling, D: Bending stiffness
- **Lamina properties**: Longitudinal E₁ (fiber-dominated), transverse E₂ (matrix-dominated)
  - Rule of mixtures: E₁ = E_f V_f + E_m V_m
- **Failure theories**: Maximum stress, maximum strain, Tsai-Wu (interactive), Tsai-Hill, Puck
- **Delamination**: Mode I (opening), Mode II (shearing), Mode III (tearing)
  - VCCT (virtual crack closure technique), cohesive elements for delamination simulation
- **Manufacturing**: Autoclave curing, RTM, filament winding, AFP (automated fiber placement)

---

## 4. Aerospace (Advanced)

### Computational Fluid Dynamics for Aerospace
- **Euler equations**: Inviscid, compressible flow, basis for aerodynamic design
- **Panel methods**: Potential flow, source/doublet panels on surface (linear, fast)
- **Vortex lattice**: Lifting surfaces, Kutta-Joukowski condition, downwash
- **Transonic aerodynamics**: Mixed subsonic/supersonic flow, shock-boundary layer interaction
  - Supercritical airfoils: Flat upper surface delays shock formation
- **Hypersonic**: Real gas effects, dissociation, ionization, thermal protection

### Astrodynamics (Advanced)
- **Restricted three-body problem**: Jacobi constant, Lagrange points (L₁-L₅)
  - L₁: Between bodies (SOHO, James Webb near Sun-Earth L₂)
  - L₄, L₅: Trojan points, stable (60° ahead/behind smaller body)
- **Patched conics**: Approximate trajectory by switching between 2-body problems at sphere of influence
- **Low-thrust trajectories**: Continuous thrust, optimal spiral, Q-law guidance
- **Interplanetary**: Lambert's problem (find orbit connecting two positions in given time)
- **Perturbations**: J₂ (oblateness) → regression of nodes and apsidal precession
  - Sun-synchronous orbit: Choose inclination so node regresses at 360°/year
- **Orbit determination**: Gauss's method (3 observations), Kalman filtering for precision

### Structural Dynamics
- **Modal analysis**: M ü + K u = 0 → eigenvalue problem (K - ω²M)φ = 0
  - Natural frequencies ω_n and mode shapes φ_n
- **Damped systems**: M ü + C u̇ + K u = F(t), modal damping ratio ζ_n
- **Frequency response**: H(ω) = (K - ω²M + iωC)⁻¹, peaks at natural frequencies
- **Flutter**: Aeroelastic instability, coupling of structural and aerodynamic modes
  - V-g method, p-k method for flutter speed prediction
  - Critical in wing/tail/control surface design
- **Random vibration**: Power spectral density, Miles' equation for SDOF response to white noise

---

## 5. Robotics (Advanced)

### Kinematics
- **Denavit-Hartenberg**: Systematic frame assignment for serial manipulators
  - 4 parameters per joint: d_i (link offset), θ_i (joint angle), a_i (link length), α_i (twist)
- **Forward kinematics**: T_0^n = ∏ A_i(q_i), compute end-effector pose from joint angles
- **Inverse kinematics**: Given desired pose, find joint angles (may be non-unique or impossible)
  - Analytical (closed-form for 6-DOF with specific geometry) vs numerical (Jacobian pseudo-inverse)
- **Jacobian**: J(q), relates joint velocities to end-effector velocity: ẋ = J(q)q̇
  - Singularities: det(J) = 0, loss of DOF, infinite joint velocities needed

### Dynamics
- **Lagrangian formulation**: M(q)q̈ + C(q,q̇)q̇ + G(q) = τ
  - M: Inertia matrix, C: Coriolis/centrifugal, G: Gravity, τ: Joint torques
- **Newton-Euler (recursive)**: Forward pass (velocities/accelerations), backward pass (forces/torques)
  - O(n) complexity vs O(n³) for Lagrangian

### Motion Planning
- **Configuration space (C-space)**: Space of all possible robot configurations, obstacles mapped to C-space
- **Sampling-based**: RRT (rapidly-exploring random tree), PRM (probabilistic roadmap)
  - RRT*: Asymptotically optimal variant, rewiring step
- **Optimization-based**: Trajectory optimization, CHOMP, TrajOpt, STOMP
  - Minimize objective (smoothness, time, energy) subject to collision constraints
- **SLAM**: Simultaneous Localization and Mapping
  - EKF-SLAM, particle filter (FastSLAM), graph-based (pose graph optimization)
  - Visual SLAM: ORB-SLAM, LSD-SLAM, using camera features

### Control
- **Computed torque**: τ = M(q)[q̈_d + K_v ė + K_p e] + C(q,q̇)q̇ + G(q)
  - Model-based, requires accurate dynamic model
- **Impedance control**: Specify desired dynamic relationship between force and motion
  - M_d(ẍ - ẍ_d) + B_d(ẋ - ẋ_d) + K_d(x - x_d) = F_ext
- **Whole-body control**: Prioritized task-space control for humanoids/mobile manipulators
  - Null-space projection: Lower-priority tasks in null space of higher-priority

---

## 6. Biomedical Engineering

### Medical Imaging
| Modality | Principle | Resolution | Use |
|---|---|---|---|
| X-ray/CT | X-ray attenuation | ~0.5 mm | Bone, lung, vessels |
| MRI | Nuclear magnetic resonance (¹H) | ~1 mm | Soft tissue, brain |
| Ultrasound | Acoustic reflection | ~1-2 mm | Real-time, obstetrics |
| PET | Positron annihilation (¹⁸F-FDG) | ~4 mm | Metabolic activity, cancer |
| fMRI | BOLD signal (deoxyHb) | ~2-3 mm, ~1-2s | Brain functional mapping |

### MRI Physics
- **Signal**: Precession of ¹H nuclei in B₀, Larmor frequency ω₀ = γB₀ (γ = 42.58 MHz/T for ¹H)
- **T1 (spin-lattice)**: Recovery of longitudinal magnetization; fat-bright, water-dark on T1-weighted
- **T2 (spin-spin)**: Decay of transverse magnetization; water-bright on T2-weighted
- **k-space**: Fourier domain of image, filled by gradient encoding
  - Phase encoding + frequency encoding → 2D k-space sampling
  - Acceleration: Parallel imaging (GRAPPA, SENSE), compressed sensing
- **Diffusion MRI (DTI)**: Measures water diffusion anisotropy, maps white matter tracts (tractography)
- **Functional MRI**: BOLD contrast, hemodynamic response function (HRF), GLM analysis

### Biomechanics
- **Constitutive models for soft tissue**: Hyperelastic (Mooney-Rivlin, Ogden, Holzapfel-Gasser-Ogden for arteries)
  - Anisotropic: Fiber-reinforced models for tendons, arteries, myocardium
- **Musculoskeletal modeling**: OpenSim, inverse dynamics, muscle force estimation
- **Gait analysis**: Kinematics (motion capture), kinetics (force plates), EMG
- **Fluid-structure interaction**: Blood flow in deformable vessels, heart valve mechanics
  - Windkessel model: Lumped-parameter cardiovascular model (R-C-R)
