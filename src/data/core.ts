// src/data/core.ts

import type { RoadmapSection } from '../types/roadmap';

export const coreRoadmap: RoadmapSection[] = [
  {
    id: 'analog-electronics',
    title: 'Analog Electronics',
    items: [
      {
        id: 'transistors',
        title: 'Transistors (BJT & MOSFET)',
        description: 'The building blocks of amplification and switching. BJTs are current-controlled, MOSFETs are voltage-controlled. Understanding both lets you choose the right device for your application.',
        prerequisites: ['DC Circuits', 'Diodes basics'],
        outcomes: [
          'Bias BJT and MOSFET circuits for linear operation',
          'Analyze small-signal amplifier behavior',
          'Design basic switching circuits',
          'Read transistor datasheets effectively',
        ],
        concepts: ['BJT biasing', 'MOSFET operation', 'Small-signal models', 'Saturation vs active region'],
        resources: [
          { label: 'All About Circuits - BJT', url: 'https://www.allaboutcircuits.com/textbook/semiconductors/chpt-4/bipolar-junction-transistors/' },
          { label: 'All About Circuits - MOSFET', url: 'https://www.allaboutcircuits.com/textbook/semiconductors/chpt-7/insulated-gate-field-effect-transistors-mosfet/' },
          { label: 'MIT OCW 6.002', url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/' },
        ],
      },
      {
        id: 'op-amps',
        title: 'Operational Amplifiers',
        description: 'The Swiss Army knife of analog design. Two simple rules (virtual short, no input current) let you build amplifiers, filters, comparators, and more. Master the 741 and its modern successors.',
        prerequisites: ['DC Circuits', 'AC Circuits'],
        outcomes: [
          'Design inverting and non-inverting amplifiers',
          'Build active filters and integrators',
          'Understand op-amp limitations (bandwidth, slew rate)',
          'Select appropriate op-amps for specific applications',
        ],
        concepts: ['Virtual short', 'Gain-bandwidth product', 'Feedback', 'Comparators'],
        resources: [
          { label: 'Electronics Tutorials - Op-amps', url: 'https://www.electronics-tutorials.ws/opamp/opamp_1.html' },
          { label: 'All About Circuits - Op-amps', url: 'https://www.allaboutcircuits.com/textbook/semiconductors/chpt-8/introduction-operational-amplifiers/' },
          { label: 'TI Op-Amp Basics', url: 'https://www.ti.com/lit/eb/sloa011b/sloa011b.pdf' },
        ],
      },
      {
        id: 'analog-filters',
        title: 'Analog Filters',
        description: 'Shape the frequency content of signals. Low-pass removes noise, high-pass blocks DC, band-pass selects specific frequencies. Active filters with op-amps give you gain plus filtering.',
        prerequisites: ['AC Circuits', 'Op-amps basics'],
        outcomes: [
          'Design passive RC and RLC filters',
          'Build active filters using op-amps',
          'Analyze filter frequency response using Bode plots',
          'Choose appropriate filter topology for application',
        ],
        concepts: ['Cutoff frequency', 'Roll-off', 'Butterworth vs Chebyshev', 'Bode plots'],
        optional: true,
        resources: [
          { label: 'Electronics Tutorials - Filters', url: 'https://www.electronics-tutorials.ws/filter/filter_1.html' },
          { label: 'All About Circuits - Filters', url: 'https://www.allaboutcircuits.com/textbook/alternating-current/chpt-8/what-is-a-filter/' },
        ],
      },
    ],
  },
  {
    id: 'digital-logic',
    title: 'Digital Logic Design',
    items: [
      {
        id: 'boolean-logic-gates',
        title: 'Boolean Algebra & Logic Gates',
        description: 'The mathematics of digital systems. AND, OR, NOT gates combine to implement any logical function. Boolean algebra lets you simplify and optimize circuits before building them.',
        prerequisites: ['Basic algebra'],
        outcomes: [
          'Simplify Boolean expressions using algebra and K-maps',
          'Convert between truth tables and gate circuits',
          'Implement functions using NAND/NOR as universal gates',
          'Understand gate propagation delay',
        ],
        concepts: ['Truth tables', 'K-maps', 'De Morgan\'s theorem', 'Universal gates'],
        resources: [
          { label: 'Neso Academy Digital Electronics', url: 'https://www.nesoacademy.org/ee/05-digital-electronics' },
          { label: 'All About Circuits - Boolean', url: 'https://www.allaboutcircuits.com/textbook/digital/chpt-7/introduction-boolean-algebra/' },
        ],
      },
      {
        id: 'combinational-circuits',
        title: 'Combinational Circuits',
        description: 'Outputs depend only on current inputs — no memory. Multiplexers route signals, decoders select devices, adders do arithmetic. These blocks combine to build ALUs and more.',
        prerequisites: ['Boolean Algebra & Logic Gates'],
        outcomes: [
          'Design multiplexers and demultiplexers',
          'Build encoders, decoders, and priority encoders',
          'Implement binary adders and subtractors',
          'Use ROMs and PLAs for function implementation',
        ],
        concepts: ['Mux/Demux', 'Encoders/Decoders', 'Adders', 'Comparators'],
        resources: [
          { label: 'Neso Academy - Combinational', url: 'https://www.nesoacademy.org/ee/05-digital-electronics' },
          { label: 'GeeksforGeeks Digital Logic', url: 'https://www.geeksforgeeks.org/digital-electronics-logic-design-tutorials/' },
        ],
      },
      {
        id: 'sequential-circuits',
        title: 'Sequential Circuits',
        description: 'Circuits with memory — outputs depend on current inputs AND past history. Flip-flops store bits, registers hold bytes, counters sequence through states. The basis of all digital systems.',
        prerequisites: ['Combinational Circuits'],
        outcomes: [
          'Design circuits using SR, D, JK, and T flip-flops',
          'Build counters (synchronous and asynchronous)',
          'Design finite state machines',
          'Analyze timing diagrams and setup/hold violations',
        ],
        concepts: ['Flip-flops', 'Registers', 'Counters', 'State machines'],
        resources: [
          { label: 'Neso Academy - Sequential', url: 'https://www.nesoacademy.org/ee/05-digital-electronics' },
          { label: 'Ben Eater - 8-bit Computer', url: 'https://eater.net/' },
        ],
      },
    ],
  },
  {
    id: 'signals-systems',
    title: 'Signals & Systems',
    items: [
      {
        id: 'signal-basics',
        title: 'Signal Fundamentals',
        description: 'The language of information. Continuous vs discrete, periodic vs aperiodic, energy vs power signals. Understanding signal properties is essential before analyzing how systems process them.',
        prerequisites: ['Calculus', 'Complex numbers'],
        outcomes: [
          'Classify signals by their properties',
          'Perform basic signal operations (scaling, shifting)',
          'Understand even/odd decomposition',
          'Work with unit impulse and step functions',
        ],
        concepts: ['Continuous vs discrete', 'Periodic signals', 'Impulse function', 'Convolution'],
        resources: [
          { label: 'MIT OCW 6.003', url: 'https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/' },
          { label: 'Neso Academy - Signals', url: 'https://www.nesoacademy.org/ee/04-signals-and-systems' },
        ],
      },
      {
        id: 'fourier-analysis',
        title: 'Fourier Analysis',
        description: 'Any signal can be decomposed into sinusoids. Fourier series for periodic signals, Fourier transform for aperiodic. This frequency-domain view reveals what filters do and how signals occupy bandwidth.',
        prerequisites: ['Signal Fundamentals', 'Calculus'],
        outcomes: [
          'Compute Fourier series coefficients',
          'Apply Fourier transform to common signals',
          'Interpret frequency spectra',
          'Understand Parseval\'s theorem (energy in time = energy in frequency)',
        ],
        concepts: ['Fourier series', 'Fourier transform', 'Spectrum', 'Bandwidth'],
        resources: [
          { label: '3Blue1Brown - Fourier', url: 'https://www.youtube.com/watch?v=spUNpyF58BY' },
          { label: 'MIT OCW 6.003', url: 'https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/' },
        ],
      },
      {
        id: 'laplace-z-transform',
        title: 'Laplace & Z-Transform',
        description: 'Generalized frequency domain tools. Laplace transform handles continuous systems with initial conditions, Z-transform does the same for discrete systems. Both turn differential/difference equations into algebra.',
        prerequisites: ['Fourier Analysis', 'Differential equations'],
        outcomes: [
          'Apply Laplace transform to solve circuit problems',
          'Find transfer functions from differential equations',
          'Use Z-transform for discrete-time system analysis',
          'Analyze system stability using pole locations',
        ],
        concepts: ['Transfer function', 'Poles and zeros', 'ROC', 'Stability'],
        optional: true,
        resources: [
          { label: 'MIT OCW 6.003', url: 'https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/' },
          { label: 'Brian Douglas - Control', url: 'https://www.youtube.com/@BrianDouglas' },
        ],
      },
    ],
  },
  {
    id: 'microcontrollers',
    title: 'Microcontrollers',
    items: [
      {
        id: 'mcu-basics',
        title: 'Microcontroller Fundamentals',
        description: 'A computer on a chip — CPU, memory, and peripherals in one package. Arduino made embedded systems accessible, but understanding what happens under the hood makes you a better developer.',
        prerequisites: ['Digital Logic basics', 'Basic programming'],
        outcomes: [
          'Understand microcontroller architecture (CPU, memory, peripherals)',
          'Program GPIO pins for digital I/O',
          'Use Arduino IDE effectively',
          'Read microcontroller datasheets',
        ],
        concepts: ['Architecture', 'GPIO', 'Clock', 'Memory map'],
        resources: [
          { label: 'SparkFun Arduino Tutorials', url: 'https://learn.sparkfun.com/tutorials/tags/arduino' },
          { label: 'Adafruit Learn Arduino', url: 'https://learn.adafruit.com/series/learn-arduino' },
        ],
      },
      {
        id: 'mcu-peripherals',
        title: 'Peripherals & Communication',
        description: 'Microcontrollers talk to sensors and other devices through standardized protocols. I2C for multiple devices on two wires, SPI for speed, UART for simplicity. ADC/DAC bridge analog and digital worlds.',
        prerequisites: ['Microcontroller Fundamentals'],
        outcomes: [
          'Configure and use UART, SPI, and I2C',
          'Read analog sensors with ADC',
          'Generate analog outputs with PWM',
          'Use timers and interrupts effectively',
        ],
        concepts: ['UART', 'SPI', 'I2C', 'ADC/DAC', 'PWM', 'Interrupts'],
        resources: [
          { label: 'SparkFun Communication Tutorials', url: 'https://learn.sparkfun.com/tutorials/serial-communication' },
          { label: 'SparkFun I2C Tutorial', url: 'https://learn.sparkfun.com/tutorials/i2c' },
        ],
      },
      {
        id: 'embedded-c',
        title: 'Embedded C Programming',
        description: 'C is the lingua franca of embedded systems. Direct hardware access, bit manipulation, memory management — skills that matter when every byte counts and timing is critical.',
        prerequisites: ['Microcontroller Fundamentals', 'C programming basics'],
        outcomes: [
          'Write efficient embedded C code',
          'Manipulate registers using bit operations',
          'Understand volatile keyword and memory-mapped I/O',
          'Debug embedded systems effectively',
        ],
        concepts: ['Bit manipulation', 'Registers', 'Volatile', 'Memory-mapped I/O'],
        optional: true,
        resources: [
          { label: 'Embedded Systems Programming', url: 'https://www.state-machine.com/quickstart/' },
          { label: 'SparkFun Tutorials', url: 'https://learn.sparkfun.com/tutorials' },
        ],
      },
    ],
  },
  {
    id: 'pcb-design',
    title: 'PCB Design',
    items: [
      {
        id: 'pcb-fundamentals',
        title: 'PCB Design Fundamentals',
        description: 'Move from breadboard to real product. PCBs are reliable, reproducible, and professional. Learn the workflow: schematic → layout → fabrication files. KiCad is free and industry-capable.',
        prerequisites: ['Circuit Fundamentals', 'Passive Components'],
        outcomes: [
          'Create schematics in KiCad',
          'Understand PCB stackup and layers',
          'Place components and route traces',
          'Generate Gerber files for manufacturing',
        ],
        concepts: ['Schematic capture', 'Footprints', 'Layers', 'Gerbers'],
        resources: [
          { label: 'KiCad Getting Started', url: 'https://docs.kicad.org/9.0/en/getting_started_in_kicad/getting_started_in_kicad.html' },
          { label: 'SparkFun KiCad Guide', url: 'https://learn.sparkfun.com/tutorials/beginners-guide-to-kicad' },
        ],
      },
      {
        id: 'pcb-layout',
        title: 'Layout Best Practices',
        description: 'Good layout separates working boards from problematic ones. Decoupling placement, ground planes, trace width for current, keep-outs — rules that prevent noise and ensure manufacturability.',
        prerequisites: ['PCB Design Fundamentals'],
        outcomes: [
          'Apply proper decoupling capacitor placement',
          'Design effective ground planes',
          'Calculate trace widths for current requirements',
          'Follow design rules for manufacturability',
        ],
        concepts: ['Decoupling', 'Ground planes', 'Trace width', 'DRC'],
        resources: [
          { label: 'SparkFun PCB Basics', url: 'https://learn.sparkfun.com/tutorials/pcb-basics' },
          { label: 'KiCad Tutorial', url: 'https://www.build-electronic-circuits.com/kicad-tutorial/' },
        ],
      },
      {
        id: 'pcb-manufacturing',
        title: 'Manufacturing & Assembly',
        description: 'Design for manufacturing (DFM) prevents costly mistakes. Understand minimum trace widths, drill sizes, and clearances your fab house requires. Consider assembly when placing components.',
        prerequisites: ['PCB Layout Best Practices'],
        outcomes: [
          'Prepare designs for PCB fabrication',
          'Understand manufacturing constraints',
          'Order PCBs from fabrication houses',
          'Hand-assemble or prepare for automated assembly',
        ],
        concepts: ['DFM', 'Fab constraints', 'BOM', 'Assembly'],
        optional: true,
        resources: [
          { label: 'PCBWay Tutorial', url: 'https://www.pcbway.com/blog/PCB_Design_Tutorial/' },
          { label: 'JLCPCB Capabilities', url: 'https://jlcpcb.com/capabilities/pcb-capabilities' },
        ],
      },
    ],
  },
];