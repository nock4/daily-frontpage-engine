import { describe, expect, it } from 'vitest'
import type { SourceBindingRecord } from '../types/runtime'
import { closeWindow, createWindowState, hoverBinding, pinBinding } from './sourceWindowManager'

const audioBinding: SourceBindingRecord = {
  id: 'binding-audio',
  artifact_id: 'module-audio',
  source_type: 'nts',
  source_url: 'https://example.com/audio',
  window_type: 'audio',
  hover_behavior: 'preview',
  click_behavior: 'pin-open',
  playback_persistence: true,
  fallback_type: 'rich-preview',
  title: 'Audio binding',
  kicker: 'Audio',
  excerpt: 'Audio pocket',
}

const visualBinding: SourceBindingRecord = {
  id: 'binding-video',
  artifact_id: 'module-video',
  source_type: 'youtube',
  source_url: 'https://example.com/video',
  window_type: 'video',
  hover_behavior: 'preview',
  click_behavior: 'pin-open',
  playback_persistence: true,
  fallback_type: 'rich-preview',
  title: 'Video binding',
  kicker: 'Video',
  excerpt: 'Video pocket',
}

describe('sourceWindowManager', () => {
  it('opens lightweight preview on hover', () => {
    const state = hoverBinding(createWindowState(), audioBinding)
    expect(state.previewBindingId).toBe('binding-audio')
    expect(state.openBindingIds).toEqual([])
  })

  it('pins a binding as the primary active window on click', () => {
    const state = pinBinding(createWindowState(), visualBinding)
    expect(state.primaryBindingId).toBe('binding-video')
    expect(state.focusedBindingId).toBe('binding-video')
    expect(state.openBindingIds).toEqual(['binding-video'])
  })

  it('keeps persistent audio alive in the dock when a visual window replaces it', () => {
    const withAudio = pinBinding(createWindowState(), audioBinding)
    const withVisual = pinBinding(withAudio, visualBinding)

    expect(withVisual.primaryBindingId).toBe('binding-video')
    expect(withVisual.minimizedBindingIds).toEqual(['binding-audio'])
    expect(withVisual.openBindingIds).toEqual(['binding-audio', 'binding-video'])
  })

  it('removes closed windows from both the dock and open stack', () => {
    const withAudio = pinBinding(createWindowState(), audioBinding)
    const withVisual = pinBinding(withAudio, visualBinding)
    const closed = closeWindow(withVisual, 'binding-audio')

    expect(closed.openBindingIds).toEqual(['binding-video'])
    expect(closed.minimizedBindingIds).toEqual([])
  })
})
