// src/data/index.ts
// Dynamically loads all JSON roadmap files

import type { RoadmapSection, TrackMeta, Roadmap } from '../types/roadmap';

// Exclude pdf-manifest.json and sample.json
const modules = import.meta.glob<Roadmap>(
  ['./*.json', '!./pdf-manifest.json', '!./sample.json'],
  { eager: true, import: 'default' }
);

/** All roadmaps keyed by slug */
export const roadmaps: Record<string, Roadmap> = {};

/** All track metadata keyed by slug */
export const trackMetas: Record<string, TrackMeta> = {};

/** List of all track slugs */
export const trackSlugs: string[] = [];

for (const path in modules) {
  const name = path.replace('./', '').replace('.json', '');
  roadmaps[name] = modules[path];
  trackMetas[name] = modules[path].meta;
  trackSlugs.push(name);
}

/** Get sections for a specific roadmap */
export function getRoadmap(name: string): RoadmapSection[] {
  return roadmaps[name]?.sections ?? [];
}

/** Get metadata for a specific track */
export function getTrackMeta(name: string): TrackMeta | undefined {
  return trackMetas[name];
}

/** Get all tracks with their metadata, sorted by order */
export function getAllTracks(): { slug: string; meta: TrackMeta }[] {
  return trackSlugs
    .map(slug => ({
      slug,
      meta: trackMetas[slug]
    }))
    .sort((a, b) => a.meta.order - b.meta.order);
}

/** Get featured tracks only, sorted by order */
export function getFeaturedTracks(): { slug: string; meta: TrackMeta }[] {
  return getAllTracks()
    .filter(t => t.meta.featured)
    .sort((a, b) => a.meta.order - b.meta.order);
}

/** Get tracks by category */
export function getTracksByCategory(category: string): { slug: string; meta: TrackMeta }[] {
  return getAllTracks().filter(t => t.meta.category === category);
}