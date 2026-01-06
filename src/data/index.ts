// src/data/index.ts
// Dynamically loads all JSON roadmap files

import type { RoadmapSection } from '../types/roadmap';

// Exclude pdf-manifest.json and sample.json
const modules = import.meta.glob<RoadmapSection[]>(['./*.json', '!./pdf-manifest.json', '!./sample.json'], { eager: true, import: 'default' });

export const roadmaps: Record<string, RoadmapSection[]> = {};

for (const path in modules) {
  const name = path.replace('./', '').replace('.json', '');
  roadmaps[name] = modules[path];
}

export function getRoadmap(name: string): RoadmapSection[] {
  return roadmaps[name] ?? [];
}