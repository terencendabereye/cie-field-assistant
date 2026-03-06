export const formulaCategories = [
  {
    id: 'electrical',
    label: 'Electrical',
    formulas: [
      { id: 'ohm',     title: "Ohm's Law",            formula: "V = I × R",                  vars: "V=Voltage(V), I=Current(A), R=Resistance(Ω)" },
      { id: 'power1',  title: "Power (DC)",             formula: "P = V × I",                  vars: "P=Power(W), V=Voltage(V), I=Current(A)" },
      { id: 'power2',  title: "Power (from R)",         formula: "P = I² × R = V² / R",        vars: "P=Power(W), I=Current(A), R=Resistance(Ω)" },
      { id: 'react',   title: "Reactance (Inductive)",  formula: "X_L = 2π × f × L",           vars: "X_L=Reactance(Ω), f=Frequency(Hz), L=Inductance(H)" },
      { id: 'reactc',  title: "Reactance (Capacitive)", formula: "X_C = 1 / (2π × f × C)",     vars: "X_C=Reactance(Ω), f=Frequency(Hz), C=Capacitance(F)" },
      { id: 'impedan', title: "Impedance",              formula: "Z = √(R² + X²)",              vars: "Z=Impedance(Ω), R=Resistance(Ω), X=Reactance(Ω)" },
      { id: 'pf',      title: "Power Factor",           formula: "PF = cos(φ) = P / S",        vars: "PF=Power Factor, P=Real Power(W), S=Apparent Power(VA)" },
      { id: 'apparent',title: "Apparent Power",         formula: "S = V × I = √(P² + Q²)",     vars: "S=Apparent(VA), P=Real(W), Q=Reactive(VAR)" },
      { id: '3phase',  title: "3-Phase Power",          formula: "P = √3 × V_L × I_L × PF",   vars: "V_L=Line Voltage, I_L=Line Current, PF=Power Factor" },
      { id: 'trans',   title: "Transformer Ratio",      formula: "V1/V2 = N1/N2 = I2/I1",     vars: "V=Voltage, N=Turns, I=Current (1=primary, 2=secondary)" },
      { id: 'effic',   title: "Efficiency",             formula: "η = P_out / P_in × 100%",    vars: "η=Efficiency(%), P_out=Output Power, P_in=Input Power" },
    ]
  },
  {
    id: 'instrumentation',
    label: 'Instrumentation',
    formulas: [
      { id: 'interp',  title: "Linear Interpolation",  formula: "y = y1 + (x−x1)(y2−y1)/(x2−x1)", vars: "Known points (x1,y1) and (x2,y2), input x" },
      { id: 'ma420',   title: "4-20mA Scaling",        formula: "PV% = (mA − 4) / 16 × 100",  vars: "PV%=Process %, mA=measured current" },
      { id: 'span',    title: "Span & Zero",           formula: "Output = (Input − Zero) / Span × 100%", vars: "Zero=lower range, Span=(upper−lower)" },
      { id: 'rtd',     title: "PT100 Resistance",      formula: "R_T = R_0 × (1 + α×T)",       vars: "R_0=100Ω at 0°C, α=0.00385°C⁻¹, T=Temp(°C)" },
      { id: 'kfact',   title: "K-Factor (Flow)",       formula: "Q = f / K",                   vars: "Q=Flow, f=Pulse frequency, K=pulses per unit" },
      { id: 'dp',      title: "DP Flow (Differential)",formula: "Q = K × √(ΔP)",               vars: "Q=Flow, K=constant, ΔP=Differential pressure" },
    ]
  },
  {
    id: 'hydro',
    label: 'Hydro / Fluid',
    formulas: [
      { id: 'hpower',  title: "Hydraulic Power",       formula: "P = ρ × g × Q × H",          vars: "ρ=density(kg/m³), g=9.81m/s², Q=flow(m³/s), H=head(m)" },
      { id: 'bernoul', title: "Bernoulli's Equation",  formula: "P1+½ρv1²+ρgh1 = P2+½ρv2²+ρgh2", vars: "P=pressure, v=velocity, h=height, ρ=density" },
      { id: 'reynold', title: "Reynolds Number",       formula: "Re = ρ × v × D / μ",         vars: "ρ=density, v=velocity, D=diameter, μ=dynamic viscosity" },
      { id: 'contin',  title: "Continuity Equation",   formula: "A1 × v1 = A2 × v2 = Q",      vars: "A=area(m²), v=velocity(m/s), Q=flow(m³/s)" },
      { id: 'headloss',title: "Head Loss (Darcy)",     formula: "h_f = f × L/D × v²/(2g)",    vars: "f=friction factor, L=length, D=diameter, v=velocity" },
      { id: 'torque',  title: "Turbine Torque",        formula: "T = P / ω",                   vars: "T=Torque(Nm), P=Power(W), ω=angular velocity(rad/s)" },
      { id: 'specspd', title: "Specific Speed",        formula: "N_s = N × √Q / H^(3/4)",     vars: "N=speed(rpm), Q=flow(m³/s), H=head(m)" },
    ]
  },
  {
    id: 'protection',
    label: 'Protection',
    formulas: [
      { id: 'ct',      title: "CT Burden",             formula: "Burden(VA) = I² × Z",        vars: "I=secondary current(A), Z=load impedance(Ω)" },
      { id: 'fault',   title: "Fault Current (3-ph)",  formula: "I_f = V_L / (√3 × Z_total)", vars: "V_L=line voltage(V), Z_total=total impedance(Ω)" },
      { id: 'relay',   title: "IDMT Operate Time",     formula: "t = TMS × k / ((I/Is)^α − 1)", vars: "TMS=time multiplier, Is=setting, k & α per curve standard" },
      { id: 'earthflt',title: "Earth Fault (Residual)",formula: "I_e = I_A + I_B + I_C",      vars: "Sum of three phase currents; non-zero indicates earth fault" },
    ]
  }
]
