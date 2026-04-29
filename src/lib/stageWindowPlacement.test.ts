import { describe, expect, it } from 'vitest'
import { getStageWindowPlacement } from './stageWindowPlacement'
import type { ArtifactRecord } from '../types/runtime'

const makeArtifact = (overrides: Partial<ArtifactRecord>): ArtifactRecord => ({
  id: 'artifact-1',
  kind: 'module',
  label: 'Specimen note',
  artifact_type: 'note',
  cluster_id: 'cluster-1',
  bounds: { x: 0.12, y: 0.14, w: 0.22, h: 0.18 },
  polygon: [],
  z_index: 3,
  source_binding_ids: ['binding-1'],
  ...overrides,
})

describe('getStageWindowPlacement', () => {
  it('pushes a primary live window away from a left-side artifact and enlarges hero pockets', () => {
    expect(
      getStageWindowPlacement(
        makeArtifact({ kind: 'hero', bounds: { x: 0.08, y: 0.16, w: 0.24, h: 0.34 } }),
        'primary',
      ),
    ).toEqual({
      anchorSide: 'right',
      expansionLabel: 'right',
      routeProfile: 'linear',
      contactProfile: 'pin',
      seamProfile: 'stitch',
      x: 0.38,
      y: 0.11,
      width: 0.38,
      maxHeight: 0.58,
      tone: 'hero',
      emissionX: 0.32,
      emissionY: 0.33,
    })
  })

  it('keeps a preview compact and flips it left when the artifact sits on the right edge', () => {
    expect(
      getStageWindowPlacement(
        makeArtifact({ bounds: { x: 0.74, y: 0.2, w: 0.16, h: 0.16 } }),
        'preview',
      ),
    ).toEqual({
      anchorSide: 'left',
      expansionLabel: 'left',
      routeProfile: 'linear',
      contactProfile: 'pin',
      seamProfile: 'stitch',
      x: 0.54,
      y: 0.18,
      width: 0.24,
      maxHeight: 0.3,
      tone: 'preview',
      emissionX: 0.74,
      emissionY: 0.28,
    })
  })

  it('lets article previews breathe wider and farther from the artifact', () => {
    expect(
      getStageWindowPlacement(
        makeArtifact({ bounds: { x: 0.14, y: 0.2, w: 0.16, h: 0.16 } }),
        'preview',
        { spatialProfile: 'airy' },
      ),
    ).toEqual({
      anchorSide: 'right',
      expansionLabel: 'right',
      routeProfile: 'linear',
      contactProfile: 'pin',
      seamProfile: 'stitch',
      x: 0.34,
      y: 0.18,
      width: 0.28,
      maxHeight: 0.34,
      tone: 'preview',
      emissionX: 0.3,
      emissionY: 0.28,
    })
  })

  it('keeps repo and site previews tighter and closer to the artifact', () => {
    expect(
      getStageWindowPlacement(
        makeArtifact({ bounds: { x: 0.14, y: 0.2, w: 0.16, h: 0.16 } }),
        'preview',
        { spatialProfile: 'tight' },
      ),
    ).toEqual({
      anchorSide: 'right',
      expansionLabel: 'right',
      routeProfile: 'linear',
      contactProfile: 'pin',
      seamProfile: 'stitch',
      x: 0.32,
      y: 0.19,
      width: 0.21,
      maxHeight: 0.28,
      tone: 'preview',
      emissionX: 0.3,
      emissionY: 0.28,
    })
  })

  it('keeps pdf previews anchored nearer to the artifact footprint', () => {
    expect(
      getStageWindowPlacement(
        makeArtifact({ bounds: { x: 0.14, y: 0.2, w: 0.16, h: 0.16 } }),
        'preview',
        { spatialProfile: 'anchored' },
      ),
    ).toEqual({
      anchorSide: 'right',
      expansionLabel: 'right',
      routeProfile: 'linear',
      contactProfile: 'pin',
      seamProfile: 'stitch',
      x: 0.31,
      y: 0.19,
      width: 0.23,
      maxHeight: 0.28,
      tone: 'preview',
      emissionX: 0.3,
      emissionY: 0.28,
    })
  })

  it('uses geometry anchors when an artifact carries a stage origin and expansion direction', () => {
    expect(
      getStageWindowPlacement(
        makeArtifact({
          artifact_type: 'glass-cabinet',
          bounds: { x: 0.42, y: 0.32, w: 0.16, h: 0.12 },
          geometry: {
            safe_stage_window_origin_px: [756, 260],
            safe_hover_origin_px: [720, 240],
            preferred_expansion_label: 'left',
          },
        }),
        'primary',
      ),
    ).toEqual({
      anchorSide: 'left',
      expansionLabel: 'left',
      routeProfile: 'linear',
      contactProfile: 'socket',
      seamProfile: 'cuff',
      x: 0.28,
      y: 0.21,
      width: 0.3,
      maxHeight: 0.58,
      tone: 'module',
      emissionX: 0.49,
      emissionY: 0.25,
    })
  })

  it('preserves vertical expansion labels so projection beams can route upward or downward', () => {
    expect(
      getStageWindowPlacement(
        makeArtifact({
          artifact_type: 'lamp',
          bounds: { x: 0.46, y: 0.56, w: 0.14, h: 0.1 },
          geometry: {
            safe_stage_window_origin_px: [620, 510],
            safe_hover_origin_px: [640, 528],
            preferred_expansion_label: 'up',
          },
        }),
        'preview',
      ),
    ).toEqual({
      anchorSide: 'right',
      expansionLabel: 'up',
      routeProfile: 'elbow',
      contactProfile: 'emitter',
      seamProfile: 'firefly',
      x: 0.4,
      y: 0.49,
      width: 0.24,
      maxHeight: 0.3,
      tone: 'preview',
      emissionX: 0.42,
      emissionY: 0.52,
    })
  })

  it('keeps geometry-origin windows inside the normalized stage viewport near the lower right', () => {
    const placement = getStageWindowPlacement(
      makeArtifact({
        bounds: { x: 0.72, y: 0.76, w: 0.18, h: 0.16 },
        geometry: {
          safe_stage_window_origin_px: [1450, 930],
          safe_hover_origin_px: [1440, 900],
          preferred_expansion_label: 'left',
        },
      }),
      'primary',
    )

    expect(placement.x).toBeLessThanOrEqual(0.64)
    expect(placement.y).toBeLessThanOrEqual(0.34)
    expect(placement.x + placement.width).toBeLessThanOrEqual(0.94)
    expect(placement.y + placement.maxHeight).toBeLessThanOrEqual(0.92)
  })
})
