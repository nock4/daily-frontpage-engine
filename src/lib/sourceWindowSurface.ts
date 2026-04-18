import type { SourceWindowDescriptor } from './sourceWindowContent'

export interface SourceWindowSurfaceProfile {
  showHeader: boolean
  showExcerpt: boolean
  showMeta: boolean
  showBodyEyebrow: boolean
  showBodyPlatformPill: boolean
  frameStyle: 'panel' | 'artifact-card' | 'embedded-media'
  bodyStyle: 'standard' | 'compact' | 'immersive'
  closeStyle: 'inline' | 'floating'
}

export const getSourceWindowSurfaceProfile = (
  descriptor: SourceWindowDescriptor,
  surface: 'panel' | 'stage',
  mode: 'preview' | 'primary' | 'secondary',
): SourceWindowSurfaceProfile => {
  if (surface === 'panel') {
    return {
      showHeader: true,
      showExcerpt: true,
      showMeta: true,
      showBodyEyebrow: true,
      showBodyPlatformPill: true,
      frameStyle: 'panel',
      bodyStyle: 'standard',
      closeStyle: 'inline',
    }
  }

  if (mode === 'preview') {
    return {
      showHeader: false,
      showExcerpt: false,
      showMeta: false,
      showBodyEyebrow: false,
      showBodyPlatformPill: true,
      frameStyle: 'artifact-card',
      bodyStyle: 'compact',
      closeStyle: 'floating',
    }
  }

  if (descriptor.kind === 'youtube-embed' || descriptor.kind === 'soundcloud-embed') {
    return {
      showHeader: false,
      showExcerpt: false,
      showMeta: false,
      showBodyEyebrow: false,
      showBodyPlatformPill: true,
      frameStyle: 'embedded-media',
      bodyStyle: 'immersive',
      closeStyle: 'floating',
    }
  }

  return {
    showHeader: false,
    showExcerpt: false,
    showMeta: false,
    showBodyEyebrow: false,
    showBodyPlatformPill: true,
    frameStyle: 'artifact-card',
    bodyStyle: 'standard',
    closeStyle: 'floating',
  }
}
