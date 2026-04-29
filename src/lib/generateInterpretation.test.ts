import { describe, expect, it } from 'vitest'

import { generateInterpretation } from './generateInterpretation'
import type { ArtifactMapRecord, BriefRecord, EditionRecord, SourceBindingSetRecord } from '../types/runtime'

const briefRecord: BriefRecord = {
  brief_id: 'brief-1',
  date: '2026-04-24',
  signal_cluster_ids: ['cluster-1'],
  research_node_ids: ['node-1'],
  mood: 'moody cabinet room',
  material_language: ['dark wood', 'paper'],
  lighting: 'soft lamp glow',
  object_inventory: ['placard', 'cabinet'],
  interaction_grammar: {
    hero_count: 2,
    module_count: 4,
    window_strategy: 'source-window',
  },
  negative_constraints: ['no dashboard'],
}

const sourceBindingsRecord: SourceBindingSetRecord = {
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
}

function makeEdition(sceneFamily: string): EditionRecord {
  return {
    edition_id: 'edition-1',
    date: '2026-04-24',
    status: 'draft',
    slug: 'edition-1',
    title: 'Edition 1',
    scene_family: sceneFamily,
    brief_id: 'brief-1',
    plate_id: 'plate-1',
    artifact_map_id: 'map-1',
    source_binding_set_id: 'bindings-1',
    ambiance_recipe_id: 'amb-1',
    review_state_id: 'review-1',
    publish_state: {
      is_live: false,
      published_at: null,
      archive_path: null,
    },
    plate_asset_path: '/editions/edition-1/assets/plate.jpg',
  }
}

function makeArtifactMap(artifacts: ArtifactMapRecord['artifacts']): ArtifactMapRecord {
  return {
    artifact_map_id: 'map-1',
    viewport: {
      base_width: 1440,
      base_height: 900,
      aspect_ratio: '16:10',
    },
    default_cluster_id: 'cluster-1',
    default_artifact_id: artifacts[0]?.id ?? 'artifact-1',
    artifacts,
  }
}

