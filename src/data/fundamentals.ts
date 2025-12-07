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
      },
      {
        id: 'calculus',
        title: 'Calculus',
        description: 'Derivatives, integrals, differential equations.',
        topics: ['Differentiation', 'Integration', 'ODEs'],
      },
      {
        id: 'linear-algebra',
        title: 'Linear Algebra',
        description: 'Matrices, vectors, eigenvalues.',
        topics: ['Matrix operations', 'Determinants', 'Eigenvalues'],
        optional: true,
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
        topics: ['Phasors', 'Impedance', 'Resonance'],
      },
    ],
  },
];