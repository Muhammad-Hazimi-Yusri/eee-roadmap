// src/data/advanced.ts

import type { RoadmapSection } from '../types/roadmap';

export const advancedRoadmap: RoadmapSection[] = [
  {
    id: 'power-electronics',
    title: 'Power Electronics',
    items: [
      {
        id: 'dc-dc-converters',
        title: 'DC-DC Converters',
        description: 'Efficiently change voltage levels. Buck steps down, boost steps up, buck-boost does both. Switching converters are far more efficient than linear regulators — essential for battery-powered devices.',
        prerequisites: ['fundamentals/inductors/Inductors & Transformers', 'fundamentals/diodes/Diodes', 'core/transistors/Transistors'],
        outcomes: [
          'Analyze buck, boost, and buck-boost topologies',
          'Calculate duty cycle for desired output voltage',
          'Design inductor and capacitor values',
          'Understand continuous vs discontinuous conduction',
        ],
        concepts: ['Buck converter', 'Boost converter', 'Duty cycle', 'CCM/DCM'],
        resources: [
          { label: 'MIT OCW 6.334', url: 'https://ocw.mit.edu/courses/6-334-power-electronics-spring-2007/' },
          { label: 'All About Circuits - SMPS', url: 'https://www.allaboutcircuits.com/textbook/semiconductors/chpt-11/switched-mode-power-supplies/' },
        ],
      },
      {
        id: 'inverters',
        title: 'Inverters & Rectifiers',
        description: 'Bridge between AC and DC worlds. Rectifiers convert AC to DC (power supplies), inverters convert DC to AC (motor drives, solar systems). PWM techniques control output waveform quality.',
        prerequisites: ['advanced/dc-dc-converters/DC-DC Converters', 'fundamentals/ac-circuits/AC Circuits'],
        outcomes: [
          'Design single and three-phase rectifiers',
          'Analyze inverter switching patterns',
          'Understand PWM for waveform synthesis',
          'Calculate power factor and THD',
        ],
        concepts: ['Bridge rectifier', 'H-bridge', 'PWM', 'THD'],
        resources: [
          { label: 'MIT OCW 6.334', url: 'https://ocw.mit.edu/courses/6-334-power-electronics-spring-2007/' },
        ],
      },
      {
        id: 'power-devices',
        title: 'Power Semiconductor Devices',
        description: 'MOSFETs and IGBTs handle the heavy lifting. Understand switching losses, thermal management, and safe operating areas. Device selection determines efficiency, size, and cost of your power stage.',
        prerequisites: ['core/transistors/Transistors', 'advanced/dc-dc-converters/DC-DC Converters'],
        outcomes: [
          'Select appropriate power devices for application',
          'Calculate switching and conduction losses',
          'Design heatsinking for thermal management',
          'Understand gate drive requirements',
        ],
        concepts: ['Power MOSFET', 'IGBT', 'Switching losses', 'Thermal design'],
        optional: true,
        resources: [
          { label: 'MIT OCW 6.334', url: 'https://ocw.mit.edu/courses/6-334-power-electronics-spring-2007/' },
          { label: 'Infineon Power Devices', url: 'https://www.infineon.com/cms/en/product/power/' },
        ],
      },
    ],
  },
  {
    id: 'control-systems',
    title: 'Control Systems',
    items: [
      {
        id: 'feedback-control',
        title: 'Feedback Control Fundamentals',
        description: 'Make systems do what you want. Feedback compares actual output to desired setpoint and adjusts input accordingly. Negative feedback stabilizes, positive feedback can oscillate. The foundation of automation.',
        prerequisites: ['core/laplace-z-transform/Laplace Transform', 'core/signal-basics/Signals & Systems'],
        outcomes: [
          'Analyze open and closed-loop systems',
          'Derive transfer functions from block diagrams',
          'Understand steady-state error',
          'Determine system stability using pole locations',
        ],
        concepts: ['Open/closed loop', 'Transfer function', 'Steady-state error', 'Stability'],
        resources: [
          { label: 'Brian Douglas - Control Systems', url: 'https://www.youtube.com/@BrianDouglas' },
          { label: 'MIT OCW Feedback Control', url: 'https://ocw.mit.edu/courses/16-06-principles-of-automatic-control-fall-2012/' },
        ],
      },
      {
        id: 'pid-control',
        title: 'PID Controllers',
        description: 'The workhorse of industrial control. Proportional reduces error, Integral eliminates steady-state error, Derivative predicts and dampens. Tune these three gains and solve most control problems.',
        prerequisites: ['advanced/feedback-control/Feedback Control Fundamentals'],
        outcomes: [
          'Design PID controllers for simple systems',
          'Tune PID gains using various methods',
          'Understand the effect of each gain term',
          'Implement PID in software and hardware',
        ],
        concepts: ['P, I, D terms', 'Tuning methods', 'Anti-windup', 'Derivative kick'],
        resources: [
          { label: 'Brian Douglas - PID', url: 'https://www.youtube.com/@BrianDouglas' },
          { label: 'Neso Academy - Control', url: 'https://www.nesoacademy.org/ee/06-control-systems' },
        ],
      },
      {
        id: 'stability-analysis',
        title: 'Stability Analysis',
        description: 'Before building, prove your system won\'t oscillate or run away. Bode plots show frequency response, Nyquist plots reveal stability margins, Root locus shows how poles move with gain changes.',
        prerequisites: ['advanced/pid-control/PID Controllers', 'Complex Analysis'],
        outcomes: [
          'Construct and interpret Bode plots',
          'Determine gain and phase margins',
          'Apply Nyquist stability criterion',
          'Use root locus for controller design',
        ],
        concepts: ['Bode plot', 'Gain/phase margin', 'Nyquist', 'Root locus'],
        optional: true,
        resources: [
          { label: 'Brian Douglas - Stability', url: 'https://www.youtube.com/@BrianDouglas' },
          { label: 'Engineering Media - Control', url: 'https://engineeringmedia.com/' },
        ],
      },
    ],
  },
  {
    id: 'rf-microwave',
    title: 'RF & Microwave',
    items: [
      {
        id: 'transmission-lines',
        title: 'Transmission Lines',
        description: 'At high frequencies, wires become distributed circuits. Characteristic impedance, reflections, and standing waves dominate. Match impedances or lose power to reflections. The 50Ω standard exists for good reasons.',
        prerequisites: ['fundamentals/ac-circuits/AC Circuits', 'Electromagnetism'],
        outcomes: [
          'Calculate characteristic impedance',
          'Understand reflections and VSWR',
          'Use transmission line equations',
          'Design matching networks',
        ],
        concepts: ['Characteristic impedance', 'Reflection coefficient', 'VSWR', 'Matching'],
        resources: [
          { label: 'W2AEW RF Tutorials', url: 'https://www.qsl.net/w2aew/' },
          { label: 'Tutorials Point - Microwave', url: 'https://www.tutorialspoint.com/microwave_engineering/index.htm' },
        ],
      },
      {
        id: 'smith-chart',
        title: 'Smith Chart',
        description: 'A graphical tool that turns complex impedance calculations into geometry. Plot impedances, read reflections, design matching networks. Once cryptic, now your best friend for RF work.',
        prerequisites: ['advanced/transmission-lines/Transmission Lines', 'Complex numbers'],
        outcomes: [
          'Navigate the Smith chart',
          'Convert between impedance and reflection coefficient',
          'Design L and pi matching networks',
          'Use VNA data with Smith chart',
        ],
        concepts: ['Impedance mapping', 'Matching network design', 'VNA measurements'],
        resources: [
          { label: 'W2AEW - Smith Chart', url: 'https://www.qsl.net/w2aew/' },
        ],
      },
      {
        id: 'antennas',
        title: 'Antenna Fundamentals',
        description: 'The interface between circuits and free space. Dipoles are simple and effective, Yagis add directionality, patches fit in tight spaces. Impedance matching and radiation patterns determine performance.',
        prerequisites: ['advanced/transmission-lines/Transmission Lines', 'fundamentals/maxwell-equations/Maxwell\'s Equations helpful'],
        outcomes: [
          'Understand antenna radiation patterns',
          'Calculate dipole and monopole characteristics',
          'Match antennas to transmission lines',
          'Interpret antenna specifications (gain, beamwidth)',
        ],
        concepts: ['Radiation pattern', 'Gain', 'Polarization', 'Impedance matching'],
        optional: true,
        resources: [
          { label: 'ARRL Antenna Book (concepts)', url: 'https://www.arrl.org/arrl-antenna-book' },
        ],
      },
    ],
  },
  {
    id: 'communications',
    title: 'Communication Systems',
    items: [
      {
        id: 'modulation',
        title: 'Analog & Digital Modulation',
        description: 'Encode information onto carrier waves. AM and FM for analog audio, ASK/FSK/PSK for digital data, QAM for high spectral efficiency. Modulation choice trades bandwidth, power, and noise immunity.',
        prerequisites: ['core/fourier-analysis/Fourier Analysis', 'core/signal-basics/Signals & Systems'],
        outcomes: [
          'Analyze AM and FM signals',
          'Understand digital modulation schemes',
          'Calculate bandwidth requirements',
          'Compare BER performance of different schemes',
        ],
        concepts: ['AM/FM', 'ASK/FSK/PSK', 'QAM', 'Bandwidth efficiency'],
        resources: [
          { label: 'All About Circuits - Modulation', url: 'https://www.allaboutcircuits.com/textbook/radio-frequency-analysis-design/' },
          { label: 'Tutorials Point - Communications', url: 'https://www.tutorialspoint.com/analog_communication/index.htm' },
        ],
      },
      {
        id: 'channel-coding',
        title: 'Channel Coding & Error Correction',
        description: 'Combat noise with redundancy. Parity bits detect single errors, Hamming codes correct them, convolutional and turbo codes approach theoretical limits. Essential for reliable digital communication.',
        prerequisites: ['core/boolean-logic-gates/Digital Logic basics', 'Probability concepts'],
        outcomes: [
          'Implement simple error detection schemes',
          'Understand Hamming code principles',
          'Calculate code rate and overhead',
          'Appreciate Shannon\'s channel capacity theorem',
        ],
        concepts: ['Parity', 'Hamming code', 'CRC', 'Shannon limit'],
        optional: true,
        resources: [
          { label: 'Ben Eater - Error Detection', url: 'https://eater.net/' },
          { label: '3Blue1Brown - Hamming Codes', url: 'https://www.youtube.com/watch?v=X8jsijhllIA' },
        ],
      },
      {
        id: 'wireless-systems',
        title: 'Wireless System Design',
        description: 'Put it all together: transmitter, channel, receiver. Link budgets predict range, fading models capture real-world impairments, protocols manage access. From WiFi to cellular to satellite.',
        prerequisites: ['advanced/modulation/Modulation', 'advanced/antennas/Antenna basics'],
        outcomes: [
          'Calculate link budget for wireless systems',
          'Understand propagation and fading effects',
          'Analyze receiver sensitivity requirements',
          'Compare different wireless standards',
        ],
        concepts: ['Link budget', 'Path loss', 'Fading', 'RSSI'],
        optional: true,
        resources: [
          { label: 'Tutorials Point - Wireless', url: 'https://www.tutorialspoint.com/wireless_communication/index.htm' },
          { label: 'All About Circuits - RF Design', url: 'https://www.allaboutcircuits.com/textbook/radio-frequency-analysis-design/' },
        ],
      },
    ],
  },
  {
    id: 'power-systems',
    title: 'Power Systems',
    items: [
      {
        id: 'power-generation',
        title: 'Power Generation',
        description: 'How electricity gets made. Synchronous generators convert mechanical energy to electrical, whether from steam turbines, hydro, wind, or gas. Understanding generation basics matters for grid integration.',
        prerequisites: ['fundamentals/ac-circuits/AC Circuits', 'Electromagnetism', 'fundamentals/inductors/Transformers'],
        outcomes: [
          'Understand synchronous generator operation',
          'Analyze three-phase power generation',
          'Calculate power and efficiency',
          'Compare generation technologies',
        ],
        concepts: ['Synchronous generator', 'Three-phase', 'Frequency regulation', 'Renewables'],
        resources: [
          { label: 'All About Circuits - AC Generation', url: 'https://www.allaboutcircuits.com/textbook/alternating-current/chpt-13/three-phase-y-delta-configurations/' },
          { label: 'MIT OCW Power Systems', url: 'https://ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/' },
        ],
      },
      {
        id: 'transmission-distribution',
        title: 'Transmission & Distribution',
        description: 'Moving power from generators to loads efficiently. High voltage reduces losses (P=I²R), transformers change voltage levels, protection systems isolate faults. The grid is an engineering marvel.',
        prerequisites: ['advanced/power-generation/Power Generation', 'Three-phase circuits'],
        outcomes: [
          'Calculate transmission line losses',
          'Understand transformer connections in power systems',
          'Analyze simple power flow',
          'Appreciate protection system requirements',
        ],
        concepts: ['Transmission lines', 'Substations', 'Power flow', 'Protection'],
        resources: [
          { label: 'MIT OCW 6.061', url: 'https://ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/' },
          { label: 'All About Circuits - Three Phase', url: 'https://www.allaboutcircuits.com/textbook/alternating-current/chpt-10/three-phase-power-systems/' },
        ],
      },
      {
        id: 'grid-integration',
        title: 'Grid Integration & Smart Grid',
        description: 'Modern grids are bidirectional and intelligent. Renewables require storage and forecasting, EVs add load, smart meters enable demand response. Power electronics interfaces everything to the grid.',
        prerequisites: ['advanced/transmission-distribution/Transmission & Distribution', 'advanced/dc-dc-converters/Power Electronics basics'],
        outcomes: [
          'Understand grid integration challenges for renewables',
          'Analyze energy storage requirements',
          'Appreciate smart grid concepts',
          'Understand power quality issues',
        ],
        concepts: ['Grid-tie inverters', 'Energy storage', 'Demand response', 'Power quality'],
        optional: true,
        resources: [
          { label: 'DOE Smart Grid', url: 'https://www.smartgrid.gov/the_smart_grid/' },
          { label: 'MIT OCW Power Systems', url: 'https://ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/' },
        ],
      },
    ],
  },
];