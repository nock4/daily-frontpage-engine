function cleanupUrl(value) {
  return String(value || '')
    .replace(/[)>.,;:!?]+$/g, '')
    .replace(/&amp;/g, '&')
    .trim()
}

export function extractUrls(text) {
  const matches = String(text || '').match(/https?:\/\/[^\s<>"'`]+/g) || []
  return [...new Set(matches.map(cleanupUrl).filter((url) => {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }))]
}

export function youtubeId(sourceUrl) {
  try {
    const url = new URL(sourceUrl)
    if (url.hostname.includes('youtu.be')) return url.pathname.split('/').filter(Boolean)[0] || null
    if (url.hostname.includes('youtube.com')) return url.searchParams.get('v') || url.pathname.match(/\/shorts\/([^/?]+)/)?.[1] || null
  } catch {
    return null
  }
  return null
}

function youtubeThumbnailId(sourceUrl) {
  try {
    const url = new URL(sourceUrl)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    if (host !== 'i.ytimg.com' && host !== 'img.youtube.com') return null
    const parts = url.pathname.split('/').filter(Boolean)
    const viIndex = parts.indexOf('vi')
    return viIndex >= 0 ? parts[viIndex + 1] || null : null
  } catch {
    return null
  }
}

export function isYouTubeThumbnailUrl(sourceUrl) {
  return Boolean(youtubeThumbnailId(sourceUrl))
}

export function isYouTubeVideoUrl(sourceUrl) {
  return Boolean(youtubeId(sourceUrl)) && !isYouTubeThumbnailUrl(sourceUrl)
}

function isRejectedSourceUrl(value) {
  if (!value) return true
  try {
    const parsed = new URL(value)
    const host = parsed.hostname.toLowerCase()
    const pathname = parsed.pathname.toLowerCase()
    return !['http:', 'https:'].includes(parsed.protocol)
      || host === 'localhost'
      || host === '127.0.0.1'
      || host === '0.0.0.0'
      || host.endsWith('.local')
      || host === 'nts.live'
      || host.endsWith('.nts.live')
      || /\.(txt|md|markdown|json|xml|csv|tsv|ya?ml|log)(?:$|[?#])/.test(pathname)
      || pathname.includes('/llm.txt')
      || isYouTubeThumbnailUrl(value)
  } catch {
    return true
  }
}

export function isAllowedSourceUrl(value) {
  return !isRejectedSourceUrl(value)
}

export function isYouTubeSearchLocatorUrl(sourceUrl) {
  try {
    const url = new URL(sourceUrl)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    return (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com')
      && (url.pathname === '/results' || url.pathname === '/search')
  } catch {
    return false
  }
}

export function isBandcampStreamingSourceUrl(sourceUrl) {
  try {
    const url = new URL(sourceUrl)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    if (host === 'bandcamp.com' || !host.endsWith('.bandcamp.com')) return false
    const path = url.pathname.toLowerCase()
    return path.startsWith('/track/') || path.startsWith('/album/')
  } catch {
    return false
  }
}

export function isSoundCloudStreamingSourceUrl(sourceUrl) {
  try {
    const url = new URL(sourceUrl)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    if (host !== 'soundcloud.com') return false
    const [first, second] = url.pathname.split('/').filter(Boolean)
    return Boolean(first && second && first !== 'search' && first !== 'discover')
  } catch {
    return false
  }
}

export function isPreferredNtsStreamingSourceUrl(sourceUrl) {
  if (!sourceUrl || !isAllowedSourceUrl(sourceUrl)) return false
  if (isYouTubeSearchLocatorUrl(sourceUrl)) return false
  return isYouTubeVideoUrl(sourceUrl)
    || isBandcampStreamingSourceUrl(sourceUrl)
    || isSoundCloudStreamingSourceUrl(sourceUrl)
}

export function ntsStreamingSourceRank(sourceUrl) {
  if (isYouTubeVideoUrl(sourceUrl)) return 0
  if (isBandcampStreamingSourceUrl(sourceUrl)) return 1
  if (isSoundCloudStreamingSourceUrl(sourceUrl)) return 2
  return 9
}

function parseSourceUrl(value) {
  if (!value) return null
  try {
    return new URL(value)
  } catch {
    return null
  }
}

export function hostnameForUrl(value) {
  const parsed = parseSourceUrl(value)
  return parsed?.hostname.replace(/^www\./, '').toLowerCase() || ''
}

export function canonicalizeSourceUrl(value) {
  const parsed = parseSourceUrl(value)
  if (!parsed) return String(value || '').trim().toLowerCase()

  let hostname = parsed.hostname.replace(/^www\./, '').toLowerCase()
  if (hostname === 'twitter.com') hostname = 'x.com'

  let pathname = parsed.pathname.replace(/\/+$/, '') || '/'
  const statusMatch = pathname.match(/^\/([^/]+)\/status\/(\d+)/)
  if ((hostname === 'x.com' || hostname === 'mobile.x.com') && statusMatch) {
    pathname = `/${statusMatch[1]}/status/${statusMatch[2]}`
    hostname = 'x.com'
  }

  if (hostname === 'pbs.twimg.com' && pathname.startsWith('/media/')) {
    return `${hostname}${pathname}`.toLowerCase()
  }

  const thumbnailVideoId = youtubeThumbnailId(value)
  if (thumbnailVideoId) return `youtube.com/watch/${thumbnailVideoId}`.toLowerCase()

  const videoId = youtubeId(value)
  if (videoId) return `youtube.com/watch/${videoId}`.toLowerCase()

  return `${hostname}${pathname}`.toLowerCase()
}
