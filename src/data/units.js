// Unit conversion definitions
// Each category has units with a factor to convert TO the base unit
// To convert A -> B: value * A.factor / B.factor

export const unitCategories = [
  {
    id: 'pressure',
    label: 'Pressure',
    base: 'Pa',
    units: [
      { id: 'pa',   label: 'Pascal (Pa)',         factor: 1 },
      { id: 'kpa',  label: 'Kilopascal (kPa)',    factor: 1e3 },
      { id: 'mpa',  label: 'Megapascal (MPa)',    factor: 1e6 },
      { id: 'bar',  label: 'Bar',                 factor: 1e5 },
      { id: 'mbar', label: 'Millibar (mbar)',      factor: 100 },
      { id: 'psi',  label: 'PSI (lb/in²)',         factor: 6894.757 },
      { id: 'atm',  label: 'Atmosphere (atm)',     factor: 101325 },
      { id: 'mmhg', label: 'mmHg (Torr)',          factor: 133.322 },
      { id: 'mwc',  label: 'Metres Water Col.',    factor: 9806.65 },
    ]
  },
  {
    id: 'temperature',
    label: 'Temperature',
    base: 'K',
    // Temperature needs special handling — not a simple factor
    special: 'temperature',
    units: [
      { id: 'c',  label: 'Celsius (°C)'    },
      { id: 'f',  label: 'Fahrenheit (°F)' },
      { id: 'k',  label: 'Kelvin (K)'      },
    ]
  },
  {
    id: 'flow',
    label: 'Flow Rate',
    base: 'm³/s',
    units: [
      { id: 'm3s',  label: 'm³/s',          factor: 1 },
      { id: 'm3h',  label: 'm³/h',          factor: 1/3600 },
      { id: 'ls',   label: 'L/s',           factor: 0.001 },
      { id: 'lm',   label: 'L/min',         factor: 0.001/60 },
      { id: 'lh',   label: 'L/h',           factor: 0.001/3600 },
      { id: 'gpm',  label: 'GPM (US gal)',   factor: 6.30902e-5 },
      { id: 'cfm',  label: 'CFM (ft³/min)', factor: 4.71947e-4 },
    ]
  },
  {
    id: 'power',
    label: 'Power',
    base: 'W',
    units: [
      { id: 'w',   label: 'Watt (W)',         factor: 1 },
      { id: 'kw',  label: 'Kilowatt (kW)',    factor: 1e3 },
      { id: 'mw',  label: 'Megawatt (MW)',    factor: 1e6 },
      { id: 'hp',  label: 'Horsepower (hp)', factor: 745.7 },
      { id: 'kva', label: 'Kilovolt-amp (kVA)', factor: 1e3 },
      { id: 'mva', label: 'Megavolt-amp (MVA)', factor: 1e6 },
    ]
  },
  {
    id: 'voltage',
    label: 'Voltage / Current',
    base: 'V',
    units: [
      { id: 'uv', label: 'Microvolt (µV)', factor: 1e-6 },
      { id: 'mv', label: 'Millivolt (mV)', factor: 1e-3 },
      { id: 'v',  label: 'Volt (V)',       factor: 1 },
      { id: 'kv', label: 'Kilovolt (kV)', factor: 1e3 },
    ]
  },
  {
    id: 'current',
    label: 'Current',
    base: 'A',
    units: [
      { id: 'ua', label: 'Microamp (µA)',  factor: 1e-6 },
      { id: 'ma', label: 'Milliamp (mA)', factor: 1e-3 },
      { id: 'a',  label: 'Amp (A)',        factor: 1 },
      { id: 'ka', label: 'Kiloamp (kA)',  factor: 1e3 },
    ]
  },
  {
    id: 'length',
    label: 'Length',
    base: 'm',
    units: [
      { id: 'mm',  label: 'Millimetre (mm)', factor: 0.001 },
      { id: 'cm',  label: 'Centimetre (cm)', factor: 0.01 },
      { id: 'm',   label: 'Metre (m)',        factor: 1 },
      { id: 'km',  label: 'Kilometre (km)',  factor: 1000 },
      { id: 'in',  label: 'Inch (in)',        factor: 0.0254 },
      { id: 'ft',  label: 'Foot (ft)',        factor: 0.3048 },
    ]
  },
  {
    id: 'energy',
    label: 'Energy',
    base: 'J',
    units: [
      { id: 'j',   label: 'Joule (J)',           factor: 1 },
      { id: 'kj',  label: 'Kilojoule (kJ)',      factor: 1e3 },
      { id: 'kwh', label: 'Kilowatt-hour (kWh)', factor: 3.6e6 },
      { id: 'mwh', label: 'Megawatt-hour (MWh)', factor: 3.6e9 },
      { id: 'cal', label: 'Calorie (cal)',        factor: 4.184 },
    ]
  },
]

// Temperature special conversion (to/from Kelvin as base)
export function toKelvin(value, fromId) {
  if (fromId === 'c') return value + 273.15
  if (fromId === 'f') return (value - 32) * 5/9 + 273.15
  return value // already kelvin
}

export function fromKelvin(kelvin, toId) {
  if (toId === 'c') return kelvin - 273.15
  if (toId === 'f') return (kelvin - 273.15) * 9/5 + 32
  return kelvin
}
