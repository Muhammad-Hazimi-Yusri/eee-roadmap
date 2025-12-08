// src/types/roadmap.ts

export interface Resource {
  label: string;
  url: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  concepts?: string[];
  resources?: Resource[];
  optional?: boolean;
}

export interface RoadmapSection {
  id: string;
  title: string;
  items: Topic[];
}