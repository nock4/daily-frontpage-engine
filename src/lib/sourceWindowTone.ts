import type { SourceBindingRecord } from '../types/runtime'
import type { SourceAccentTone } from '../types/sourceWindows'

type SourceWindowAmbienceMode = 'ambient-idle' | 'ambient-video' | 'ambient-audio' | 'ambient-social' | 'ambient-reading'

const parseSourceUrl = (sourceUrl: string | null) => {
  if (!sourceUrl) return null

  try {
    const url = new URL(sourceUrl)
    return {
      hostname: url.hostname.replace(/^www\./, ''),
      pathParts: url.pathname.split('/').filter(Boolean),
    }
  } catch {
    return null
  }
}

const isYouTubeUrl = (sourceUrl: string | null) => {
  const parsed = parseSourceUrl(sourceUrl)
  if (!parsed) return false
  return parsed.hostname === 'youtube.com'
    || parsed.hostname === 'm.youtube.com'
    || parsed.hostname === 'music.youtube.com'
    || parsed.hostname === 'youtu.be'
    || parsed.hostname === 'youtube-nocookie.com'
}

const isXArticleUrl = (sourceUrl: string | null) => {
  const parsed = parseSourceUrl(sourceUrl)
  if (!parsed) return false
  return (parsed.hostname === 'x.com' || parsed.hostname === 'twitter.com') && parsed.pathParts[0] === 'i' && parsed.pathParts[1] === 'article'
}

export const getSourceWindowAccentTone = (binding: SourceBindingRecord): SourceAccentTone => {
  if (binding.source_type === 'audio' || binding.source_type === 'nts' || binding.window_type === 'audio') return 'audio'
  if (binding.source_type === 'youtube' || binding.window_type === 'video' || isYouTubeUrl(binding.source_url)) return 'video'
  if ((binding.source_type === 'tweet' || binding.window_type === 'social') && !isXArticleUrl(binding.source_url)) return 'social'
  return 'reading'
}

export const getActiveBindingAmbienceMode = (binding: SourceBindingRecord | null): SourceWindowAmbienceMode => {
  if (!binding) return 'ambient-idle'

  const accentTone = getSourceWindowAccentTone(binding)
  if (accentTone === 'video') return 'ambient-video'
  if (accentTone === 'audio') return 'ambient-audio'
  if (accentTone === 'social') return 'ambient-social'
  return 'ambient-reading'
}
