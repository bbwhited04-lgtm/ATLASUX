# Engineering Reference — HLE Benchmark Knowledge Base

> 5% of HLE questions.
> Covers: Electrical Engineering, Mechanical Engineering, Civil Engineering,
> Aerospace, Materials Science, Chemical Engineering, Control Systems

---

## 1. Electrical Engineering

### Circuit Analysis
- **Ohm's Law**: V = IR
- **Kirchhoff's Current Law (KCL)**: Σ I_in = Σ I_out at any node
- **Kirchhoff's Voltage Law (KVL)**: Σ V around any closed loop = 0
- **Power**: P = IV = I²R = V²/R
- **Resistors**: Series: R_total = R₁ + R₂ + ..., Parallel: 1/R_total = 1/R₁ + 1/R₂ + ...
- **Capacitors**: Series: 1/C_total = 1/C₁ + 1/C₂, Parallel: C_total = C₁ + C₂
- **Inductors**: Series: L_total = L₁ + L₂, Parallel: 1/L_total = 1/L₁ + 1/L₂

### AC Circuits
- **Impedance**: Z = R + jX (complex, j = √(-1))
  - Capacitor: Z_C = 1/(jωC) = -j/(ωC)
  - Inductor: Z_L = jωL
- **Resonance**: ω₀ = 1/√(LC), impedance purely resistive at resonance
- **Quality factor**: Q = ω₀L/R (series RLC), higher Q = narrower bandwidth
- **Power factor**: cos(φ), where φ = angle between V and I
- **RMS values**: V_rms = V_peak/√2 for sinusoidal

### Semiconductor Devices
- **Diode**: Forward bias > V_th (~0.7V Si), exponential I-V characteristic
- **BJT**: I_C = βI_B, three regions: cutoff, active, saturation
- **MOSFET**: Voltage-controlled, gate-source voltage controls drain current
  - Enhancement: normally off, needs V_GS > V_th
  - Depletion: normally on
- **Op-amp (ideal)**: Infinite gain, infinite input impedance, zero output impedance
  - Inverting: V_out = -(R_f/R_in)V_in
  - Non-inverting: V_out = (1 + R_f/R_in)V_in

