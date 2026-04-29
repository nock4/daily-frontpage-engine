import type { ArtifactRecord } from '../types/runtime'

type StageWindowPlacement = {
  anchorSide: 'left' | 'right'
  expansionLabel: 'left' | 'right' | 'up' | 'down'
  routeProfile: 'linear' | 'elbow'
  contactProfile: 'pin' | 'socket' | 'emitter'
  seamProfile: 'stitch' | 'cuff' | 'firefly'
  x: number
  y: number
  width: number
  maxHeight: number
  tone: 'preview' | 'hero' | 'module'
  emissionX: number
  emissionY: number
}

type StageWindowPlacementOptions = {
  spatialProfile?: 'airy' | 'tight' | 'anchored'
}

type SourceWindowMode = 'preview' | 'primary' | 'secondary'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const STAGE_BASE_WIDTH = 1536
const STAGE_BASE_HEIGHT = 1024

const previewSpatialProfiles = {
  default: { width: 0.24, maxHeight: 0.3, xGap: 0.02, yOffset: 0.015 },
  airy: { width: 0.28, maxHeight: 0.34, xGap: 0.035, yOffset: 0.015 },
  tight: { width: 0.21, maxHeight: 0.28, xGap: 0.015, yOffset: 0.01 },
  anchored: { width: 0.23, maxHeight: 0.28, xGap: 0.012, yOffset: 0.008 },
} as const satisfies Record<NonNullable<StageWindowPlacementOptions['spatialProfile']> | 'default', {
  width: number
  maxHeight: number
  xGap: number
  yOffset: number
}>

const getStageWindowSizeProfile = (
  artifact: ArtifactRecord,
  mode: SourceWindowMode,
  spatialProfile?: StageWindowPlacementOptions['spatialProfile'],
) => {
  if (mode === 'preview') return previewSpatialProfiles[spatialProfile ?? 'default']
  if (mode === 'secondary') return { width: 0.28, maxHeight: 0.44, xGap: 0.06, yOffset: 0.04 }
  return { width: artifact.kind === 'hero' ? 0.38 : 0.3, maxHeight: 0.58, xGap: 0.06, yOffset: 0.05 }
}

const getArtifactContactProfile = (artifactType: string): StageWindowPlacement['contactProfile'] => {
  const normalized = artifactType.trim().toLowerCase()

  if (
    normalized.includes('device')
    || normalized.includes('cabinet')
    || normalized.includes('box')
    || normalized.includes('display')
    || normalized.includes('case')
    || normalized.includes('lock')
    || normalized.includes('hardware')
    || normalized.includes('bulletin-board')
  ) {
    return 'socket'
  }

  if (
    normalized.includes('lamp')
    || normalized.includes('candle')
    || normalized.includes('plant')
    || normalized.includes('vial')
    || normalized.includes('vessel')
    || normalized.includes('jar')
    || normalized.includes('bowl')
    || normalized.includes('cup')
    || normalized.includes('teapot')
    || normalized.includes('dish')
    || normalized.includes('altar')
    || normalized.includes('native-artifact')
  ) {
    return 'emitter'
  }

  return 'pin'
}

const getSeamProfile = (contactProfile: StageWindowPlacement['contactProfile']): StageWindowPlacement['seamProfile'] => {
  if (contactProfile === 'socket') return 'cuff'
  if (contactProfile === 'emitter') return 'firefly'
  return 'stitch'
}

export const getStageWindowPlacement = (
  artifact: ArtifactRecord,
  mode: SourceWindowMode,
  options: { spatialProfile?: 'airy' | 'tight' | 'anchored' } = {},
) => {
  const { width, maxHeight, xGap, yOffset } = getStageWindowSizeProfile(artifact, mode, options.spatialProfile)
  const xMargin = 0.06
  const yMargin = 0.08
  const artifactCenterX = artifact.bounds.x + artifact.bounds.w / 2
  const geometryStageOrigin = mode === 'preview'
    ? artifact.geometry?.safe_hover_origin_px
    : artifact.geometry?.safe_stage_window_origin_px
  const geometryAnchorSide = artifact.geometry?.preferred_expansion_label === 'left' || artifact.geometry?.preferred_expansion_label === 'right'
    ? artifact.geometry.preferred_expansion_label
    : null
  const anchorSide = geometryAnchorSide ?? (artifactCenterX >= 0.58 ? 'left' : 'right')
  const expansionLabel = artifact.geometry?.preferred_expansion_label ?? anchorSide
  const routeProfile = expansionLabel === 'up' || expansionLabel === 'down' ? 'elbow' : 'linear'
  const contactProfile = getArtifactContactProfile(artifact.artifact_type)
  const seamProfile = getSeamProfile(contactProfile)
  const rawX = geometryStageOrigin
    ? geometryStageOrigin[0] / STAGE_BASE_WIDTH - (anchorSide === 'left' ? width * (mode === 'preview' ? 0.52 : 0.7) : width * (mode === 'preview' ? 0.08 : 0.14))
    : anchorSide === 'right'
      ? artifact.bounds.x + artifact.bounds.w + xGap
      : artifact.bounds.x - width - (xGap - 0.06)
  const rawY = geometryStageOrigin
    ? geometryStageOrigin[1] / STAGE_BASE_HEIGHT - maxHeight * 0.08
    : artifact.bounds.y - yOffset
  const emissionX = geometryStageOrigin
    ? geometryStageOrigin[0] / STAGE_BASE_WIDTH
    : anchorSide === 'right'
      ? artifact.bounds.x + artifact.bounds.w
      : artifact.bounds.x
  const emissionY = geometryStageOrigin
    ? geometryStageOrigin[1] / STAGE_BASE_HEIGHT
    : artifact.bounds.y + artifact.bounds.h / 2

  return {
    anchorSide,
    expansionLabel,
    routeProfile,
    contactProfile,
    seamProfile,
    x: Number(clamp(rawX, xMargin, 1 - width - xMargin).toFixed(2)),
    y: Number(clamp(rawY, yMargin, 1 - maxHeight - yMargin).toFixed(2)),
    width: Number(width.toFixed(2)),
    maxHeight: Number(maxHeight.toFixed(2)),
    tone: mode === 'preview' ? 'preview' : artifact.kind === 'hero' ? 'hero' : 'module',
    emissionX: Number(clamp(emissionX, 0, 1).toFixed(2)),
    emissionY: Number(clamp(emissionY, 0, 1).toFixed(2)),
  }
}
