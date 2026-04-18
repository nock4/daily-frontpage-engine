import { describe, expect, it } from 'vitest'
import type { SourceBindingRecord } from '../types/runtime'
import { closeWindow, createWindowState, focusWindow, hoverBinding, pinBinding } from './sourceWindowManager'

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

const secondaryVisualBinding: SourceBindingRecord = {
  id: 'binding-web',
  artifact_id: 'module-web',
  source_type: 'article',
  source_url: 'https://example.com/article',
  window_type: 'web',
  hover_behavior: 'preview',
  click_behavior: 'pin-open',
  playback_persistence: false,
  fallback_type: 'rich-preview',
  title: 'Web binding',
  kicker: 'Web',
  excerpt: 'Web pocket',
}

const tertiaryVisualBinding: SourceBindingRecord = {
  id: 'binding-social',
  artifact_id: 'module-social',
  source_type: 'tweet',
  source_url: 'https://x.com/nick/status/123',
  window_type: 'social',
  hover_behavior: 'preview',
  click_behavior: 'pin-open',
  playback_persistence: false,
  fallback_type: 'rich-preview',
  title: 'Social binding',
  kicker: 'Social',
  excerpt: 'Social pocket',
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

  it('freezes hover previews when a primary visual window is already open in live mode', () => {
    const withPrimaryVisual = pinBinding(createWindowState(), visualBinding)
    const hovered = hoverBinding(withPrimaryVisual, audioBinding, { freezeWhenPrimaryWindowOpen: true })

    expect(hovered.previewBindingId).toBeNull()
    expect(hovered.primaryBindingId).toBe('binding-video')
  })

  it('still allows hover previews when only persistent audio is open', () => {
    const withPrimaryAudio = pinBinding(createWindowState(), audioBinding)
    const hovered = hoverBinding(withPrimaryAudio, visualBinding, { freezeWhenPrimaryWindowOpen: true })

    expect(hovered.previewBindingId).toBe('binding-video')
  })

  it('keeps persistent audio alive in the dock when a visual window replaces it', () => {
    const withAudio = pinBinding(createWindowState(), audioBinding)
    const withVisual = pinBinding(withAudio, visualBinding)

    expect(withVisual.primaryBindingId).toBe('binding-video')
    expect(withVisual.minimizedBindingIds).toEqual(['binding-audio'])
    expect(withVisual.openBindingIds).toEqual(['binding-audio', 'binding-video'])
  })

  it('keeps two visual windows open on stage before replacement kicks in', () => {
    const withFirst = pinBinding(createWindowState(), visualBinding)
    const withSecond = pinBinding(withFirst, secondaryVisualBinding)

    expect(withSecond.openBindingIds).toEqual(['binding-video', 'binding-web'])
    expect(withSecond.primaryBindingId).toBe('binding-web')
    expect(withSecond.focusedBindingId).toBe('binding-web')
  })

  it('replaces the oldest visual window when opening a third visual window', () => {
    const withFirst = pinBinding(createWindowState(), visualBinding)
    const withSecond = pinBinding(withFirst, secondaryVisualBinding)
    const withThird = pinBinding(withSecond, tertiaryVisualBinding)

    expect(withThird.openBindingIds).toEqual(['binding-web', 'binding-social'])
    expect(withThird.primaryBindingId).toBe('binding-social')
  })

  it('brings a visual window to the front when focused', () => {
    const withFirst = pinBinding(createWindowState(), visualBinding)
    const withSecond = pinBinding(withFirst, secondaryVisualBinding)
    const focused = focusWindow(withSecond, 'binding-video')

    expect(focused.openBindingIds).toEqual(['binding-web', 'binding-video'])
    expect(focused.primaryBindingId).toBe('binding-video')
    expect(focused.focusedBindingId).toBe('binding-video')
  })

  it('removes closed windows from both the dock and open stack', () => {
    const withAudio = pinBinding(createWindowState(), audioBinding)
    const withVisual = pinBinding(withAudio, visualBinding)
    const closed = closeWindow(withVisual, 'binding-audio')

    expect(closed.openBindingIds).toEqual(['binding-video'])
    expect(closed.minimizedBindingIds).toEqual([])
  })

  it('promotes the remaining visual window when the frontmost visual window closes', () => {
    const withFirst = pinBinding(createWindowState(), visualBinding)
    const withSecond = pinBinding(withFirst, secondaryVisualBinding)
    const closed = closeWindow(withSecond, 'binding-web')

    expect(closed.openBindingIds).toEqual(['binding-video'])
    expect(closed.primaryBindingId).toBe('binding-video')
    expect(closed.focusedBindingId).toBe('binding-video')
  })
})