describe('generateInterpretation', () => {
  it('classifies cabinet-like scenes as object-native', () => {
    const artifactMap = makeArtifactMap([
      {
        id: 'artifact-1',
        kind: 'hero',
        label: 'Main cabinet plaque',
        artifact_type: 'catalogue-plaque',
        cluster_id: 'cluster-1',
        bounds: { x: 0.1, y: 0.1, w: 0.2, h: 0.1 },
        polygon: [[0.1, 0.1], [0.3, 0.1], [0.3, 0.2]],
        z_index: 1,
        source_binding_ids: ['binding-1'],
      },
      {
        id: 'artifact-2',
        kind: 'module',
        label: 'Field recordings box',
        artifact_type: 'archive-box',
        cluster_id: 'cluster-1',
        bounds: { x: 0.4, y: 0.5, w: 0.2, h: 0.16 },
        polygon: [[0.4, 0.5], [0.6, 0.5], [0.6, 0.66]],
        z_index: 2,
        source_binding_ids: [],
      },
    ])

    const interpretation = generateInterpretation({
      edition: makeEdition('forest-breath-cabinet'),
      brief: briefRecord,
      artifactMap,
      sourceBindings: sourceBindingsRecord,
      motifTags: ['forest', 'cabinet', 'ambient'],
      analysis: {
        scene_summary: 'A dim ecological listening station built around an antique cabinet.',
        detected_objects: [
          { label: 'Environmental Sound Catalogue plaque', role: 'hero-anchor' },
          { label: 'field recordings box', role: 'archive container' },
        ],
        usable_surfaces: ['catalogue plaque', 'field recordings box'],
      },
      geometryKit: {
        'artifact-1': {
          winner: 'depth-semantic',
          scores: {
            'depth-semantic': { total: 0.72 },
          },
        },
      },
      candidatePack: {
        'artifact-1': {
          candidates: [
            { name: 'depth-semantic', score: { total: 0.68 } },
          ],
        },
      },
    })

    expect(interpretation.scene_ontology.primary).toBe('object-native')
    expect(interpretation.world_read.summary).toContain('ecological listening station')
    expect(interpretation.artifact_candidates[0]?.strength).toBeGreaterThan(0.95)
    expect(interpretation.interaction_world.recommended_behaviors).toContain('cabinet-drawer-behavior')
    expect(interpretation.enhancement_bundle.primary).toContain('mechanical-reveal-system')
    expect(interpretation.artifact_candidates.length).toBeGreaterThan(0)
  })

  it('classifies landscape/map-like scenes as field-native', () => {
    const artifactMap = makeArtifactMap([
      {
        id: 'artifact-1',
        kind: 'hero',
        label: 'Watershed map board',
        artifact_type: 'watershed-map-board',
        cluster_id: 'cluster-1',
        bounds: { x: 0.1, y: 0.2, w: 0.6, h: 0.4 },
        polygon: [[0.1, 0.2], [0.7, 0.2], [0.7, 0.6]],
        z_index: 1,
        source_binding_ids: ['binding-1'],
      },
    ])

    const interpretation = generateInterpretation({
      edition: makeEdition('detroit-native-frontage'),
      brief: {
        ...briefRecord,
        mood: 'panoramic ecological landscape',
        material_language: ['water', 'soil', 'grass'],
        object_inventory: ['watershed marker'],
      },
      artifactMap,
      sourceBindings: sourceBindingsRecord,
      motifTags: ['stormwater', 'ecology', 'front-yard'],
    })

    expect(interpretation.scene_ontology.primary).toBe('field-native')
    expect(interpretation.interaction_world.recommended_behaviors).toContain('light-path-reaction')
    expect(interpretation.enhancement_bundle.primary).toContain('light-path-reveal')
    expect(interpretation.field_candidates.length).toBeGreaterThan(0)
  })

  it('treats gestural source marks as first-class abstract surfaces', () => {
    const artifactMap = makeArtifactMap([
      {
        id: 'artifact-1',
        kind: 'hero',
        label: 'Dominant red interruption',
        artifact_type: 'threshold-interruption',
        cluster_id: 'cluster-1',
        bounds: { x: 0.18, y: 0.22, w: 0.42, h: 0.2 },
        polygon: [[0.18, 0.22], [0.6, 0.24], [0.56, 0.42], [0.2, 0.38]],
        z_index: 1,
        source_binding_ids: ['binding-1'],
      },
      {
        id: 'artifact-2',
        kind: 'module',
        label: 'Bright source fleck',
        artifact_type: 'source-fleck',
        cluster_id: 'cluster-1',
        bounds: { x: 0.66, y: 0.36, w: 0.08, h: 0.08 },
        polygon: [[0.66, 0.36], [0.74, 0.37], [0.73, 0.44], [0.67, 0.43]],
        z_index: 2,
        source_binding_ids: [],
      },
    ])

    const interpretation = generateInterpretation({
      edition: makeEdition('vermilion-gesture-field'),
      brief: {
        ...briefRecord,
        mood: 'abstract expressionist field',
        material_language: ['open color field', 'line break', 'bright fleck'],
        object_inventory: ['large red field', 'single disruptive gesture', 'small source-bearing marks'],
      },
      artifactMap,
      sourceBindings: sourceBindingsRecord,
      motifTags: ['gesture-field', 'source-marks'],
      analysis: {
        scene_summary: 'A sparse color field with one disruptive gesture and several small source-bearing flecks.',
        detected_objects: [
          { label: 'dominant red interruption', role: 'gesture-mark' },
          { label: 'bright source fleck', role: 'light-mark' },
        ],
        usable_surfaces: ['line break', 'bright fleck', 'void mark'],
      },
    })

    expect(interpretation.scene_ontology.primary).not.toBe('object-native')
    expect(interpretation.html_surfaces[0]?.surface_type).toBe('paint')
    expect(interpretation.artifact_candidates[0]?.supports).toContain('threshold-scan-reveal')
  })

  it('assigns screen-rendered treatments to glass/video artifacts when plate evidence supports it', () => {
    const artifactMap = makeArtifactMap([
      {
        id: 'artifact-1',
        kind: 'hero',
        label: 'Central Habitat Vitrine',
        artifact_type: 'habitat-vitrine',
        cluster_id: 'cluster-1',
        bounds: { x: 0.2, y: 0.1, w: 0.3, h: 0.4 },
        polygon: [[0.2, 0.1], [0.5, 0.1], [0.5, 0.5]],
        z_index: 1,
        source_binding_ids: ['binding-1'],
      },
    ])

    const interpretation = generateInterpretation({
      edition: makeEdition('forest-breath-cabinet'),
      brief: {
        ...briefRecord,
        mood: 'humid glass cabinet',
        material_language: ['glass', 'fog', 'wood'],
        object_inventory: ['vitrine', 'cabinet'],
      },
      artifactMap,
      sourceBindings: {
        ...sourceBindingsRecord,
        bindings: [
          {
            ...sourceBindingsRecord.bindings[0],
            source_type: 'youtube',
            window_type: 'video',
            title: 'Central Habitat Vitrine',
          },
        ],
      },
      analysis: {
        scene_summary: 'A glass habitat vitrine acts like a glowing listening surface inside the cabinet.',
        detected_objects: [
          { label: 'central habitat vitrine', role: 'device_surface' },
        ],
        usable_surfaces: ['glass vitrine'],
      },
    })

    expect(interpretation.artifact_candidates[0]?.supports.slice(0, 2)).toEqual(['screen-rendered-html', 'threshold-scan-reveal'])
    expect(interpretation.html_surfaces[0]?.surface_type).toBe('screen')
  })

  it('classifies shrine/altar scenes as ritual-native', () => {
    const artifactMap = makeArtifactMap([
      {
        id: 'artifact-1',
        kind: 'hero',
        label: 'Candle altar',
        artifact_type: 'candle-altar',
        cluster_id: 'cluster-1',
        bounds: { x: 0.2, y: 0.1, w: 0.3, h: 0.4 },
        polygon: [[0.2, 0.1], [0.5, 0.1], [0.5, 0.5]],
        z_index: 1,
        source_binding_ids: ['binding-1'],
      },
    ])

    const interpretation = generateInterpretation({
      edition: makeEdition('candle-library-altar'),
      brief: {
        ...briefRecord,
        mood: 'quiet ritual altar',
        material_language: ['wax', 'parchment', 'glow'],
        object_inventory: ['candle', 'altar'],
      },
      artifactMap,
      sourceBindings: sourceBindingsRecord,
      motifTags: ['altar', 'library', 'ritual'],
    })

    expect(interpretation.scene_ontology.primary).toBe('ritual-native')
    expect(interpretation.interaction_world.recommended_behaviors).toContain('activation-bloom')
    expect(interpretation.enhancement_bundle.secondary).toContain('seal-break-reveal')
  })
})
