// All formulas now use LaTeX expressions for KaTeX rendering
export const formulaCategories = [
  {
    id: 'electrical',
    label: 'Electrical',
    formulas: [
      { id: 'ohm',      title: "Ohm's Law",             expr: 'V = I \\cdot R',                          vars: 'V = Voltage (V),\\ I = Current (A),\\ R = Resistance (\\Omega)' },
      { id: 'power1',   title: "Power (DC)",              expr: 'P = V \\cdot I',                          vars: 'P = Power (W),\\ V = Voltage (V),\\ I = Current (A)' },
      { id: 'power2',   title: "Power (from resistance)", expr: 'P = I^2 R = \\frac{V^2}{R}',             vars: 'P = Power (W),\\ I = Current (A),\\ R = Resistance (\\Omega)' },
      { id: 'react',    title: "Inductive Reactance",     expr: 'X_L = 2\\pi f L',                         vars: 'X_L = Reactance (\\Omega),\\ f = Frequency (Hz),\\ L = Inductance (H)' },
      { id: 'reactc',   title: "Capacitive Reactance",    expr: 'X_C = \\frac{1}{2\\pi f C}',              vars: 'X_C = Reactance (\\Omega),\\ f = Frequency (Hz),\\ C = Capacitance (F)' },
      { id: 'impedan',  title: "Impedance",               expr: 'Z = \\sqrt{R^2 + X^2}',                  vars: 'Z = Impedance (\\Omega),\\ R = Resistance (\\Omega),\\ X = Reactance (\\Omega)' },
      { id: 'pf',       title: "Power Factor",            expr: 'PF = \\cos(\\phi) = \\frac{P}{S}',        vars: 'PF = Power Factor,\\ P = Real Power (W),\\ S = Apparent Power (VA)' },
      { id: 'apparent', title: "Apparent Power",          expr: 'S = VI = \\sqrt{P^2 + Q^2}',              vars: 'S = Apparent (VA),\\ P = Real (W),\\ Q = Reactive (VAR)' },
      { id: '3phase',   title: "3-Phase Power",           expr: 'P = \\sqrt{3}\\, V_L I_L \\cos(\\phi)',   vars: 'V_L = Line Voltage,\\ I_L = Line Current,\\ \\phi = Power Factor angle' },
      { id: 'trans',    title: "Transformer Ratio",       expr: '\\frac{V_1}{V_2} = \\frac{N_1}{N_2} = \\frac{I_2}{I_1}', vars: 'V = Voltage,\\ N = Turns,\\ I = Current\\ (1=primary,\\ 2=secondary)' },
      { id: 'effic',    title: "Efficiency",              expr: '\\eta = \\frac{P_{out}}{P_{in}} \\times 100\\%', vars: '\\eta = Efficiency,\\ P_{out} = Output Power,\\ P_{in} = Input Power' },
    ]
  },
  {
    id: 'instrumentation',
    label: 'Instrumentation',
    formulas: [
      { id: 'interp',  title: "Linear Interpolation",  expr: 'y = y_1 + \\frac{(x - x_1)(y_2 - y_1)}{x_2 - x_1}', vars: 'Known points (x_1, y_1)\\ and\\ (x_2, y_2),\\ input\\ x' },
      { id: 'ma420',   title: "4-20 mA Scaling",       expr: 'PV\\% = \\frac{I - 4}{16} \\times 100',    vars: 'PV\\% = Process\\ percentage,\\ I = measured\\ current\\ (mA)' },
      { id: 'span',    title: "Span & Zero",           expr: 'Out = \\frac{In - Zero}{Span} \\times 100\\%', vars: 'Zero = lower\\ range\\ value,\\ Span = upper - lower' },
      { id: 'rtd',     title: "PT100 Resistance",      expr: 'R_T = R_0 (1 + \\alpha T)',                vars: 'R_0 = 100\\Omega\\ at\\ 0°C,\\ \\alpha = 0.00385\\ °C^{-1},\\ T = Temperature\\ (°C)' },
      { id: 'kfact',   title: "K-Factor (Flow)",       expr: 'Q = \\frac{f}{K}',                        vars: 'Q = Flow,\\ f = Pulse\\ frequency,\\ K = pulses\\ per\\ unit' },
      { id: 'dp',      title: "DP Flow",               expr: 'Q = K\\sqrt{\\Delta P}',                   vars: 'Q = Flow,\\ K = constant,\\ \\Delta P = Differential\\ pressure' },
    ]
  },
  {
    id: 'hydro',
    label: 'Hydro / Fluid',
    formulas: [
      { id: 'hpower',   title: "Hydraulic Power",      expr: 'P = \\rho g Q H',                          vars: '\\rho = density\\ (kg/m^3),\\ g = 9.81\\ m/s^2,\\ Q = flow\\ (m^3/s),\\ H = head\\ (m)' },
      { id: 'bernoul',  title: "Bernoulli Equation",   expr: 'P_1 + \\tfrac{1}{2}\\rho v_1^2 + \\rho g h_1 = P_2 + \\tfrac{1}{2}\\rho v_2^2 + \\rho g h_2', vars: 'P = pressure,\\ v = velocity,\\ h = height,\\ \\rho = density' },
      { id: 'reynold',  title: "Reynolds Number",      expr: 'Re = \\frac{\\rho v D}{\\mu}',              vars: '\\rho = density,\\ v = velocity,\\ D = diameter,\\ \\mu = dynamic\\ viscosity' },
      { id: 'contin',   title: "Continuity Equation",  expr: 'A_1 v_1 = A_2 v_2 = Q',                   vars: 'A = area\\ (m^2),\\ v = velocity\\ (m/s),\\ Q = flow\\ (m^3/s)' },
      { id: 'headloss', title: "Head Loss (Darcy)",    expr: 'h_f = f \\frac{L}{D} \\frac{v^2}{2g}',     vars: 'f = friction\\ factor,\\ L = length,\\ D = diameter,\\ v = velocity' },
      { id: 'torque',   title: "Turbine Torque",       expr: 'T = \\frac{P}{\\omega}',                    vars: 'T = Torque\\ (Nm),\\ P = Power\\ (W),\\ \\omega = angular\\ velocity\\ (rad/s)' },
      { id: 'specspd',  title: "Specific Speed",       expr: 'N_s = \\frac{N\\sqrt{Q}}{H^{3/4}}',        vars: 'N = speed\\ (rpm),\\ Q = flow\\ (m^3/s),\\ H = head\\ (m)' },
    ]
  },
  {
    id: 'protection',
    label: 'Protection',
    formulas: [
      { id: 'ct',       title: "CT Burden",            expr: 'Burden\\ (VA) = I^2 Z',                    vars: 'I = secondary\\ current\\ (A),\\ Z = load\\ impedance\\ (\\Omega)' },
      { id: 'fault',    title: "3-Phase Fault Current",expr: 'I_f = \\frac{V_L}{\\sqrt{3}\\, Z_{total}}', vars: 'V_L = line\\ voltage\\ (V),\\ Z_{total} = total\\ impedance\\ (\\Omega)' },
      { id: 'relay',    title: "IDMT Operate Time",    expr: 't = TMS \\cdot \\frac{k}{\\left(\\frac{I}{I_s}\\right)^\\alpha - 1}', vars: 'TMS = time\\ multiplier,\\ I_s = setting,\\ k\\ and\\ \\alpha\\ per\\ curve\\ standard' },
      { id: 'earthflt', title: "Residual Earth Fault", expr: 'I_e = I_A + I_B + I_C',                    vars: 'Sum\\ of\\ three\\ phase\\ currents;\\ non-zero\\ indicates\\ earth\\ fault' },
    ]
  }
]