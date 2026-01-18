/**
 * Build script to generate graph data from roadmap JSON files.
 * Extracts topics as nodes and prerequisites as edges for Cytoscape.js
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../src/data');
const outFile = join(dataDir, 'graph-data.json');

// Files to skip
const SKIP_FILES = ['sample.json', 'search-index.json', '_glossary.json', 'graph-data.json', 'pdf-manifest.json'];

function buildGraphData() {
  const files = readdirSync(dataDir).filter(
    f => f.endsWith('.json') && !SKIP_FILES.includes(f)
  );

  const nodes = [];
  const edges = [];
  const trackMeta = {}; // slug -> { title, order }

  // First pass: collect all topics as nodes
  for (const file of files) {
    const slug = file.replace('.json', '');
    const data = JSON.parse(readFileSync(join(dataDir, file), 'utf-8'));
    
    trackMeta[slug] = {
      title: data.meta?.title || slug,
      order: data.meta?.order ?? 999,
    };

    for (const section of data.sections || []) {
      for (const topic of section.items || []) {
        // Collect concept keys for progress tracking
        const conceptKeys = (topic.concepts || []).map(
          (c) => `${topic.id}:${c.name}`
        );
        
        nodes.push({
          id: `${slug}/${topic.id}`,
          label: topic.title,
          track: slug,
          section: section.id,
          sectionTitle: section.title,
          conceptKeys,
        });
      }
    }
  }

  // Create a set of valid node IDs for edge validation
  const validNodeIds = new Set(nodes.map(n => n.id));

  // Second pass: extract edges from prerequisites
  for (const file of files) {
    const slug = file.replace('.json', '');
    const data = JSON.parse(readFileSync(join(dataDir, file), 'utf-8'));

    for (const section of data.sections || []) {
      for (const topic of section.items || []) {
        const targetId = `${slug}/${topic.id}`;

        for (const prereq of topic.prerequisites || []) {
          // Linkable format: "track/topic-id/Display Name"
          const parts = prereq.split('/');
          if (parts.length >= 2) {
            const sourceId = `${parts[0]}/${parts[1]}`;
            
            // Only add edge if source exists
            if (validNodeIds.has(sourceId)) {
              edges.push({
                source: sourceId,
                target: targetId,
              });
            }
          }
        }
      }
    }
  }

  // Sort track meta by order
  const sortedTracks = Object.entries(trackMeta)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([slug, meta]) => ({ slug, ...meta }));

  const graphData = {
    nodes,
    edges,
    tracks: sortedTracks,
  };

  writeFileSync(outFile, JSON.stringify(graphData, null, 2));
  console.log(`✓ Graph data: ${nodes.length} nodes, ${edges.length} edges, ${sortedTracks.length} tracks`);
}

buildGraphData();