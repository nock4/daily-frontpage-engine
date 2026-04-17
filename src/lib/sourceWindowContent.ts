import type { SourceBindingRecord } from '../types/runtime'

export type SourceAccentTone = 'video' | 'audio' | 'social' | 'reading'

export type SourceWindowDescriptor =
  | {
      kind: 'youtube-embed'
      embedUrl: string
      allowsPlaybackPersistence: boolean
      domainLabel: string
      ctaLabel: string
      platformLabel: string
      accentTone: SourceAccentTone
    }
  | {
      kind: 'audio-dock'
      streamUrl: string | null
      allowsPlaybackPersistence: boolean
      domainLabel: string
      ctaLabel: string
      platformLabel: string
      accentTone: SourceAccentTone
    }
  | {
      kind: 'social-card'
      sourceUrl: string | null
      allowsPlaybackPersistence: boolean
      domainLabel: string
      ctaLabel: string
      platformLabel: string
      accentTone: SourceAccentTone
    }
  | {
      kind: 'rich-preview'
      sourceUrl: string | null
      allowsPlaybackPersistence: boolean
      domainLabel: string
      ctaLabel: string
      platformLabel: string
      accentTone: SourceAccentTone
    }

const getDomainLabel = (sourceUrl: string | null) => {
  if (!sourceUrl) return 'unbound source'

  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '')
  } catch {
    return 'linked source'
  }
}

const getPlatformLabel = (sourceUrl: string | null, fallback: string) => {
  if (!sourceUrl) return fallback

  try {
    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, '')
    if (hostname === 'soundcloud.com') return 'SoundCloud'
    if (hostname === 'bandcamp.com' || hostname.endsWith('.bandcamp.com')) return 'Bandcamp'
    if (hostname === 'youtube.com' || hostname === 'youtu.be' || hostname === 'm.youtube.com') return 'YouTube'
    if (hostname === 'x.com' || hostname === 'twitter.com') return 'X'
    if (hostname === 'instagram.com') return 'Instagram'
    return fallback
  } catch {
    return fallback
  }
}

const toYouTubeEmbedUrl = (sourceUrl: string | null) => {
  if (!sourceUrl) return null

  try {
    const url = new URL(sourceUrl)
    const hostname = url.hostname.replace(/^www\./, '')

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.replace(/^\//, '').trim()
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v')
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null
      }

      if (url.pathname.startsWith('/embed/')) {
        const videoId = url.pathname.split('/').pop()?.trim()
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null
      }
    }
  } catch {
    return null
  }

  return null
}

const isNtsUrl = (sourceUrl: string | null) => {
  if (!sourceUrl) return false

  try {
    const url = new URL(sourceUrl)
    return url.hostname.replace(/^www\./, '') === 'nts.live'
  } catch {
    return false
  }
}

export const getSourceWindowDescriptor = (binding: SourceBindingRecord): SourceWindowDescriptor => {
  const domainLabel = getDomainLabel(binding.source_url)
  const allowsPlaybackPersistence = binding.playback_persistence

  if (binding.source_type === 'youtube' || binding.window_type === 'video') {
    const embedUrl = toYouTubeEmbedUrl(binding.source_url)
    if (embedUrl) {
      return {
        kind: 'youtube-embed',
        embedUrl,
        allowsPlaybackPersistence,
        domainLabel,
        ctaLabel: 'Open on YouTube',
        platformLabel: 'YouTube',
        accentTone: 'video',
      }
    }
  }

  if (binding.window_type === 'audio' || binding.source_type === 'nts' || binding.source_type === 'audio') {
    return {
      kind: 'audio-dock',
      streamUrl: binding.source_url,
      allowsPlaybackPersistence,
      domainLabel,
      ctaLabel: isNtsUrl(binding.source_url) || binding.source_type === 'nts' ? 'Resolved track source required' : 'Open track source',
      platformLabel: isNtsUrl(binding.source_url) || binding.source_type === 'nts' ? 'NTS signal' : getPlatformLabel(binding.source_url, 'Track source'),
      accentTone: 'audio',
    }
  }

  if (binding.window_type === 'social' || binding.source_type === 'tweet') {
    return {
      kind: 'social-card',
      sourceUrl: binding.source_url,
      allowsPlaybackPersistence,
      domainLabel,
      ctaLabel: 'Open post',
      platformLabel: getPlatformLabel(binding.source_url, 'Social source'),
      accentTone: 'social',
    }
  }

  return {
    kind: 'rich-preview',
    sourceUrl: binding.source_url,
    allowsPlaybackPersistence,
    domainLabel,
    ctaLabel: 'Open source',
    platformLabel: getPlatformLabel(binding.source_url, 'Web source'),
    accentTone: 'reading',
  }
}

export const getActiveBindingAmbienceMode = (binding: SourceBindingRecord | null): string => {
  if (!binding) return 'ambient-idle'
  const descriptor = getSourceWindowDescriptor(binding)
  if (descriptor.accentTone === 'video') return 'ambient-video'
  if (descriptor.accentTone === 'audio') return 'ambient-audio'
  if (descriptor.accentTone === 'social') return 'ambient-social'
  return 'ambient-reading'
}
