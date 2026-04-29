export type ReviewMode = 'live' | 'clickable' | 'solo' | 'debug'

interface RuntimePresentation {
  showTopbar: boolean
  showSidebar: boolean
  showArtifactLists: boolean
  showReviewPanel: boolean
  showPersistentRegionLabels: boolean
  suppressArtifactLabelsWhenPrimaryWindowOpen: boolean
  showStageOverlayWindows: boolean
  stageFillViewport: boolean
  briefEyebrow: string
  selectionEyebrow: string
  sourceWindowsEmptyState: string
}

export const getRuntimePresentation = (reviewMode: ReviewMode): RuntimePresentation => {
  if (reviewMode === 'live') {
    return {
      showTopbar: false,
      showSidebar: false,
      showArtifactLists: false,
      showReviewPanel: false,
      showPersistentRegionLabels: false,
      suppressArtifactLabelsWhenPrimaryWindowOpen: true,
      showStageOverlayWindows: true,
      stageFillViewport: true,
      briefEyebrow: 'Edition',
      selectionEyebrow: 'Active pocket',
      sourceWindowsEmptyState: 'Open a pocket to pin a source window.',
    }
  }

  return {
    showTopbar: true,
    showSidebar: true,
    showArtifactLists: true,
    showReviewPanel: true,
    showPersistentRegionLabels: true,
    suppressArtifactLabelsWhenPrimaryWindowOpen: false,
    showStageOverlayWindows: false,
    stageFillViewport: false,
    briefEyebrow: 'Review mode',
    selectionEyebrow: 'Selection',
    sourceWindowsEmptyState: 'Hover for preview, click to pin.',
  }
}
