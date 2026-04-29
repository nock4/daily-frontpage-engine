import type { SourceBindingRecord } from '../types/runtime'
import type { SourceWindowDescriptor } from '../types/sourceWindows'

type RichPreviewSourceVariant = 'editorial-note' | 'repo-slip' | 'field-note'
type RichPreviewImageTreatment = 'editorial-clipping' | 'technical-slip' | 'branded-shard' | 'document-fragment' | 'social-shard'
type RichPreviewCopyProfile = 'editorial' | 'terse' | 'caption'
type RichPreviewMotionProfile = 'soft' | 'snappy' | 'archival'
type RichPreviewSpatialProfile = 'airy' | 'tight' | 'anchored'
type RichPreviewProjectionProfile = 'cast' | 'mechanical' | 'hinged'
type RichPreviewFontProfile = 'editorial-serif' | 'technical-mono' | 'document-serif' | 'signal-sans' | 'gallery-serif' | 'display-condensed'
type RichPreviewTitleTreatment = 'typeset' | 'etched' | 'stamped' | 'broadcast' | 'inscribed'
type RichPreviewRevealProfile = 'editorial-scan' | 'repo-scan' | 'signal-feed' | 'document-burn'

const INTERNAL_PLACEHOLDER_COPY = [
  'treated as a real visible scene artifact',
  'invented dashboard hotspot',
  'keep this window source-native',
  'flattened content summary',
]

function trimSourceExcerpt(text: string, maxChars = 190) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxChars) return normalized

  const sentenceCut = normalized.slice(0, maxChars).match(/^(.+?[.!?])(?:\s|$)/)
  if (sentenceCut?.[1] && sentenceCut[1].length >= Math.min(90, maxChars - 12)) return sentenceCut[1].trim()

  const clauseIndex = Math.max(
    normalized.lastIndexOf(';', maxChars),
    normalized.lastIndexOf(':', maxChars),
    normalized.lastIndexOf(',', maxChars),
    normalized.lastIndexOf(' - ', maxChars),
  )
  if (clauseIndex >= Math.min(54, maxChars - 10)) return `${normalized.slice(0, clauseIndex).trim()}…`

  const wordIndex = normalized.lastIndexOf(' ', maxChars)
  if (wordIndex >= Math.min(54, maxChars - 10)) return `${normalized.slice(0, wordIndex).trim()}…`

  return `${normalized.slice(0, maxChars).trim()}…`
}

function getSourceVariant(binding: SourceBindingRecord): RichPreviewSourceVariant {
  const domain = getSourceDomain(binding).toLowerCase()
  if (domain.includes('substack.com')) return 'editorial-note'
  if (domain === 'github.com') return 'repo-slip'
  return 'field-note'
}

function getHostnameFromUrl(sourceUrl: string | null | undefined) {
  const hostname = getParsedSourceUrl(sourceUrl)?.hostname ?? null
  return hostname ? hostname.replace(/^www\./, '') : null
}

function getParsedSourceUrl(sourceUrl: string | null | undefined) {
  if (!sourceUrl) return null

  try {
    return new URL(sourceUrl)
  } catch {
    return null
  }
}

function getSourceDomain(binding: SourceBindingRecord) {
  return binding.source_domain?.trim() || getHostnameFromUrl(binding.source_url) || ''
}

function parseSourceTitle(sourceTitle: string | undefined) {
  const normalized = sourceTitle?.replace(/\s+/g, ' ').trim()
  if (!normalized) return null

  const separator = [' | ', ' — ', ' – '].find((candidate) => normalized.includes(candidate))
  if (!separator) return { sourceName: null, artifactTitle: normalized }

  const [left, right] = normalized.split(separator).map((part) => part.trim())
  if (!left || !right) return { sourceName: null, artifactTitle: normalized }

  return {
    sourceName: left,
    artifactTitle: right,
  }
}

function formatSourceMeta(sourceMeta: string | undefined) {
  const normalized = sourceMeta?.trim()
  if (!normalized) return null

  const parsedDate = new Date(normalized)
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return normalized
}

