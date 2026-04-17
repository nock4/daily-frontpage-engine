import { describe, expect, it } from 'vitest'
import type { AmbianceRecord, SourceBindingRecord } from '../types/runtime'
import { getRuntimeAmbienceClasses } from './runtimeAmbience'

const makeAmbiance = (overrides: Partial<AmbianceRecord> = {}): AmbianceRecord => ({
  ambiance_recipe_id: 'ambiance-2026-04-17-a',
  motion_system: 'soft-spore-drift',
  color_drift: 'warm-paper-breathing',
  glow_behavior: 'artifact-proximity',
  audio_posture: 'silent',
  webgl_mode: 'none',
  research_inputs: [],
  ...overrides,
})

const makeBinding = (overrides: Partial<SourceBindingRecord> = {}): SourceBindingRecord => ({
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
  kicker: 'Article',
  excerpt: 'Example excerpt',
  ...overrides,
})

describe('getRuntimeAmbienceClasses', () => {
  it('merges source-mode ambience with recipe-derived classes', () => {
    expect(getRuntimeAmbienceClasses(makeAmbiance(), makeBinding({ source_type: 'audio', window_type: 'audio' }))).toEqual([
      'ambient-audio',
      'recipe-motion-soft-spore-drift',
      'recipe-color-warm-paper-breathing',
      'recipe-glow-artifact-proximity',
      'recipe-audio-silent',
      'recipe-webgl-none',
    ])
  })

  it('falls back to idle source ambience while keeping recipe classes when there is no active binding', () => {
    expect(getRuntimeAmbienceClasses(makeAmbiance({ motion_system: 'slow star drift' }), null)).toEqual([
      'ambient-idle',
      'recipe-motion-slow-star-drift',
      'recipe-color-warm-paper-breathing',
      'recipe-glow-artifact-proximity',
      'recipe-audio-silent',
      'recipe-webgl-none',
    ])
  })

  it('returns only the source ambience class when the edition recipe is unavailable', () => {
    expect(getRuntimeAmbienceClasses(null, makeBinding({ source_type: 'tweet', window_type: 'social' }))).toEqual(['ambient-social'])
  })
})
