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
        description: 'Prerequisite math. Refresh if rusty.',
        topics: ['Complex numbers', 'Trig identities', 'Vectors'],
        optional: true,
        resources: [
          { label: 'Khan Academy Algebra', url: 'https://www.khanacademy.org/math/algebra' },
          { label: 'Khan Academy Trig', url: 'https://www.khanacademy.org/math/trigonometry' },
        ],
      },
      {
        id: 'calculus',
        title: 'Calculus',
        description: 'Derivatives, integrals, differential equations.',
        topics: ['Differentiation', 'Integration', 'ODEs'],
        resources: [
          { label: 'MIT OCW 18.01', url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/' },
          { label: '3Blue1Brown Essence of Calculus', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr' },
          { label: "Paul's Online Notes", url: 'https://tutorial.math.lamar.edu/Classes/CalcI/CalcI.aspx' },
        ],
      },
      {
        id: 'linear-algebra',
        title: 'Linear Algebra',
        description: 'Matrices, vectors, eigenvalues. Essential for signals & systems.',
        topics: ['Matrix operations', 'Determinants', 'Eigenvalues'],
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
        description: 'Voltage, current, resistance. The building blocks.',
        topics: ["Ohm's Law", 'KVL & KCL', 'Thevenin & Norton'],
        resources: [
          { label: 'MIT OCW 6.002', url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/' },
          { label: 'All About Circuits', url: 'https://www.allaboutcircuits.com/textbook/direct-current/' },
        ],
      },
      {
        id: 'ac-circuits',
        title: 'AC Circuit Analysis',
        description: 'Phasors, impedance, frequency response.',
        topics: ['Phasors', 'Impedance', 'Resonance', 'Power factor'],
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
        title: 'Electric Fields & Forces',
        description: 'Coulomb\'s law, electric potential, capacitance.',
        topics: ['Coulomb\'s law', 'Electric potential', 'Gauss\'s law'],
        resources: [
          { label: 'MIT OCW 8.02', url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/' },
          { label: 'Khan Academy Electrostatics', url: 'https://www.khanacademy.org/science/physics/electric-charge-electric-force-and-voltage' },
        ],
      },
      {
        id: 'magnetic-fields',
        title: 'Magnetic Fields & Induction',
        description: 'Magnetic forces, Faraday\'s law, inductance.',
        topics: ['Magnetic force', 'Faraday\'s law', 'Lenz\'s law', 'Inductance'],
        resources: [
          { label: 'Khan Academy Magnetism', url: 'https://www.khanacademy.org/science/physics/magnetic-forces-and-magnetic-fields' },
          { label: 'HyperPhysics EM', url: 'http://hyperphysics.phy-astr.gsu.edu/hbase/emcon.html' },
        ],
      },
      {
        id: 'maxwell-equations',
        title: 'Maxwell\'s Equations',
        description: 'Unified electromagnetic theory. The complete picture.',
        topics: ['Differential form', 'Integral form', 'Wave equation'],
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
        description: 'Types, ratings, color codes, power dissipation.',
        topics: ['Color codes', 'Power ratings', 'Tolerance', 'SMD vs through-hole'],
        resources: [
          { label: 'SparkFun Resistors', url: 'https://learn.sparkfun.com/tutorials/resistors' },
          { label: 'Electronics Tutorials', url: 'https://www.electronics-tutorials.ws/resistor/res_1.html' },
        ],
      },
      {
        id: 'capacitors',
        title: 'Capacitors',
        description: 'Types, ESR, voltage ratings, applications.',
        topics: ['Ceramic', 'Electrolytic', 'Film', 'ESR', 'Decoupling'],
        resources: [
          { label: 'SparkFun Capacitors', url: 'https://learn.sparkfun.com/tutorials/capacitors' },
          { label: 'All About Circuits - Capacitors', url: 'https://www.allaboutcircuits.com/textbook/direct-current/chpt-13/electric-fields-capacitance/' },
        ],
      },
      {
        id: 'inductors',
        title: 'Inductors & Transformers',
        description: 'Inductance, mutual inductance, transformer basics.',
        topics: ['Inductance', 'Saturation', 'Transformers', 'Turns ratio'],
        resources: [
        { label: 'Electronics Tutorials - Inductors', url: 'https://www.electronics-tutorials.ws/inductor/inductor.html' },
          { label: 'Electronics Tutorials - Transformers', url: 'https://www.electronics-tutorials.ws/transformer/transformer-basics.html' },
        ],
      },
      {
        id: 'diodes',
        title: 'Diodes',
        description: 'PN junction, rectifiers, Zener, LEDs.',
        topics: ['Forward/reverse bias', 'Rectification', 'Zener regulation', 'LED'],
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
        description: 'Measuring voltage, current, resistance, continuity.',
        topics: ['DC/AC voltage', 'Current measurement', 'Resistance', 'Continuity'],
        resources: [
          { label: 'SparkFun Multimeter', url: 'https://learn.sparkfun.com/tutorials/how-to-use-a-multimeter' },
          { label: 'EEVblog Multimeter Basics', url: 'https://www.youtube.com/watch?v=gh1n_ELmpFI' },
        ],
      },
      {
        id: 'oscilloscope',
        title: 'Oscilloscope',
        description: 'Visualizing waveforms, triggering, measurements.',
        topics: ['Timebase', 'Triggering', 'Probes', 'Bandwidth'],
        resources: [
          { label: 'EEVblog Oscilloscope Tutorial', url: 'https://www.youtube.com/watch?v=xaELqAo4kkQ' },
          { label: 'SparkFun Oscilloscope Tutorial', url: 'https://learn.sparkfun.com/tutorials/how-to-use-an-oscilloscope' },
        ],
      },
      {
        id: 'breadboarding',
        title: 'Breadboarding & Prototyping',
        description: 'Building circuits without soldering. Debug techniques.',
        topics: ['Breadboard layout', 'Wire management', 'Common mistakes'],
        resources: [
          { label: 'SparkFun Breadboards', url: 'https://learn.sparkfun.com/tutorials/how-to-use-a-breadboard' },
          { label: 'Adafruit Breadboard Guide', url: 'https://learn.adafruit.com/breadboards-for-beginners' },
        ],
      },
      {
        id: 'soldering',
        title: 'Soldering',
        description: 'Through-hole and basic SMD soldering skills.',
        topics: ['Iron tips', 'Flux', 'Desoldering', 'SMD basics'],
        optional: true,
        resources: [
          { label: 'SparkFun Soldering', url: 'https://learn.sparkfun.com/tutorials/how-to-solder-through-hole-soldering' },
          { label: 'EEVblog Soldering Tutorial', url: 'https://www.youtube.com/watch?v=J5Sb21qbpEQ' },
        ],
      },
    ],
  },
];