function isRootSourceUrl(sourceUrl: string | null | undefined) {
  const parsedUrl = getParsedSourceUrl(sourceUrl)
  if (!parsedUrl) return false
  return parsedUrl.pathname === '/' || parsedUrl.pathname === ''
}

function isXArticleUrl(sourceUrl: string | null | undefined) {
  const parsedUrl = getParsedSourceUrl(sourceUrl)
  if (!parsedUrl) return false
  const hostname = parsedUrl.hostname.replace(/^www\./, '')
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean)
  return (hostname === 'x.com' || hostname === 'twitter.com') && pathParts[0] === 'i' && pathParts[1] === 'article'
}

function normalizeAnchoredArtifactExcerpt(excerpt: string) {
  const normalized = excerpt.replace(/\s+/g, ' ').trim()
  const match = normalized.match(/^Anchored to the (.+?) scene's (.+)\.$/i)
  if (!match) return normalized

  const sceneLabel = match[1].trim().replace(/\s+/g, '-').toLowerCase()
  const artifactLabel = match[2].trim()
  return `Anchored to the native ${sceneLabel} artifact: ${artifactLabel}.`
}

function isInternalPlaceholderCopy(excerpt: string | undefined) {
  const normalized = excerpt?.trim().toLowerCase()
  if (!normalized) return false
  return INTERNAL_PLACEHOLDER_COPY.some((phrase) => normalized.includes(phrase))
}

function getRichPreviewBodyCopy(binding: SourceBindingRecord, descriptor: SourceWindowDescriptor) {
  const sourceDomain = (getSourceDomain(binding) || descriptor.domainLabel).toLowerCase()
  const sourceVariant = getSourceVariant(binding)
  const extractedSummary = binding.source_summary?.trim()
  if (extractedSummary) {
    const cleanedSummary = trimSourceExcerpt(extractedSummary)
    const looksGithubGarbage = sourceDomain === 'github.com' && /reload to refresh your session|you signed in with another tab/i.test(cleanedSummary)
    if (!looksGithubGarbage) return cleanedSummary
  }

  if (sourceDomain === 'github.com') {
    return 'Repository source, stripped to the project signal instead of GitHub chrome.'
  }

  const excerpt = binding.excerpt?.trim()
  if (excerpt && !isInternalPlaceholderCopy(excerpt)) return trimSourceExcerpt(normalizeAnchoredArtifactExcerpt(excerpt))

  if (sourceVariant === 'field-note') {
    const parsedTitle = parseSourceTitle(binding.source_title)
    const titleLabel = parsedTitle?.artifactTitle || binding.source_title?.trim() || descriptor.domainLabel
    const sourceName = parsedTitle?.sourceName

    if (binding.source_url) {
      if (isRootSourceUrl(binding.source_url)) {
        return sourceName && sourceName !== titleLabel
          ? `Primary site entry from ${sourceName}, framed around ${titleLabel}.`
          : `Primary site entry framed around ${titleLabel}.`
      }

      return sourceName && sourceName !== titleLabel
        ? `Source article from ${sourceName}, centered on ${titleLabel}.`
        : `Source article centered on ${titleLabel}.`
    }
  }

  return binding.source_url ? `Open source material on ${descriptor.domainLabel}.` : `Source material from ${descriptor.domainLabel}.`
}

function getRichPreviewActionLabel(
  binding: SourceBindingRecord,
  sourceVariant: RichPreviewSourceVariant,
) {
  if (sourceVariant === 'repo-slip') return 'View repository'
  if (sourceVariant === 'editorial-note') return 'Read essay'
  if (isXArticleUrl(binding.source_url)) return 'Read X article'
  if (isRootSourceUrl(binding.source_url)) return 'Visit source site'
  if ((binding.source_url || '').match(/\.pdf($|[?#])/i)) return 'Open document'
  if (binding.source_type === 'article') return 'Read source article'
  return 'Open source'
}

function getRichPreviewImageTreatment(binding: SourceBindingRecord, sourceVariant: RichPreviewSourceVariant): RichPreviewImageTreatment {
  const sourceUrl = binding.source_url || ''
  if (/\.pdf($|[?#])/i.test(sourceUrl)) return 'document-fragment'
  if (sourceVariant === 'repo-slip') return 'technical-slip'
  if (sourceVariant === 'editorial-note' || isXArticleUrl(sourceUrl)) return 'editorial-clipping'
  if (isRootSourceUrl(sourceUrl)) return 'branded-shard'
  if (binding.source_type === 'tweet' || binding.window_type === 'social') return 'social-shard'
  return 'editorial-clipping'
}

function getCopyProfile(imageTreatment: RichPreviewImageTreatment): RichPreviewCopyProfile {
  if (imageTreatment === 'technical-slip' || imageTreatment === 'branded-shard') return 'terse'
  if (imageTreatment === 'document-fragment') return 'caption'
  return 'editorial'
}

function getPreviewCharLimit(copyProfile: RichPreviewCopyProfile, imageTreatment: RichPreviewImageTreatment) {
  if (copyProfile === 'terse') return imageTreatment === 'branded-shard' ? 72 : 84
  if (copyProfile === 'caption') return 96
  if (copyProfile === 'editorial') return 116
  return 148
}

function getPreviewCopy(bodyCopy: string, copyProfile: RichPreviewCopyProfile, imageTreatment: RichPreviewImageTreatment) {
  const previewCharLimit = getPreviewCharLimit(copyProfile, imageTreatment)
  if (copyProfile === 'caption') {
    return trimSourceExcerpt(bodyCopy.replace(/^Open\s+/i, ''), previewCharLimit)
  }
  return trimSourceExcerpt(bodyCopy, previewCharLimit)
}

function getMotionProfile(imageTreatment: RichPreviewImageTreatment): RichPreviewMotionProfile {
  if (imageTreatment === 'technical-slip' || imageTreatment === 'branded-shard' || imageTreatment === 'social-shard') return 'snappy'
  if (imageTreatment === 'document-fragment') return 'archival'
  return 'soft'
}

function getSpatialProfile(imageTreatment: RichPreviewImageTreatment): RichPreviewSpatialProfile {
  if (imageTreatment === 'technical-slip' || imageTreatment === 'branded-shard' || imageTreatment === 'social-shard') return 'tight'
  if (imageTreatment === 'document-fragment') return 'anchored'
  return 'airy'
}

function getProjectionProfile(imageTreatment: RichPreviewImageTreatment): RichPreviewProjectionProfile {
  if (imageTreatment === 'technical-slip' || imageTreatment === 'branded-shard' || imageTreatment === 'social-shard') return 'mechanical'
  if (imageTreatment === 'document-fragment') return 'hinged'
  return 'cast'
}

function getFontProfile(
  binding: SourceBindingRecord,
  sourceVariant: RichPreviewSourceVariant,
  imageTreatment: RichPreviewImageTreatment,
): RichPreviewFontProfile {
  const domain = getSourceDomain(binding).toLowerCase()
  const normalizedTitle = binding.source_title?.replace(/\s+/g, ' ').trim() || ''
  const portfolioKeywords = /(studio|portfolio|archive|gallery|fashion|camera|photograph|photographer|director|atelier|world|spring|summer)/i
  const looksPortfolioSignatureTitle = Boolean(
    isRootSourceUrl(binding.source_url)
    && normalizedTitle
    && !/[|—–:]/.test(normalizedTitle)
    && normalizedTitle.split(/\s+/).length <= 3
    && !/\b(home|homepage|docs|blog|product|app|pricing)\b/i.test(normalizedTitle),
  )
  const isMotionHeavySource = (
    binding.window_type === 'video'
    || binding.window_type === 'audio'
    || binding.source_type === 'video'
    || binding.source_type === 'youtube'
    || binding.source_type === 'audio'
  ) && !isXArticleUrl(binding.source_url)

  if (sourceVariant === 'repo-slip') return 'technical-mono'
  if (imageTreatment === 'document-fragment') return 'document-serif'
  if (isMotionHeavySource) return 'display-condensed'
  if ((imageTreatment === 'branded-shard' && portfolioKeywords.test(`${domain} ${normalizedTitle}`)) || looksPortfolioSignatureTitle) {
    return 'gallery-serif'
  }
  if (imageTreatment === 'branded-shard' || imageTreatment === 'social-shard') return 'signal-sans'
  return 'editorial-serif'
}

function getTitleTreatment(
  binding: SourceBindingRecord,
  sourceVariant: RichPreviewSourceVariant,
  imageTreatment: RichPreviewImageTreatment,
  fontProfile: RichPreviewFontProfile,
): RichPreviewTitleTreatment {
  if (sourceVariant === 'repo-slip' || imageTreatment === 'technical-slip') return 'etched'
  if (imageTreatment === 'document-fragment') return 'stamped'
  if (fontProfile === 'gallery-serif') return 'inscribed'
  if (fontProfile === 'display-condensed' || fontProfile === 'signal-sans' || imageTreatment === 'social-shard' || binding.window_type === 'social') return 'broadcast'
  return 'typeset'
}

function getRevealProfile(
  imageTreatment: RichPreviewImageTreatment,
  titleTreatment: RichPreviewTitleTreatment,
): RichPreviewRevealProfile {
  if (imageTreatment === 'technical-slip' || titleTreatment === 'etched') return 'repo-scan'
  if (imageTreatment === 'document-fragment' || titleTreatment === 'stamped') return 'document-burn'
  if (imageTreatment === 'branded-shard' || imageTreatment === 'social-shard' || titleTreatment === 'broadcast') return 'signal-feed'
  return 'editorial-scan'
}

export function getRichPreviewModel(binding: SourceBindingRecord, descriptor: SourceWindowDescriptor) {
  const sourceVariant = getSourceVariant(binding)
  const sourceDomainLabel = getSourceDomain(binding) || descriptor.domainLabel
  const parsedTitle = parseSourceTitle(binding.source_title)
  const formattedMeta = formatSourceMeta(binding.source_meta)
  const richPreviewTitle = sourceVariant === 'field-note'
    ? parsedTitle?.artifactTitle || binding.source_title?.trim() || sourceDomainLabel
    : binding.source_title?.trim() || sourceDomainLabel
  const sourceName = sourceVariant === 'field-note' && parsedTitle?.sourceName && parsedTitle.sourceName !== richPreviewTitle
    ? parsedTitle.sourceName
    : null
  const imageTreatment = getRichPreviewImageTreatment(binding, sourceVariant)
  const bodyCopy = getRichPreviewBodyCopy(binding, descriptor)
  const copyProfile = getCopyProfile(imageTreatment)
  const motionProfile = getMotionProfile(imageTreatment)
  const spatialProfile = getSpatialProfile(imageTreatment)
  const projectionProfile = getProjectionProfile(imageTreatment)
  const fontProfile = getFontProfile(binding, sourceVariant, imageTreatment)
  const titleTreatment = getTitleTreatment(binding, sourceVariant, imageTreatment, fontProfile)
  const revealProfile = getRevealProfile(imageTreatment, titleTreatment)
  const previewCharLimit = getPreviewCharLimit(copyProfile, imageTreatment)

  return {
    sourceVariant,
    sourceDomainLabel,
    richPreviewTitle,
    sourceName,
    sourceMeta: sourceVariant === 'field-note'
      ? [isRootSourceUrl(binding.source_url) ? 'Primary site' : 'Source article', formattedMeta].filter(Boolean).join(' · ')
      : formattedMeta,
    bodyCopy,
    previewCopy: getPreviewCopy(bodyCopy, copyProfile, imageTreatment),
    previewCharLimit,
    copyProfile,
    fontProfile,
    titleTreatment,
    revealProfile,
    motionProfile,
    spatialProfile,
    projectionProfile,
    actionLabel: getRichPreviewActionLabel(binding, sourceVariant),
    platformPillLabel: sourceVariant === 'repo-slip'
      ? 'Repository'
      : sourceVariant === 'editorial-note'
        ? 'Substack'
        : isRootSourceUrl(binding.source_url)
          ? 'Source site'
          : /\.pdf($|[?#])/i.test(binding.source_url || '')
            ? 'Document'
            : 'Article',
    imageTreatment,
  }
}
