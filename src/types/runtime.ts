export type Bounds = { x: number; y: number; w: number; h: number }
export type Point = [number, number]

export interface EditionManifestItem {
  edition_id: string
  date: string
  slug: string
  title: string
  path: string
}

export interface EditionManifest {
  current_edition_id: string
  editions: EditionManifestItem[]
}

export interface EditionRecord {
  edition_id: string
  date: string
  status: string
  slug: string
  title: string
  scene_family: string
  brief_id: string
  plate_id: string
  artifact_map_id: string
  source_binding_set_id: string
  ambiance_recipe_id: string
  review_state_id: string
  publish_state: {
    is_live: boolean
    published_at: string | null
    archive_path: string | null
  }
  plate_asset_path: string
}

export interface BriefRecord {
  brief_id: string
  date: string
  signal_cluster_ids: string[]
  research_node_ids: string[]
  mood: string
  material_language: string[]
  lighting: string
  object_inventory: string[]
  interaction_grammar: {
    hero_count: number
    module_count: number
    window_strategy: string
  }
  negative_constraints: string[]
}

export interface ArtifactRecord {
  id: string
  kind: 'hero' | 'module'
  label: string
  artifact_type: string
  cluster_id: string
  bounds: Bounds
  polygon: Point[]
  mask_path?: string
  z_index: number
  source_binding_ids: string[]
}

export interface ArtifactMapRecord {
  artifact_map_id: string
  viewport: {
    base_width: number
    base_height: number
    aspect_ratio: string
  }
  default_cluster_id: string
  default_artifact_id: string
  artifacts: ArtifactRecord[]
}

export interface SourceBindingRecord {
  id: string
  artifact_id: string
  source_type: string
  source_url: string | null
  window_type: string
  hover_behavior: string
  click_behavior: string
  playback_persistence: boolean
  fallback_type: string
  title: string
  kicker: string
  excerpt: string
}

export interface SourceBindingSetRecord {
  source_binding_set_id: string
  bindings: SourceBindingRecord[]
}

export interface AmbianceRecord {
  ambiance_recipe_id: string
  motion_system: string
  color_drift: string
  glow_behavior: string
  audio_posture: string
  webgl_mode: string
  research_inputs: string[]
}

export interface ReviewRecord {
  review_state_id: string
  geometry_status: string
  clickability_status: string
  behavior_status: string
  editorial_status: string
  notes: string[]
}

export interface LoadedEdition {
  edition: EditionRecord
  brief: BriefRecord
  artifactMap: ArtifactMapRecord
  sourceBindings: SourceBindingSetRecord
  ambiance: AmbianceRecord
  review: ReviewRecord
}
