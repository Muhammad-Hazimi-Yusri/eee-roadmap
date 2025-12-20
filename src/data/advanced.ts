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
        concepts: [
          { name: 'Buck converter' },
          { name: 'Boost converter' },
          { name: 'Duty cycle' },
          { name: 'CCM/DCM' },
        ],
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
        concepts: [
          { name: 'Bridge rectifier' },
          { name: 'H-bridge' },
          { name: 'PWM' },
          { name: 'THD' },
        ],
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
        concepts: [
          { name: 'Power MOSFET' },
          { name: 'IGBT' },
          { name: 'Switching losses' },
          { name: 'Thermal design' },
        ],
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
        concepts: [
          { name: 'Open/closed loop' },
          { name: 'Transfer function' },
          { name: 'Steady-state error' },
          { name: 'Stability' },
        ],
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
        concepts: [
          { name: 'P, I, D terms' },
          { name: 'Tuning methods' },
          { name: 'Anti-windup' },
          { name: 'Derivative kick' },
        ],
        resources: [
          { label: 'Brian Douglas - PID', url: 'https://www.youtube.com/@BrianDouglas' },
          { label: 'Neso Academy - Control', url: 'https://www.nesoacademy.org/ee/06-control-systems' },
        ],
      },
      {
        id: 'stability-analysis',
        title: 'Stability Analysis',
        description: "Before building, prove your system won't oscillate or run away. Bode plots show frequency response, Nyquist plots reveal stability margins, Root locus shows how poles move with gain changes.",
        prerequisites: ['advanced/pid-control/PID Controllers', 'Complex Analysis'],
        outcomes: [
          'Construct and interpret Bode plots',
          'Determine gain and phase margins',
          'Apply Nyquist stability criterion',
          'Use root locus for controller design',
        ],
        concepts: [
          { name: 'Bode plot' },
          { name: 'Gain/phase margin' },
          { name: 'Nyquist' },
          { name: 'Root locus' },
        ],
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
        concepts: [
          { name: 'Characteristic impedance' },
          { name: 'Reflection coefficient' },
          { name: 'VSWR' },
          { name: 'Matching' },
        ],
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
        concepts: [
          { name: 'Impedance mapping' },
          { name: 'Matching network design' },
          { name: 'VNA measurements' },
        ],
        resources: [
          { label: 'W2AEW - Smith Chart', url: 'https://www.qsl.net/w2aew/' },
        ],
      },
      {
        id: 'antennas',
        title: 'Antenna Fundamentals',
        description: 'The interface between circuits and free space. Dipoles are simple and effective, Yagis add directionality, patches fit in tight spaces. Impedance matching and radiation patterns determine performance.',
        prerequisites: ['advanced/transmission-lines/Transmission Lines', "fundamentals/maxwell-equations/Maxwell's Equations helpful"],
        outcomes: [
          'Understand antenna radiation patterns',
          'Calculate dipole and monopole characteristics',
          'Match antennas to transmission lines',
          'Interpret antenna specifications (gain, beamwidth)',
        ],
        concepts: [
          { name: 'Radiation pattern' },
          { name: 'Gain' },
          { name: 'Polarization' },
          { name: 'Impedance matching' },
        ],
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
        concepts: [
          { name: 'AM/FM' },
          { name: 'ASK/FSK/PSK' },
          { name: 'QAM' },
          { name: 'Bandwidth efficiency' },
        ],
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
          "Appreciate Shannon's channel capacity theorem",
        ],
        concepts: [
          { name: 'Parity' },
          { name: 'Hamming code' },
          { name: 'CRC' },
          { name: 'Shannon limit' },
        ],
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
        concepts: [
          { name: 'Link budget' },
          { name: 'Path loss' },
          { name: 'Fading' },
          { name: 'RSSI' },
        ],
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
        prerequisites: ['fundamentals/ac-circuits/AC Circuits', 'fundamentals/magnetic-fields/Electromagnetism'],
        outcomes: [
          'Understand synchronous generator operation',
          'Calculate power output and efficiency',
          'Analyze generator equivalent circuits',
          'Understand excitation and voltage regulation',
        ],
        concepts: [
          { name: 'Synchronous generator' },
          { name: 'Prime movers' },
          { name: 'Excitation' },
          { name: 'Grid synchronization' },
        ],
        resources: [
          { label: 'All About Circuits - AC Motors', url: 'https://www.allaboutcircuits.com/textbook/alternating-current/chpt-13/introduction-ac-motors/' },
        ],
      },
      {
        id: 'power-transmission',
        title: 'Power Transmission & Distribution',
        description: 'Moving power from generators to loads. High voltage reduces losses over distance, transformers step up and down. Understanding the grid helps you design systems that connect to it.',
        prerequisites: ['advanced/power-generation/Power Generation', 'fundamentals/inductors/Transformers'],
        outcomes: [
          'Calculate transmission line losses',
          'Understand why high voltage reduces losses',
          'Analyze transformer connections (delta/wye)',
          'Read single-line diagrams',
        ],
        concepts: [
          { name: 'Transmission losses' },
          { name: 'Voltage levels' },
          { name: 'Delta/Wye' },
          { name: 'Single-line diagrams' },
        ],
        resources: [
          { label: 'All About Circuits - Power Factor', url: 'https://www.allaboutcircuits.com/textbook/alternating-current/chpt-11/power-factor/' },
        ],
      },
      {
        id: 'power-quality',
        title: 'Power Quality & Protection',
        description: 'Real power has harmonics, sags, and surges. Power quality issues damage equipment and reduce efficiency. Protection systems detect faults and isolate them before damage spreads.',
        prerequisites: ['advanced/power-transmission/Power Transmission basics'],
        outcomes: [
          'Identify common power quality issues',
          'Understand harmonic sources and effects',
          'Design basic protection schemes',
          'Select appropriate protective devices',
        ],
        concepts: [
          { name: 'Harmonics' },
          { name: 'Sags/swells' },
          { name: 'Protective relays' },
          { name: 'Grounding' },
        ],
        optional: true,
        resources: [
          { label: 'Power Quality Primer', url: 'https://www.powerqualityworld.com/' },
        ],
      },
    ],
  },
];