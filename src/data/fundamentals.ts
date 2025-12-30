// src/data/fundamentals.ts

import type { RoadmapSection } from '../types/roadmap';

export const fundamentalsRoadmap: RoadmapSection[] = [
  {
    id: 'math-foundations',
    title: 'Math Foundations',
    items: [
      {
        id: 'algebra-trig',
        title: 'Algebra & Trigonometry',
        description: 'The mathematical language of circuits. Complex numbers are essential for AC analysis, trig for waveforms and phasors. Revisit if your fundamentals are shaky — everything builds on this.',
        prerequisites: ['High school math'],
        outcomes: [
          'Manipulate complex numbers in rectangular and polar form',
          'Apply trig identities to simplify expressions',
          'Perform vector operations',
        ],
        concepts: [
          { name: 'Complex numbers', 
            notes: `## Test Formulas

Inline: $V = IR$, $P = I^2 R$, $\\omega = 2\\pi f$

Greek: $\\alpha$, $\\beta$, $\\Omega$, $\\mu$, $\\tau$

Fractions: $\\frac{V_{out}}{V_{in}}$

Transfer function:

$$H(s) = \\frac{1}{1 + sRC}$$

Euler's identity:

$$e^{j\\theta} = \\cos\\theta + j\\sin\\theta$$

Integral:

$$W = \\int_0^T p(t) \\, dt$$

Matrix:

$$\\begin{bmatrix} V_1 \\\\ V_2 \\end{bmatrix} = \\begin{bmatrix} Z_{11} & Z_{12} \\\\ Z_{21} & Z_{22} \\end{bmatrix} \\begin{bmatrix} I_1 \\\\ I_2 \\end{bmatrix}$$


`},
          { name: 'Trig identities' },
          { name: 'Vectors' },
        ],
        optional: true,
        resources: [
          { label: 'Khan Academy Algebra', url: 'https://www.khanacademy.org/math/algebra' },
          { label: 'Khan Academy Trig', url: 'https://www.khanacademy.org/math/trigonometry' },
        ],
      },
      {
        id: 'calculus',
        title: 'Calculus',
        description: 'How circuits change over time. Derivatives describe capacitor/inductor behavior, integrals calculate energy and charge. Differential equations model real circuit dynamics.',
        prerequisites: ['fundamentals/algebra-trig/Algebra & Trigonometry'],
        outcomes: [
          'Differentiate and integrate common functions',
          'Solve first-order differential equations',
          'Apply calculus to analyze changing quantities',
        ],
        concepts: [
          { name: 'Differentiation' },
          { name: 'Integration' },
          { name: 'ODEs' },
        ],
        resources: [
          { label: 'MIT OCW 18.01', url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/' },
          { label: '3Blue1Brown Essence of Calculus', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr' },
          { label: "Paul's Online Notes", url: 'https://tutorial.math.lamar.edu/Classes/CalcI/CalcI.aspx' },
        ],
      },
      {
        id: 'linear-algebra',
        title: 'Linear Algebra',
        description: 'Enables systematic circuit analysis. Matrix methods solve complex multi-loop circuits, eigenvalues appear in stability analysis. Critical for signals, systems, and control theory later.',
        prerequisites: ['fundamentals/algebra-trig/Algebra', 'fundamentals/calculus/Calculus basics'],
        outcomes: [
          'Perform matrix operations and find inverses',
          'Solve systems of linear equations',
          'Calculate and interpret eigenvalues',
        ],
        concepts: [
          { name: 'Matrix operations' },
          { name: 'Determinants' },
          { name: 'Eigenvalues' },
        ],
        optional: true,
        resources: [
          { label: 'MIT OCW 18.06', url: 'https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/' },
          { label: '3Blue1Brown Essence of Linear Algebra', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab' },
        ],
      },
    ],
  },
  {
    id: 'circuit-fundamentals',
    title: 'Circuit Fundamentals',
    items: [
      {
        id: 'dc-circuits',
        title: 'DC Circuit Analysis',
        description: "Your first real circuits. Master voltage, current, and resistance relationships. Kirchhoff's laws let you analyze any circuit; Thevenin/Norton simplify complex networks into simple equivalents.",
        prerequisites: ['fundamentals/algebra-trig/Algebra', 'Basic physics (voltage, current concepts)'],
        outcomes: [
          'Apply Ohm\'s law to calculate V, I, R',
          'Use KVL and KCL to analyze multi-loop circuits',
          'Find Thevenin and Norton equivalents',
          'Calculate power dissipation',
        ],
        concepts: [
  { 
  name: "Ohm's Law",
  notes: `
Ohm's Law: $V = IR$

Impedance formula:

$$Z = \\sqrt{R^2 + (X_L - X_C)^2}$$

![Circuit diagram](https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Ohm%27s_Law_Pie_chart.svg/220px-Ohm%27s_Law_Pie_chart.svg.png)

## The Formula

- **V** in Volts (V)
- **I** in Amperes (A)  
- **R** in Ohms (Ω)

Here's a reference PDF:

![Ohm's Law Reference](https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf)

## Rearranged Forms

You can solve for any variable:
- I = V / R
- R = V / I

![Resistor photo](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Resistor.jpg/220px-Resistor.jpg)

## Power Relations

Power can be calculated multiple ways:
- P = IV
- P = I²R
- P = V²/R

And here's another PDF for reference:

![Sample Test PDF](/pdfs/sample-test.pdf)

That's all for Ohm's Law!
`
},
  { 
    name: 'KVL & KCL',
    notes: `Kirchhoff's Voltage Law (KVL):

The sum of all voltages around any closed loop equals zero.

ΣV = 0

Kirchhoff's Current Law (KCL):
The sum of currents entering a node equals the sum leaving.
ΣI_in = ΣI_out

![KVL & KCL PDF](/pdfs/sample-test.pdf)
`
  },
  { 
    name: 'Thevenin & Norton',
    notes: `![Thevenin & Norton PDF](/pdfs/sample-test.pdf)`
  },
],
        resources: [
          { label: 'MIT OCW 6.002', url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/' },
          { label: 'All About Circuits', url: 'https://www.allaboutcircuits.com/textbook/direct-current/' },
        ],
      },
      {
        id: 'ac-circuits',
        title: 'AC Circuit Analysis',
        description: "Real-world power is AC. Phasors turn differential equations into algebra, impedance extends Ohm's law to capacitors and inductors. Foundation for power systems and signal processing.",
        prerequisites: ['fundamentals/dc-circuits/DC Circuits', 'fundamentals/calculus/Calculus', 'Complex numbers'],
        outcomes: [
          'Convert time-domain signals to phasors',
          'Calculate impedance of RLC combinations',
          'Analyze resonant circuits',
          'Calculate real, reactive, and apparent power',
        ],
        concepts: [
          { name: 'Phasors' },
          { name: 'Impedance' },
          { name: 'Resonance' },
          { name: 'Power factor' },
        ],
        resources: [
          { label: 'All About Circuits - AC', url: 'https://www.allaboutcircuits.com/textbook/alternating-current/' },
          { label: 'Khan Academy AC Circuits', url: 'https://www.khanacademy.org/science/physics/circuits-topic' },
        ],
      },
    ],
  },
  {
    id: 'electromagnetism',
    title: 'Electromagnetism',
    items: [
      {
        id: 'electric-fields',
        title: 'Electric Fields & Potential',
        description: "Understand how charges create fields and how fields create forces. Coulomb's law, electric potential, and capacitance all stem from this. Essential for understanding how capacitors store energy.",
        prerequisites: ['fundamentals/calculus/Calculus basics', 'Basic physics'],
        outcomes: [
          'Calculate electric field from charge distributions',
          'Relate electric potential to field',
          'Apply Gauss\'s law to symmetric geometries',
          'Calculate capacitance of simple structures',
        ],
        concepts: [
          { name: "Coulomb's law" },
          { name: 'Electric potential' },
          { name: "Gauss's law" },
        ],
        resources: [
          { label: 'Khan Academy Electrostatics', url: 'https://www.khanacademy.org/science/physics/electric-charge-electric-force-and-voltage' },
          { label: 'HyperPhysics E&M', url: 'http://hyperphysics.phy-astr.gsu.edu/hbase/emcon.html' },
        ],
      },
      {
        id: 'magnetic-fields',
        title: 'Magnetic Fields & Induction',
        description: "Magnetic forces drive motors, Faraday's law explains transformers and generators. Inductance is just stored magnetic energy.",
        prerequisites: ['fundamentals/electric-fields/Electric Fields', 'fundamentals/calculus/Calculus'],
        outcomes: [
          'Calculate magnetic force on moving charges and currents',
          'Apply Faraday\'s law to find induced EMF',
          'Use Lenz\'s law to determine induced current direction',
          'Calculate inductance of simple geometries',
        ],
        concepts: [
          { name: 'Magnetic force' },
          { name: "Faraday's law" },
          { name: "Lenz's law" },
          { name: 'Inductance' },
        ],
        resources: [
          { label: 'Khan Academy Magnetism', url: 'https://www.khanacademy.org/science/physics/magnetic-forces-and-magnetic-fields' },
          { label: 'HyperPhysics EM', url: 'http://hyperphysics.phy-astr.gsu.edu/hbase/emcon.html' },
        ],
      },
      {
        id: 'maxwell-equations',
        title: "Maxwell's Equations",
        description: 'The complete picture — four equations that unify all electromagnetic phenomena. Essential for RF, antennas, and understanding why circuits behave differently at high frequencies.',
        prerequisites: ['Vector calculus', 'fundamentals/electric-fields/Electric Fields', 'fundamentals/magnetic-fields/Magnetic Fields'],
        outcomes: [
          'State Maxwell\'s equations in differential and integral form',
          'Derive the electromagnetic wave equation',
          'Explain how changing E-fields create B-fields and vice versa',
        ],
        concepts: [
          { name: 'Differential form' },
          { name: 'Integral form' },
          { name: 'Wave equation' },
        ],
        optional: true,
        resources: [
          { label: 'MIT OCW 8.03', url: 'https://ocw.mit.edu/courses/8-03sc-physics-iii-vibrations-and-waves-fall-2016/' },
          { label: '3Blue1Brown Maxwell', url: 'https://www.youtube.com/watch?v=ly4S0oi3Yz8' },
        ],
      },
    ],
  },
  {
    id: 'passive-components',
    title: 'Passive Components',
    items: [
      {
        id: 'resistors',
        title: 'Resistors',
        description: 'The simplest component, but details matter. Learn to read color codes, choose appropriate power ratings, and understand tolerance. Know when to use precision vs. general-purpose.',
        prerequisites: ['fundamentals/dc-circuits/DC Circuits'],
        outcomes: [
          'Read resistor values from color codes',
          'Calculate power dissipation and select appropriate wattage',
          'Choose resistors based on tolerance requirements',
          'Understand SMD package sizes',
        ],
        concepts: [
          { name: 'Color codes' },
          { name: 'Power ratings' },
          { name: 'Tolerance' },
          { name: 'SMD vs through-hole' },
        ],
        resources: [
          { label: 'SparkFun Resistors', url: 'https://learn.sparkfun.com/tutorials/resistors' },
          { label: 'Electronics Tutorials', url: 'https://www.electronics-tutorials.ws/resistor/res_1.html' },
        ],
      },
      {
        id: 'capacitors',
        title: 'Capacitors',
        description: 'Store energy in electric fields. Different types (ceramic, electrolytic, film) have different behaviors — ESR affects filtering, voltage ratings prevent explosions. Decoupling is an art.',
        prerequisites: ['fundamentals/dc-circuits/DC Circuits', 'fundamentals/electric-fields/Electric Fields basics'],
        outcomes: [
          'Select appropriate capacitor type for application',
          'Understand ESR and its effect on performance',
          'Design basic decoupling and filtering circuits',
          'Read capacitor markings and datasheets',
        ],
        concepts: [
          { name: 'Ceramic' },
          { name: 'Electrolytic' },
          { name: 'Film' },
          { name: 'ESR' },
          { name: 'Decoupling' },
        ],
        resources: [
          { label: 'SparkFun Capacitors', url: 'https://learn.sparkfun.com/tutorials/capacitors' },
          { label: 'All About Circuits - Capacitors', url: 'https://www.allaboutcircuits.com/textbook/direct-current/chpt-13/electric-fields-capacitance/' },
        ],
      },
      {
        id: 'inductors',
        title: 'Inductors & Transformers',
        description: 'Store energy in magnetic fields. Saturation limits current handling, mutual inductance enables transformers. Turns ratio determines voltage transformation in power supplies.',
        prerequisites: ['fundamentals/magnetic-fields/Magnetic Fields basics'],
        outcomes: [
          'Calculate inductance and stored energy',
          'Understand core saturation and its limits',
          'Apply transformer turns ratio for voltage conversion',
          'Select inductors for filtering applications',
        ],
        concepts: [
          { name: 'Inductance' },
          { name: 'Saturation' },
          { name: 'Transformers' },
          { name: 'Turns ratio' },
        ],
        resources: [
          { label: 'Electronics Tutorials - Inductors', url: 'https://www.electronics-tutorials.ws/inductor/inductor.html' },
          { label: 'Electronics Tutorials - Transformers', url: 'https://www.electronics-tutorials.ws/transformer/transformer-basics.html' },
        ],
      },
      {
        id: 'diodes',
        title: 'Diodes',
        description: 'First step into semiconductors. One-way current flow enables rectification (AC→DC). Zener diodes regulate voltage, LEDs convert current to light. The PN junction concept underlies all semiconductors.',
        prerequisites: ['fundamentals/dc-circuits/DC Circuits', 'Basic semiconductor concepts'],
        outcomes: [
          'Analyze circuits with forward/reverse biased diodes',
          'Design basic rectifier circuits',
          'Use Zener diodes for voltage regulation',
          'Calculate LED current limiting resistors',
        ],
        concepts: [
          { name: 'Forward/reverse bias' },
          { name: 'Rectification' },
          { name: 'Zener regulation' },
          { name: 'LED' },
        ],
        optional: true,
        resources: [
          { label: 'SparkFun Diodes', url: 'https://learn.sparkfun.com/tutorials/diodes' },
          { label: 'All About Circuits - Diodes', url: 'https://www.allaboutcircuits.com/textbook/semiconductors/chpt-3/introduction-to-diodes-and-rectifiers/' },
        ],
      },
    ],
  },
  {
    id: 'measurements-lab',
    title: 'Measurements & Lab',
    items: [
      {
        id: 'multimeter',
        title: 'Multimeter',
        description: 'Your most-used tool. Measures voltage, current, resistance — but technique matters. Learn proper probe placement, when to use AC vs DC ranges, and how to safely measure current in-circuit.',
        prerequisites: ['fundamentals/dc-circuits/DC Circuits', 'fundamentals/ac-circuits/AC Circuits basics'],
        outcomes: [
          'Measure DC and AC voltage accurately',
          'Measure current without blowing fuses',
          'Test resistance and continuity',
          'Identify common measurement errors',
        ],
        concepts: [
          { name: 'DC/AC voltage' },
          { name: 'Current measurement' },
          { name: 'Resistance' },
          { name: 'Continuity' },
        ],
        resources: [
          { label: 'SparkFun Multimeter', url: 'https://learn.sparkfun.com/tutorials/how-to-use-a-multimeter' },
          { label: 'EEVblog Multimeter Basics', url: 'https://www.youtube.com/watch?v=gh1n_ELmpFI' },
        ],
      },
      {
        id: 'oscilloscope',
        title: 'Oscilloscope',
        description: "See what's actually happening. Voltage vs. time reveals signal integrity, noise, and timing issues invisible to multimeters. Master triggering to capture the waveform you need.",
        prerequisites: ['fundamentals/ac-circuits/AC Circuits', 'Waveform concepts'],
        outcomes: [
          'Set up timebase and vertical scale appropriately',
          'Use triggering to capture stable waveforms',
          'Measure frequency, amplitude, and rise time',
          'Identify signal integrity issues',
        ],
        concepts: [
          { name: 'Timebase' },
          { name: 'Triggering' },
          { name: 'Probes' },
          { name: 'Bandwidth' },
        ],
        resources: [
          { label: 'EEVblog Oscilloscope Tutorial', url: 'https://www.youtube.com/watch?v=xaELqAo4kkQ' },
          { label: 'SparkFun Oscilloscope Tutorial', url: 'https://learn.sparkfun.com/tutorials/how-to-use-an-oscilloscope' },
        ],
      },
      {
        id: 'breadboarding',
        title: 'Breadboarding & Prototyping',
        description: 'Rapid prototyping without soldering. Understand the internal connections, keep wires short and organized. Most debugging is just finding the loose connection or wrong row.',
        prerequisites: ['Basic circuit knowledge'],
        outcomes: [
          'Understand breadboard internal connections',
          'Build organized, debuggable circuits',
          'Identify and fix common breadboard issues',
          'Know breadboard limitations (current, frequency)',
        ],
        concepts: [
          { name: 'Breadboard layout' },
          { name: 'Wire management' },
          { name: 'Common mistakes' },
        ],
        resources: [
          { label: 'SparkFun Breadboards', url: 'https://learn.sparkfun.com/tutorials/how-to-use-a-breadboard' },
          { label: 'Adafruit Breadboard Guide', url: 'https://learn.adafruit.com/breadboards-for-beginners' },
        ],
      },
      {
        id: 'soldering',
        title: 'Soldering',
        description: 'Permanent connections done right. Good joints are shiny and concave. Learn proper iron temperature, flux usage, and desoldering for mistakes. SMD opens up modern component access.',
        prerequisites: ['fundamentals/breadboarding/Breadboarding experience'],
        outcomes: [
          'Create reliable through-hole solder joints',
          'Identify and fix cold joints',
          'Desolder components without damage',
          'Attempt basic SMD soldering',
        ],
        concepts: [
          { name: 'Iron tips' },
          { name: 'Flux' },
          { name: 'Desoldering' },
          { name: 'SMD basics' },
        ],
        optional: true,
        resources: [
          { label: 'SparkFun Soldering', url: 'https://learn.sparkfun.com/tutorials/how-to-solder-through-hole-soldering' },
          { label: 'EEVblog Soldering Tutorial', url: 'https://www.youtube.com/watch?v=J5Sb21qbpEQ' },
        ],
      },
    ],
  },
];