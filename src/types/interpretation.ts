export type SceneOntologyClass =
  | 'object-native'
  | 'field-native'
  | 'material-native'
  | 'optical-native'
  | 'ritual-native'

type SceneDensity = 'sparse' | 'medium' | 'dense'
type SceneLegibility = 'low' | 'selective' | 'high'
type DominantSpatialMode =
  | 'contained'
  | 'panoramic'
  | 'stacked'
  | 'distributed'
  | 'flat-field'
  | 'depth-led'

export type SurfaceType =
  | 'paper'
  | 'glass'
  | 'water'
  | 'fog'
  | 'rock'
  | 'metal'
  | 'screen'
  | 'paint'
  | 'varnish'
  | 'wood'
  | 'soil'
  | 'light-band'
  | 'reflection'
  | 'sky'
  | 'fabric'
  | 'unknown'

type InteractionWorldClass =
  | 'object-native'
  | 'field-native'
  | 'material-native'
  | 'optical-native'
  | 'ritual-native'

export type EnhancementTechnique =
  | 'screen-rendered-html'
  | 'warped-paper-fragment'
  | 'threshold-scan-reveal'
  | 'hidden-self-aware-note'
  | 'ghost-reflection-treatment'
  | 'mechanical-reveal-system'
  | 'card-drawer-metadata'
  | 'light-path-reveal'
  | 'route-overlay'
  | 'lens-inspection'
  | 'paint-bleed-reveal'
  | 'restoration-scan'
  | 'pigment-crack-annotation'
  | 'weather-band-text'
  | 'seal-break-reveal'
  | 'constellation-wake'

export type InteractionBehavior =
  | 'threshold-scan'
  | 'activation-bloom'
  | 'projection-reveal'
  | 'cabinet-drawer-behavior'
  | 'lens-inspection'
  | 'drag-to-tune'
  | 'light-path-reaction'
  | 'constellation-wake'
  | 'object-memory'
  | 'signal-lock'
  | 'paint-bleed-reveal'
  | 'restoration-scan'
  | 'weather-band-text'
  | 'ghost-reflection'

export type ChoreographyRule =
  | 'anchor-and-satellites'
  | 'signal-family-clustering'
  | 'narrative-reveal-order'
  | 'distributed-field-reveal'
  | 'ritual-escalation'

type CandidateTargetKind = 'artifact' | 'field-region' | 'surface-region' | 'global-scene'

interface BoundsRecord {
  x: number
  y: number
  w: number
  h: number
}

interface SceneOntologyRecord {
  primary: SceneOntologyClass
  secondary: SceneOntologyClass[]
  confidence: number
}

interface WorldReadRecord {
  summary: string
  dominant_spatial_mode: DominantSpatialMode
  density: SceneDensity
  legibility: SceneLegibility
  mood: string[]
}

interface VisualEcologyRecord {
  dominant_objects: string[]
  dominant_surfaces: SurfaceType[]
  dominant_structures: string[]
  negative_space_regions: Array<{
    id: string
    kind: string
    bounds: BoundsRecord
  }>
}

interface InterpretationArtifactCandidateRecord {
  id: string
  kind: 'hero' | 'module'
  type: string
  strength: number
  bounds: BoundsRecord
  supports: EnhancementTechnique[]
}

interface InterpretationFieldCandidateRecord {
  id: string
  type: string
  strength: number
  bounds: BoundsRecord
  supports: EnhancementTechnique[]
}

interface HtmlSurfaceRecord {
  id: string
  surface_type: SurfaceType
  host: CandidateTargetKind
  bounds: BoundsRecord
  suitability: number
  supported_treatments: EnhancementTechnique[]
}

interface InteractionWorldRecord {
  class: InteractionWorldClass
  recommended_behaviors: InteractionBehavior[]
  rejected_behaviors: InteractionBehavior[]
  reasoning: string[]
}

interface InterpretationEnhancementBundle {
  primary: EnhancementTechnique[]
  secondary: EnhancementTechnique[]
  wildcard: EnhancementTechnique[]
}

interface InterpretationAssignmentRecord {
  target_id: string
  enhancement: EnhancementTechnique
  source_classes: string[]
}

export interface InterpretationRecord {
  interpretation_id: string
  edition_id: string
  plate_read_timestamp: string
  scene_ontology: SceneOntologyRecord
  world_read: WorldReadRecord
  visual_ecology: VisualEcologyRecord
  interaction_world: InteractionWorldRecord
  artifact_candidates: InterpretationArtifactCandidateRecord[]
  field_candidates: InterpretationFieldCandidateRecord[]
  html_surfaces: HtmlSurfaceRecord[]
  enhancement_bundle: InterpretationEnhancementBundle
  per_region_assignments: InterpretationAssignmentRecord[]
  scene_wide_behavior: {
    selected: InteractionBehavior
  }
  choreography_rule: {
    selected: ChoreographyRule
  }
  release_notes: string[]
}
