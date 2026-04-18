import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadEditionPackage, loadManifest, polygonToClipPath } from './lib/editionLoader'
import { buildArchiveHref, getEditionArchiveRecords, parseAppRoute, type AppRoute } from './lib/router'
import { getSourceWindowDescriptor } from './lib/sourceWindowContent'
import { getRuntimeAmbienceClasses } from './lib/runtimeAmbience'
import { getRuntimePresentation } from './lib/runtimePresentation'
import { getStageWindowPlacement } from './lib/stageWindowPlacement'
import { getSourceWindowSurfaceProfile } from './lib/sourceWindowSurface'
import { clearPreview, closeWindow, createWindowState, focusWindow, hoverBinding, pinBinding, restoreWindow } from './lib/sourceWindowManager'
import type { ArchiveRecord, ArtifactRecord, EditionManifest, LoadedEdition, SourceBindingRecord, SourceWindowState } from './types/runtime'

function App() {
  const [manifest, setManifest] = useState<EditionManifest | null>(null)
  const [route, setRoute] = useState<AppRoute | null>(null)
  const [loaded, setLoaded] = useState<LoadedEdition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null)
  const [windowState, setWindowState] = useState<SourceWindowState>(createWindowState())
  const [locationKey, setLocationKey] = useState(() => `${window.location.pathname}${window.location.search}`)

  const syncLocation = useCallback(() => {
    setLocationKey(`${window.location.pathname}${window.location.search}`)
  }, [])

  const navigate = useCallback((href: string) => {
    window.history.pushState({}, '', href)
    syncLocation()
  }, [syncLocation])

  useEffect(() => {
    window.addEventListener('popstate', syncLocation)
    return () => window.removeEventListener('popstate', syncLocation)
  }, [syncLocation])

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const nextManifest = manifest ?? (await loadManifest())
        const nextRoute = parseAppRoute(window.location.pathname, window.location.search, nextManifest)
        setManifest(nextManifest)
        setRoute(nextRoute)

        if (nextRoute.kind === 'archive-index') {
          setLoaded(null)
          setActiveArtifactId(null)
          setWindowState(createWindowState())
          return
        }

        const pkg = await loadEditionPackage(nextRoute.edition.path)
        setLoaded(pkg)
        setActiveArtifactId(pkg.artifactMap.default_artifact_id)
        setWindowState(createWindowState())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load edition')
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [locationKey, manifest])

  const bindingsByArtifactId = useMemo(() => {
    if (!loaded) return new Map<string, SourceBindingRecord>()
    return new Map(loaded.sourceBindings.bindings.map((binding) => [binding.artifact_id, binding]))
  }, [loaded])

  const artifactsById = useMemo(() => {
    if (!loaded) return new Map<string, ArtifactRecord>()
    return new Map(loaded.artifactMap.artifacts.map((artifact) => [artifact.id, artifact]))
  }, [loaded])

  const bindingsById = useMemo(() => {
    if (!loaded) return new Map<string, SourceBindingRecord>()
    return new Map(loaded.sourceBindings.bindings.map((binding) => [binding.id, binding]))
  }, [loaded])

  const activeBinding = activeArtifactId ? bindingsByArtifactId.get(activeArtifactId) ?? null : null
  const previewBinding = windowState.previewBindingId ? bindingsById.get(windowState.previewBindingId) ?? null : null
  const primaryBinding = windowState.primaryBindingId ? bindingsById.get(windowState.primaryBindingId) ?? null : null
  const dockBindings = windowState.minimizedBindingIds
    .map((bindingId) => bindingsById.get(bindingId) ?? null)
    .filter((binding): binding is SourceBindingRecord => Boolean(binding))
  const runtimeAmbienceClasses = getRuntimeAmbienceClasses(loaded?.ambiance ?? null, primaryBinding ?? previewBinding ?? activeBinding).join(' ')

  const archiveRecords = useMemo<ArchiveRecord[]>(() => (manifest ? getEditionArchiveRecords(manifest) : []), [manifest])
  const reviewMode = new URLSearchParams(window.location.search).get('debug') === 'masks'
    ? 'debug'
    : new URLSearchParams(window.location.search).get('qa') === 'clickable'
      ? 'clickable'
      : new URLSearchParams(window.location.search).get('qa') === 'solo'
        ? 'solo'
        : 'live'
  const presentation = getRuntimePresentation(reviewMode)
  const hasPrimaryStageWindow = reviewMode === 'live' && !!primaryBinding
  const lockedArtifactId = hasPrimaryStageWindow ? primaryBinding?.artifact_id ?? null : null
  const stageVisualBindings = reviewMode === 'live'
    ? windowState.openBindingIds
      .filter((bindingId) => !windowState.minimizedBindingIds.includes(bindingId))
      .map((bindingId) => bindingsById.get(bindingId) ?? null)
      .filter((binding): binding is SourceBindingRecord => Boolean(binding))
      .filter((binding) => binding.window_type !== 'audio')
    : []

  if (loading) return <main className="boot-state">Loading daily edition…</main>
  if (error) return <main className="boot-state">{error}</main>
  if (!manifest || !route) return <main className="boot-state">Missing manifest</main>

  if (route.kind === 'archive-index') {
    return <ArchiveIndexPage currentEditionId={manifest.current_edition_id} navigate={navigate} records={archiveRecords} />
  }

  if (!loaded) return <main className="boot-state">Edition not found.</main>

  const heroes = loaded.artifactMap.artifacts.filter((artifact) => artifact.kind === 'hero')
  const modules = loaded.artifactMap.artifacts.filter((artifact) => artifact.kind === 'module')

  return (
    <main className={`runtime-shell review-mode--${reviewMode} ${runtimeAmbienceClasses}${presentation.showSidebar ? '' : ' runtime-shell--immersive'}${presentation.stageFillViewport ? ' runtime-shell--stage-fill' : ''}`}>
      <section className="runtime-main">
        {presentation.showTopbar ? (
          <header className="runtime-topbar">
            <div>
              <div className="eyebrow">Daily frontpage engine</div>
              <h1>{loaded.edition.title}</h1>
              <p>{loaded.brief.mood}</p>
            </div>
            <div className="topbar-actions">
              <button onClick={() => navigate('/')} type="button">Current</button>
              <button onClick={() => navigate('/archive')} type="button">Archive</button>
              {route.kind === 'archive-edition' ? <button onClick={() => navigate(buildArchiveHref(route.edition.slug))} type="button">Edition entry</button> : null}
            </div>
            <div className="topbar-meta">
              <span>{loaded.edition.date}</span>
              <span>{loaded.edition.scene_family}</span>
            </div>
          </header>
        ) : null}

        <section
          className={`stage${hasPrimaryStageWindow && presentation.suppressArtifactLabelsWhenPrimaryWindowOpen ? ' stage--primary-window-open' : ''}`}
          onMouseLeave={() => setWindowState((state) => clearPreview(state))}
        >
          <img className="plate" src={loaded.edition.plate_asset_path} alt={loaded.edition.title} />

          {loaded.artifactMap.artifacts.map((artifact) => {
            const active = artifact.id === activeArtifactId
            const clipPath = polygonToClipPath(artifact)
            const binding = bindingsByArtifactId.get(artifact.id) ?? null

            return (
              <button
                key={artifact.id}
                aria-label={artifact.label}
                className={`artifact artifact--${artifact.kind}${active ? ' is-active' : ''}${presentation.showPersistentRegionLabels ? ' artifact--labels-on' : ''}`}
                style={{
                  left: `${artifact.bounds.x * 100}%`,
                  top: `${artifact.bounds.y * 100}%`,
                  width: `${artifact.bounds.w * 100}%`,
                  height: `${artifact.bounds.h * 100}%`,
                  clipPath,
                  WebkitClipPath: clipPath,
                  zIndex: artifact.z_index,
                }}
                onMouseEnter={() => {
                  if (!lockedArtifactId || lockedArtifactId === artifact.id) {
                    setActiveArtifactId(artifact.id)
                  }
                  if (binding) setWindowState((state) => hoverBinding(state, binding, { freezeWhenPrimaryWindowOpen: reviewMode === 'live' }))
                }}
                onFocus={() => {
                  if (!lockedArtifactId || lockedArtifactId === artifact.id) {
                    setActiveArtifactId(artifact.id)
                  }
                  if (binding) setWindowState((state) => hoverBinding(state, binding, { freezeWhenPrimaryWindowOpen: reviewMode === 'live' }))
                }}
                onClick={() => {
                  setActiveArtifactId(artifact.id)
                  if (binding) setWindowState((state) => pinBinding(state, binding))
                }}
                type="button"
              >
                <span>{artifact.label}</span>
              </button>
            )
          })}

          {presentation.showStageOverlayWindows ? (
            <div className={`stage-overlay-windows${reviewMode === 'live' ? ' stage-overlay-windows--live' : ''}`}>
              {reviewMode === 'live'
                ? stageVisualBindings.map((binding, index) => {
                    const isFrontmost = binding.id === primaryBinding?.id
                    return (
                      <SourceWindow
                        key={binding.id}
                        artifact={artifactsById.get(binding.artifact_id) ?? null}
                        binding={binding}
                        mode={isFrontmost ? 'primary' : 'secondary'}
                        onActivate={() => setWindowState((state) => focusWindow(state, binding.id))}
                        onClose={() => setWindowState((state) => closeWindow(state, binding.id))}
                        stackIndex={index}
                        surface="stage"
                      />
                    )
                  })
                : primaryBinding ? (
                    <SourceWindow
                      artifact={artifactsById.get(primaryBinding.artifact_id) ?? null}
                      binding={primaryBinding}
                      mode="primary"
                      onClose={() => setWindowState((state) => closeWindow(state, primaryBinding.id))}
                      surface="panel"
                    />
                  ) : null}
              {previewBinding && (!primaryBinding || previewBinding.id !== primaryBinding.id) ? (
                <SourceWindow
                  artifact={artifactsById.get(previewBinding.artifact_id) ?? null}
                  binding={previewBinding}
                  mode="preview"
                  onClose={() => setWindowState((state) => clearPreview(state))}
                  surface={reviewMode === 'live' ? 'stage' : 'panel'}
                />
              ) : null}
              {dockBindings.length ? (
                <div className={`window-dock${reviewMode === 'live' ? ' window-dock--stage' : ''}`}>
                  <div className="eyebrow">Dock</div>
                  <div className="window-dock__items">
                    {dockBindings.map((binding) => (
                      <button key={binding.id} onClick={() => setWindowState((state) => restoreWindow(state, binding.id))} type="button">
                        Restore {binding.kicker}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {presentation.showArtifactLists ? (
          <section className="artifact-lists">
            <div>
              <h2>Heroes</h2>
              <ul>
                {heroes.map((artifact) => (
                  <li key={artifact.id}>{artifact.label}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2>Modules</h2>
              <ul>
                {modules.map((artifact) => (
                  <li key={artifact.id}>{artifact.label}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </section>

      {presentation.showSidebar ? (
        <aside className="side-rail">
          <section className="panel">
            <div className="eyebrow">{presentation.briefEyebrow}</div>
            <h2>{loaded.edition.title}</h2>
            <p>{loaded.brief.mood}</p>
            <p>Lighting: {loaded.brief.lighting}</p>
            <p>Motion: {loaded.ambiance.motion_system}</p>
            {route.kind === 'archive-edition' ? <p>{loaded.edition.date} · {loaded.edition.scene_family}</p> : null}
          </section>

          <section className="panel">
            <div className="eyebrow">Source windows</div>
            {primaryBinding ? (
              <SourceWindow binding={primaryBinding} mode="primary" onClose={() => setWindowState((state) => closeWindow(state, primaryBinding.id))} surface="panel" />
            ) : (
              <p>{presentation.sourceWindowsEmptyState}</p>
            )}

            {previewBinding && (!primaryBinding || previewBinding.id !== primaryBinding.id) ? (
              <SourceWindow binding={previewBinding} mode="preview" onClose={() => setWindowState((state) => clearPreview(state))} surface="panel" />
            ) : null}

            {dockBindings.length ? (
              <div className="window-dock">
                <div className="eyebrow">Dock</div>
                <div className="window-dock__items">
                  {dockBindings.map((binding) => (
                    <button key={binding.id} onClick={() => setWindowState((state) => restoreWindow(state, binding.id))} type="button">
                      Restore {binding.kicker}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="panel">
            <div className="eyebrow">{presentation.selectionEyebrow}</div>
            {activeBinding ? (
              <>
                <p>{activeBinding.title}</p>
                <p>{activeBinding.excerpt}</p>
              </>
            ) : (
              <p>No binding selected.</p>
            )}
          </section>

          <section className="panel">
            <div className="eyebrow">Archive</div>
            <ArchiveMiniList currentEditionId={loaded.edition.edition_id} navigate={navigate} records={archiveRecords} />
          </section>

          {presentation.showReviewPanel ? (
            <section className="panel">
              <div className="eyebrow">Review</div>
              <p>Geometry: {loaded.review.geometry_status}</p>
              <p>Clickability: {loaded.review.clickability_status}</p>
              <p>Behavior: {loaded.review.behavior_status}</p>
            </section>
          ) : null}
        </aside>
      ) : null}
    </main>
  )
}

function ArchiveIndexPage({ records, navigate, currentEditionId }: { records: ArchiveRecord[]; navigate: (href: string) => void; currentEditionId: string }) {
  return (
    <main className="archive-shell">
      <header className="runtime-topbar">
        <div>
          <div className="eyebrow">Archive</div>
          <h1>Daily edition archive</h1>
          <p>Browse previous front-page worlds by date and family.</p>
        </div>
        <div className="topbar-actions">
          <button onClick={() => navigate('/')} type="button">Back to current</button>
        </div>
      </header>

      <section className="archive-grid">
        {records.map((record) => (
          <button className="archive-card" key={record.edition_id} onClick={() => navigate(record.archive_href)} type="button">
            <img alt={record.title} src={record.preview_asset_path} />
            <div className="archive-card__body">
              <div className="archive-card__meta">
                <span>{record.date}</span>
                <span>{record.scene_family}</span>
              </div>
              <strong>{record.title}</strong>
              <p>{record.motif_tags.join(' · ')}</p>
              {record.edition_id === currentEditionId ? <span className="badge">current</span> : null}
            </div>
          </button>
        ))}
      </section>
    </main>
  )
}

function ArchiveMiniList({ records, navigate, currentEditionId }: { records: ArchiveRecord[]; navigate: (href: string) => void; currentEditionId: string }) {
  return (
    <ul className="archive-mini-list">
      {records.map((record) => (
        <li key={record.edition_id}>
          <button onClick={() => navigate(record.is_live ? '/' : record.archive_href)} type="button">
            <span>{record.title}</span>
            <span>{record.date}</span>
            {record.edition_id === currentEditionId ? <span className="badge">here</span> : null}
          </button>
        </li>
      ))}
    </ul>
  )
}

function SourceWindow({
  binding,
  mode,
  onClose,
  onActivate,
  artifact = null,
  stackIndex = 0,
  surface = 'panel',
}: {
  binding: SourceBindingRecord
  mode: 'preview' | 'primary' | 'secondary'
  onClose: () => void
  onActivate?: () => void
  artifact?: ArtifactRecord | null
  stackIndex?: number
  surface?: 'panel' | 'stage'
}) {
  const descriptor = getSourceWindowDescriptor(binding)
  const profile = getSourceWindowSurfaceProfile(descriptor, surface, mode)
  const placement = surface === 'stage' && artifact ? getStageWindowPlacement(artifact, mode) : null

  return (
    <div
      className={`source-window source-window--${mode} source-window--frame-${profile.frameStyle} source-window--body-${profile.bodyStyle}${placement ? ` source-window--stage source-window--tone-${placement.tone}` : surface === 'stage' ? ' source-window--stage-fallback' : ''}`}
      onMouseDown={onActivate}
      onFocus={onActivate}
      style={placement ? {
        left: `${placement.x * 100}%`,
        top: `${placement.y * 100}%`,
        width: `${placement.width * 100}%`,
        maxHeight: `${placement.maxHeight * 100}%`,
        zIndex: 9 + stackIndex,
      } : undefined}
      tabIndex={0}
    >
      {profile.showHeader ? (
        <div className="source-window__top">
          <div>
            <div className="eyebrow">{mode === 'preview' ? `Preview · ${binding.kicker}` : binding.kicker}</div>
            <strong>{binding.title}</strong>
          </div>
          <div className="source-window__actions">
            <button className={`source-window__close source-window__close--${profile.closeStyle}`} onClick={onClose} type="button">{mode === 'preview' ? 'Dismiss' : 'Close'}</button>
          </div>
        </div>
      ) : (
        <div className="source-window__floating-actions">
          <button aria-label={mode === 'preview' ? 'Dismiss preview' : 'Close source window'} className={`source-window__close source-window__close--${profile.closeStyle}`} onClick={onClose} type="button">×</button>
        </div>
      )}
      {profile.showExcerpt ? <p>{binding.excerpt}</p> : null}
      {profile.showMeta ? (
        <div className="source-window__meta">
          <span>{binding.window_type}</span>
          <span>{binding.source_type}</span>
          <span>{descriptor.platformLabel}</span>
          <span>{descriptor.allowsPlaybackPersistence ? 'persistent' : 'replaceable'}</span>
        </div>
      ) : null}
      <SourceWindowBody binding={binding} descriptor={descriptor} profile={profile} />
    </div>
  )
}

function SourceWindowBody({
  binding,
  descriptor,
  profile,
}: {
  binding: SourceBindingRecord
  descriptor: ReturnType<typeof getSourceWindowDescriptor>
  profile: ReturnType<typeof getSourceWindowSurfaceProfile>
}) {
  if (descriptor.kind === 'youtube-embed') {
    return (
      <div className="source-window__body source-window__body--video">
        {profile.showBodyPlatformPill ? <span className="source-window__platform-pill">{descriptor.platformLabel}</span> : null}
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          src={descriptor.embedUrl}
          title={binding.title}
        />
        {binding.source_url ? <a href={binding.source_url} rel="noreferrer" target="_blank">{descriptor.ctaLabel} ↗</a> : null}
      </div>
    )
  }

  if (descriptor.kind === 'soundcloud-embed') {
    return (
      <div className="source-window__body source-window__body--audio-embed">
        {profile.showBodyPlatformPill ? <span className="source-window__platform-pill">{descriptor.platformLabel}</span> : null}
        <iframe
          allow="autoplay"
          loading="lazy"
          src={descriptor.embedUrl}
          title={binding.title}
        />
        <a href={descriptor.sourceUrl} rel="noreferrer" target="_blank">{descriptor.ctaLabel} ↗</a>
      </div>
    )
  }

  if (descriptor.kind === 'bandcamp-card') {
    return (
      <div className="source-window__body source-window__body--audio">
        <div className="audio-dock-card audio-dock-card--bandcamp">
          {profile.showBodyEyebrow ? <div className="eyebrow">{descriptor.platformLabel}</div> : null}
          {profile.showBodyPlatformPill ? <span className="source-window__platform-pill">{descriptor.platformLabel}</span> : null}
          <strong>{descriptor.artistLabel}</strong>
          <span className="source-pill">{descriptor.releasePath}</span>
          <p>Provider-aware fallback for resolved Bandcamp sources when there is no stable embed path available from the stored URL alone.</p>
        </div>
        <a href={descriptor.sourceUrl} rel="noreferrer" target="_blank">{descriptor.ctaLabel} ↗</a>
      </div>
    )
  }

  if (descriptor.kind === 'audio-dock') {
    return (
      <div className="source-window__body source-window__body--audio">
        <div className={`audio-dock-card${descriptor.ctaLabel === 'Resolved track source required' ? ' audio-dock-card--warning' : ''}`}>
          {profile.showBodyEyebrow ? <div className="eyebrow">{descriptor.platformLabel}</div> : null}
          {profile.showBodyPlatformPill ? <span className="source-window__platform-pill">{descriptor.platformLabel}</span> : null}
          <strong>Persistent track pocket</strong>
          <p>
            {descriptor.ctaLabel === 'Resolved track source required'
              ? 'This signal still points at NTS discovery context. Swap in the resolved track source before treating it like a playable front-page pocket.'
              : 'This pocket is ready to hand off to the resolved track source while keeping the dock-style listening posture.'}
          </p>
        </div>
        {descriptor.streamUrl ? <a href={descriptor.streamUrl} rel="noreferrer" target="_blank">{descriptor.ctaLabel} ↗</a> : <span className="fallback">No live audio source URL bound yet</span>}
      </div>
    )
  }

  if (descriptor.kind === 'social-card') {
    return (
      <div className="source-window__body source-window__body--social">
        <div className="social-card social-card--post">
          {profile.showBodyEyebrow ? <div className="eyebrow">{descriptor.platformLabel}</div> : null}
          {profile.showBodyPlatformPill ? <span className="source-window__platform-pill">{descriptor.platformLabel}</span> : null}
          <strong>{descriptor.sourceLabel ?? descriptor.domainLabel}</strong>
          {descriptor.byline ? <span className="source-pill">{descriptor.byline}</span> : null}
          {descriptor.postLabel ? <span className="source-pill">{descriptor.postLabel}</span> : null}
          <p>Keep this window source-native. Show the post as a post-shaped object with provenance, not as a flattened content summary.</p>
        </div>
        {descriptor.sourceUrl ? <a href={descriptor.sourceUrl} rel="noreferrer" target="_blank">{descriptor.ctaLabel} ↗</a> : <span className="fallback">No live post URL bound yet</span>}
      </div>
    )
  }

  const internalKickerLabels = new Set(['Mapped pocket', 'Hero artifact'])
  const richPreviewLabel = internalKickerLabels.has(binding.kicker)
    ? (binding.source_type === 'article' ? 'Source' : descriptor.platformLabel)
    : binding.kicker || (binding.source_type === 'article' ? 'Source' : descriptor.platformLabel)
  const richPreviewTitle = binding.title || descriptor.domainLabel
  const richPreviewExcerpt = binding.excerpt || `Open source material from ${descriptor.domainLabel}.`

  return (
    <div className="source-window__body source-window__body--web">
      <div className="rich-preview-card">
        {profile.showBodyEyebrow ? <div className="eyebrow">{richPreviewLabel}</div> : null}
        {profile.showBodyPlatformPill ? <span className="source-window__platform-pill">{richPreviewLabel}</span> : null}
        <strong>{richPreviewTitle}</strong>
        <span className="source-pill">{descriptor.domainLabel}</span>
        <p>{richPreviewExcerpt}</p>
      </div>
      {descriptor.sourceUrl ? <a href={descriptor.sourceUrl} rel="noreferrer" target="_blank">{descriptor.ctaLabel} ↗</a> : <span className="fallback">No live source URL bound yet</span>}
    </div>
  )
}

export default App
