import type { ArtifactRecord } from '../types/runtime'

export interface StageWindowPlacement {
  anchorSide: 'left' | 'right'
  x: number
  y: number
  width: number
  maxHeight: number
  tone: 'preview' | 'hero' | 'module'
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const getStageWindowPlacement = (
  artifact: ArtifactRecord,
  mode: 'preview' | 'primary' | 'secondary',
): StageWindowPlacement => {
  const width = mode === 'preview' ? 0.24 : mode === 'secondary' ? 0.28 : artifact.kind === 'hero' ? 0.38 : 0.3
  const maxHeight = mode === 'preview' ? 0.3 : mode === 'secondary' ? 0.44 : 0.58
  const xMargin = 0.06
  const yMargin = 0.08
  const yOffset = mode === 'preview' ? 0.03 : mode === 'secondary' ? 0.04 : 0.05
  const artifactCenterX = artifact.bounds.x + artifact.bounds.w / 2
  const anchorSide = artifactCenterX >= 0.58 ? 'left' : 'right'
  const rawX = anchorSide === 'right'
    ? artifact.bounds.x + artifact.bounds.w + 0.06
    : artifact.bounds.x - width
  const rawY = artifact.bounds.y - yOffset

  return {
    anchorSide,
    x: Number(clamp(rawX, xMargin, 1 - width - xMargin).toFixed(2)),
    y: Number(clamp(rawY, yMargin, 1 - maxHeight - yMargin).toFixed(2)),
    width: Number(width.toFixed(2)),
    maxHeight: Number(maxHeight.toFixed(2)),
    tone: mode === 'preview' ? 'preview' : artifact.kind === 'hero' ? 'hero' : 'module',
  }
}