### Digital Electronics
- **Boolean algebra**: AND (·), OR (+), NOT ('), XOR (⊕)
- **De Morgan's**: (A·B)' = A' + B', (A+B)' = A'·B'
- **Flip-flops**: SR, JK, D, T — basic memory elements
- **ADC/DAC**: Analog-to-digital and digital-to-analog conversion
- **Nyquist sampling**: f_sample ≥ 2·f_max to avoid aliasing

### Signal Processing
- **Fourier Transform**: F(ω) = ∫ f(t)e^(-jωt)dt
- **Laplace Transform**: F(s) = ∫₀^∞ f(t)e^(-st)dt (s = σ + jω)
- **Z-Transform**: F(z) = Σ f[n]z^(-n) (discrete-time)
- **Convolution**: y(t) = ∫ x(τ)h(t-τ)dτ (output = input * impulse response)
- **Transfer function**: H(s) = Y(s)/X(s) in Laplace domain
- **Bode plot**: Magnitude (dB) and phase vs frequency (log scale)

### Electromagnetic Theory
- **Transmission lines**: Characteristic impedance Z₀ = √(L/C)
- **Antenna**: Gain = 4πA_e/λ², where A_e is effective aperture
- **Skin depth**: δ = √(2ρ/(ωμ)), current concentrates near surface at high freq
- **Smith chart**: Graphical tool for impedance matching and transmission line analysis

---

## 2. Mechanical Engineering

### Statics & Dynamics
- **Static equilibrium**: Σ F = 0, Σ M = 0 (no net force or moment)
- **Free body diagram**: Isolate body, show all external forces and moments
- **Friction**: f ≤ μN (static: f_s ≤ μ_sN, kinetic: f_k = μ_kN)
- **Moment of inertia**: I = ∫ r²dm, parallel axis theorem: I = I_cm + md²

### Mechanics of Materials (Strength of Materials)
- **Stress**: σ = F/A (normal), τ = V/A (shear)
- **Strain**: ε = ΔL/L (normal), γ = Δx/L (shear)
- **Hooke's Law**: σ = Eε (elastic region), E = Young's modulus
- **Poisson's ratio**: ν = -ε_lateral/ε_axial (typically 0.2-0.5)
- **Shear modulus**: G = E/(2(1+ν))
- **Beam bending**: σ = My/I, deflection from EI·y'' = M(x)
- **Torsion**: τ = Tr/J, angle of twist θ = TL/(GJ)
- **Buckling (Euler)**: P_cr = π²EI/(KL)², K depends on end conditions
- **Mohr's circle**: Graphical method for stress transformation
- **Von Mises criterion**: σ_vm = √(σ₁² - σ₁σ₂ + σ₂²) < σ_yield

### Thermodynamics (Engineering)
- **First law (open system)**: Q̇ - Ẇ = ṁ(h₂ - h₁ + V₂²/2 - V₁²/2 + g(z₂-z₁))
- **Carnot efficiency**: η = 1 - T_cold/T_hot (maximum possible)
- **Rankine cycle**: Pump → Boiler → Turbine → Condenser (steam power)
- **Brayton cycle**: Compressor → Combustor → Turbine (gas turbine/jet engine)
- **Otto cycle**: Gasoline engine, η = 1 - 1/r^(γ-1) where r = compression ratio
- **Diesel cycle**: Higher compression ratio than Otto, fuel injected at TDC
- **Refrigeration (COP)**: COP_cooling = Q_L/W, COP_heating = Q_H/W

### Fluid Mechanics
- **Continuity**: ρ₁A₁v₁ = ρ₂A₂v₂ (mass conservation)
- **Bernoulli**: P + ½ρv² + ρgh = const (steady, inviscid, incompressible)
- **Reynolds number**: Re = ρvD/μ (laminar < 2300, turbulent > 4000 for pipe)
- **Navier-Stokes**: ρ(∂v/∂t + v·∇v) = -∇P + μ∇²v + ρg
- **Drag force**: F_D = ½ρv²C_DA
- **Hagen-Poiseuille**: Q = πΔPr⁴/(8μL) (laminar pipe flow)
- **Moody diagram**: Friction factor f vs Re for pipe flow

### Heat Transfer
- **Conduction**: q = -kA(dT/dx), Fourier's law
- **Convection**: q = hA(T_s - T_∞), Newton's law of cooling
- **Radiation**: q = εσA(T⁴_s - T⁴_surr), Stefan-Boltzmann law
- **Thermal resistance**: R_cond = L/(kA), R_conv = 1/(hA)
- **Nusselt number**: Nu = hL/k (dimensionless convection coefficient)
- **Fins**: Extended surfaces to increase heat transfer area

---

## 3. Civil Engineering

### Structural Analysis
- **Truss analysis**: Method of joints, method of sections
- **Determinate vs indeterminate**: Statically determinate if 3 equilibrium equations suffice
- **Influence lines**: Response at a point as unit load moves across structure
- **Moment distribution method**: Hardy Cross method for continuous beams

### Geotechnical Engineering
- **Soil classification**: USCS (Unified Soil Classification System)
- **Effective stress**: σ' = σ - u (total stress - pore water pressure)
- **Terzaghi's bearing capacity**: q_ult = cN_c + qN_q + 0.5γBN_γ
- **Consolidation**: Settlement over time as pore water drains (Terzaghi's 1-D theory)
- **Mohr-Coulomb failure**: τ = c + σ'tan(φ) (cohesion + friction)

### Hydraulic Engineering
- **Manning's equation**: V = (1/n)R^(2/3)S^(1/2) (open channel flow)
- **Darcy-Weisbach**: h_f = fLV²/(2gD) (head loss in pipes)
- **Specific energy**: E = y + V²/(2g) (open channel)
- **Hydraulic jump**: Fr₁ > 1 → Fr₂ < 1 (supercritical to subcritical)

### Transportation Engineering
- **LOS (Level of Service)**: A (free flow) through F (forced flow)
- **Sight distance**: Stopping, passing, decision
- **Traffic flow**: q = kv (flow = density × speed)

---

## 4. Aerospace Engineering

### Aerodynamics
- **Lift**: L = ½ρv²SC_L, where S = wing area
- **Drag**: D = ½ρv²SC_D = D_parasitic + D_induced
- **Lift-to-drag ratio**: L/D — key efficiency metric
- **Mach number**: M = v/a, where a = √(γRT) is speed of sound
  - Subsonic: M < 0.8, Transonic: 0.8-1.2, Supersonic: 1.2-5, Hypersonic: M > 5
- **Thin airfoil theory**: C_L = 2πα (small angles of attack, radians)

### Orbital Mechanics
- **Kepler's Laws**: Elliptical orbits, equal areas, T² ∝ a³
- **Vis-viva equation**: v² = GM(2/r - 1/a)
- **Hohmann transfer**: Minimum energy transfer between circular orbits
  - Δv₁ at departure orbit, Δv₂ at arrival orbit
- **Escape velocity**: v_esc = √(2GM/r)
- **Tsiolkovsky rocket equation**: Δv = v_e ln(m₀/m_f)
- **Specific impulse**: I_sp = F/(ṁg₀) = v_e/g₀ (efficiency of propellant)

### Propulsion
- **Thrust**: F = ṁv_e + (p_e - p_a)A_e
- **Turbofan**: Bypass ratio = ṁ_bypass/ṁ_core
- **Specific fuel consumption**: TSFC = ṁ_fuel/F

---

## 5. Materials Science

### Crystal Structures
- **BCC** (body-centered cubic): Fe(α), W, Cr — 2 atoms/unit cell
- **FCC** (face-centered cubic): Al, Cu, Au, Ni — 4 atoms/unit cell
- **HCP** (hexagonal close-packed): Mg, Ti, Zn — 6 atoms/unit cell
- **APF**: BCC = 0.68, FCC = 0.74, HCP = 0.74

### Defects
- **Point defects**: Vacancies, interstitials, substitutional
- **Line defects**: Edge dislocation, screw dislocation — enable plastic deformation
- **Grain boundaries**: Interface between differently oriented crystals

### Mechanical Properties
- **Yield strength**: Stress at onset of permanent deformation
- **Ultimate tensile strength**: Maximum stress before necking
- **Ductility**: % elongation or % reduction in area
- **Hardness**: Resistance to indentation (Vickers, Brinell, Rockwell)
- **Toughness**: Area under stress-strain curve (energy absorbed before fracture)
- **Fatigue**: Failure under cyclic loading below yield (S-N curve)
- **Creep**: Time-dependent deformation under constant load at elevated temperature

### Phase Diagrams
- **Binary eutectic**: Two components, eutectic point (lowest melting mixture)
- **Lever rule**: Weight fraction of phases from composition on tie line
- **Iron-carbon diagram**: Ferrite (α, BCC), Austenite (γ, FCC), Cementite (Fe₃C)
  - Eutectoid: 0.76 wt% C at 727°C → pearlite (ferrite + cementite)
  - Eutectic: 4.30 wt% C at 1147°C → ledeburite

---

## 6. Control Systems

### Transfer Functions
- **Open-loop**: G(s) = Y(s)/U(s)
- **Closed-loop**: T(s) = G(s)/(1 + G(s)H(s)) with feedback H(s)
- **Poles and zeros**: Poles = roots of denominator (stability), zeros = roots of numerator

### Stability
- **BIBO stability**: Bounded input → bounded output iff all poles have Re(s) < 0
- **Routh-Hurwitz criterion**: Algebraic test for left-half-plane poles
- **Nyquist criterion**: Encirclements of -1 in Nyquist plot determine stability
- **Phase margin**: Phase at gain crossover + 180° (> 0 for stability)
- **Gain margin**: 1/|G(jω)| at phase crossover (> 1 for stability)
- **Root locus**: Tracks poles as gain K varies

### PID Control
- **P**: Proportional — reduces error, may not eliminate steady-state error
- **I**: Integral — eliminates steady-state error, can cause overshoot
- **D**: Derivative — reduces overshoot, sensitive to noise
- **Transfer function**: C(s) = K_p + K_i/s + K_ds

### State-Space Representation
- ẋ = Ax + Bu (state equation)
- y = Cx + Du (output equation)
- **Controllability**: rank[B AB A²B ... A^(n-1)B] = n
- **Observability**: rank[C; CA; CA²; ...; CA^(n-1)] = n

---

## 7. Chemical Engineering

### Transport Phenomena
- **Mass transfer**: Fick's law: J = -D(dc/dx)
- **Heat transfer**: Fourier's law: q = -k(dT/dx)
- **Momentum transfer**: Newton's law of viscosity: τ = μ(dv/dy)
- **Analogy**: Heat, mass, and momentum transfer are analogous (Reynolds analogy)

### Reactor Design
- **Batch reactor**: dN_A/dt = r_A V
- **CSTR**: V = F_A0 X_A / (-r_A) (well-mixed, uniform composition)
- **PFR**: V = F_A0 ∫₀^X_A dX_A/(-r_A) (plug flow, no axial mixing)
- **Residence time**: τ = V/Q
- **Conversion**: X_A = (N_A0 - N_A)/N_A0

### Separation Processes
- **Distillation**: Separation by boiling point differences
  - McCabe-Thiele: Graphical method for tray-by-tray design
  - Relative volatility: α = (y_A/x_A) / (y_B/x_B)
- **Absorption**: Gas into liquid using packed or tray columns
- **Extraction**: Liquid-liquid separation using solvent
- **Membrane**: Reverse osmosis, ultrafiltration, pervaporation
- **Crystallization**: Solid from solution by cooling or evaporation

### Dimensionless Numbers
| Number | Formula | Physical Meaning |
|---|---|---|
| Reynolds (Re) | ρvL/μ | Inertia / viscous forces |
| Nusselt (Nu) | hL/k | Convective / conductive heat transfer |
| Prandtl (Pr) | c_pμ/k | Momentum / thermal diffusivity |
| Schmidt (Sc) | μ/(ρD) | Momentum / mass diffusivity |
| Sherwood (Sh) | k_cL/D | Convective / diffusive mass transfer |
| Damköhler (Da) | reaction rate / transport rate | Reaction vs transport timescale |
