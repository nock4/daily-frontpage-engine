import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { generateEnhancementPlanFiles } from '../../scripts/lib/generate-enhancement-plan-files.mjs'

const tempDirs = []

afterEach(() => {
  while (tempDirs.length) {
    fs.rmSync(tempDirs.pop(), { recursive: true, force: true })
  }
})

function makeTempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dfe-enhance-'))
  tempDirs.push(dir)
  fs.mkdirSync(path.join(dir, 'public', 'editions', 'sample-edition'), { recursive: true })
  return dir
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2))
}

describe('generateEnhancementPlanFiles', () => {
  it('writes enhancement-plan.json for editions with interpretation.json', async () => {
    const repoRoot = makeTempRepo()
    const editionsRoot = path.join(repoRoot, 'public', 'editions')

    writeJson(path.join(editionsRoot, 'index.json'), {
      current_edition_id: 'edition-1',
      editions: [
        {
          edition_id: 'edition-1',
          date: '2026-04-24',
          slug: 'sample-edition',
          title: 'Sample Edition',
          path: '/editions/sample-edition',
          scene_family: 'sample-family',
          motif_tags: ['sample'],
          preview_asset_path: '/editions/sample-edition/assets/preview.jpg',
          is_live: true,
        },
      ],
    })

    const editionBase = path.join(editionsRoot, 'sample-edition')
    writeJson(path.join(editionBase, 'brief.json'), {
      brief_id: 'brief-1',
      date: '2026-04-24',
      signal_cluster_ids: ['cluster-1'],
      research_node_ids: ['node-1'],
      mood: 'moody',
      material_language: ['paper'],
      lighting: 'soft',
      object_inventory: ['placard'],
      interaction_grammar: {
        hero_count: 1,
        module_count: 2,
        window_strategy: 'source-window',
      },
      negative_constraints: ['no dashboard'],
    })
    writeJson(path.join(editionBase, 'artifact-map.json'), {
      artifact_map_id: 'map-1',
      viewport: {
        base_width: 1440,
        base_height: 900,
        aspect_ratio: '16:10',
      },
      default_cluster_id: 'cluster-1',
      default_artifact_id: 'artifact-1',
      artifacts: [
        {
          id: 'artifact-1',
          kind: 'hero',
          label: 'Hero artifact',
          artifact_type: 'placard',
          cluster_id: 'cluster-1',
          bounds: { x: 0.1, y: 0.2, w: 0.1, h: 0.1 },
          polygon: [[0.1, 0.2], [0.2, 0.2], [0.2, 0.3]],
          z_index: 2,
          source_binding_ids: ['binding-1'],
        },
      ],
    })
    writeJson(path.join(editionBase, 'source-bindings.json'), {
      source_binding_set_id: 'bindings-1',
      bindings: [
        {
          id: 'binding-1',
          artifact_id: 'artifact-1',
          source_type: 'article',
          source_url: 'https://example.com/article',
          window_type: 'web',
          hover_behavior: 'preview',
          click_behavior: 'pin-open',
          playback_persistence: false,
          fallback_type: 'rich-preview',
          title: 'Example article',
          kicker: 'Research',
          excerpt: 'Example excerpt',
        },
      ],
    })
    writeJson(path.join(editionBase, 'interpretation.json'), {
      interpretation_id: 'interp-1',
      edition_id: 'edition-1',
      plate_read_timestamp: '2026-04-24T17:10:00Z',
      scene_ontology: {
        primary: 'object-native',
        secondary: [],
        confidence: 0.91,
      },
      world_read: {
        summary: 'Cabinet-like scene with paper and glass surfaces.',
        dominant_spatial_mode: 'contained',
        density: 'medium',
        legibility: 'high',
        mood: ['quiet', 'archival'],
      },
      visual_ecology: {
        dominant_objects: ['cabinet', 'placard'],
        dominant_surfaces: ['paper', 'glass'],
        dominant_structures: ['shelves'],
        negative_space_regions: [],
      },
      interaction_world: {
        class: 'object-native',
        recommended_behaviors: ['cabinet-drawer-behavior', 'object-memory'],
        rejected_behaviors: ['light-path-reaction'],
        reasoning: ['Discrete container logic dominates the plate.'],
      },
      artifact_candidates: [
        {
          id: 'artifact-1',
          kind: 'hero',
          type: 'placard',
          strength: 0.88,
          bounds: { x: 0.1, y: 0.2, w: 0.1, h: 0.1 },
          supports: ['mechanical-reveal-system', 'hidden-self-aware-note'],
        },
      ],
      field_candidates: [],
      html_surfaces: [],
      enhancement_bundle: {
        primary: ['mechanical-reveal-system'],
        secondary: ['hidden-self-aware-note'],
        wildcard: [],
      },
      per_region_assignments: [],
      scene_wide_behavior: {
        selected: 'object-memory',
      },
      choreography_rule: {
        selected: 'anchor-and-satellites',
      },
      release_notes: ['Prefer object-bound interaction.'],
    })

    const result = await generateEnhancementPlanFiles({ repoRoot })

    expect(result.generated).toBe(1)
    const enhancementPlan = JSON.parse(fs.readFileSync(path.join(editionBase, 'enhancement-plan.json'), 'utf8'))
    expect(enhancementPlan.edition_id).toBe('edition-1')
    expect(enhancementPlan.interaction_world.class).toBe('object-native')
    expect(enhancementPlan.bundle.primary).toContain('mechanical-reveal-system')
    expect(enhancementPlan.bundle.secondary).not.toContain('hidden-self-aware-note')
    expect(enhancementPlan.targets.flatMap((target) => target.techniques)).not.toContain('hidden-self-aware-note')
  })

  it('skips editions without interpretation.json', async () => {
    const repoRoot = makeTempRepo()
    const editionsRoot = path.join(repoRoot, 'public', 'editions')

    writeJson(path.join(editionsRoot, 'index.json'), {
      current_edition_id: 'edition-1',
      editions: [
        {
          edition_id: 'edition-1',
          date: '2026-04-24',
          slug: 'sample-edition',
          title: 'Sample Edition',
          path: '/editions/sample-edition',
          scene_family: 'sample-family',
          motif_tags: ['sample'],
          preview_asset_path: '/editions/sample-edition/assets/preview.jpg',
          is_live: true,
        },
      ],
    })

    const result = await generateEnhancementPlanFiles({ repoRoot })

    expect(result.generated).toBe(0)
    expect(result.skipped).toBe(1)
    expect(fs.existsSync(path.join(editionsRoot, 'sample-edition', 'enhancement-plan.json'))).toBe(false)
  })
})
