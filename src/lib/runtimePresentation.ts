export type ReviewMode = 'live' | 'clickable' | 'solo' | 'debug'

export interface RuntimePresentation {
  showArtifactLists: boolean
  showReviewPanel: boolean
  showPersistentRegionLabels: boolean
  briefEyebrow: string
  selectionEyebrow: string
  sourceWindowsEmptyState: string
}

export const getRuntimePresentation = (reviewMode: ReviewMode): RuntimePresentation => {
  if (reviewMode === 'live') {
    return {
      showArtifactLists: false,
      showReviewPanel: false,
      showPersistentRegionLabels: false,
      briefEyebrow: 'Edition',
      selectionEyebrow: 'Active pocket',
      sourceWindowsEmptyState: 'Open a pocket to pin a source window.',
    }
  }

  return {
    showArtifactLists: true,
    showReviewPanel: true,
    showPersistentRegionLabels: true,
    briefEyebrow: 'Review mode',
    selectionEyebrow: 'Selection',
    sourceWindowsEmptyState: 'Hover for preview, click to pin.',
  }
}
