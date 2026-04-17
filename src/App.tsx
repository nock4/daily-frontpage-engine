import { useEffect, useMemo, useState } from 'react'
import { loadEditionPackage, loadManifest, polygonToClipPath, selectEdition } from './lib/editionLoader'
import type { LoadedEdition, SourceBindingRecord } from './types/runtime'

function App() {
  const [loaded, setLoaded] = useState<LoadedEdition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null)
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const manifest = await loadManifest()
        const item = selectEdition(manifest, new URLSearchParams(window.location.search))
        const pkg = await loadEditionPackage(item.path)
        setLoaded(pkg)
        setActiveArtifactId(pkg.artifactMap.default_artifact_id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load edition')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const activeBinding = useMemo(() => {
    if (!loaded || !activeArtifactId) return null
    return loaded.sourceBindings.bindings.find((binding) => binding.artifact_id === activeArtifactId) ?? null
  }, [loaded, activeArtifactId])

  if (loading) return <main className="boot-state">Loading daily edition…</main>
  if (error || !loaded) return <main className="boot-state">{error ?? 'Unknown error'}</main>

  const heroes = loaded.artifactMap.artifacts.filter((artifact) => artifact.kind === 'hero')
  const modules = loaded.artifactMap.artifacts.filter((artifact) => artifact.kind === 'module')
  const reviewMode = new URLSearchParams(window.location.search).get('debug') === 'masks' ? 'debug' : new URLSearchParams(window.location.search).get('qa') === 'clickable' ? 'clickable' : new URLSearchParams(window.location.search).get('qa') === 'solo' ? 'solo' : 'live'

  return (
    <main className={`runtime-shell review-mode--${reviewMode}`}>
      <section className="runtime-main">
        <header className="runtime-topbar">
          <div>
            <div className="eyebrow">Daily frontpage engine</div>
            <h1>{loaded.edition.title}</h1>
            <p>{loaded.brief.mood}</p>
          </div>
          <div className="topbar-meta">
            <span>{loaded.edition.date}</span>
            <span>{loaded.edition.scene_family}</span>
          </div>
        </header>

        <section className="stage">
          <img className="plate" src={loaded.edition.plate_asset_path} alt={loaded.edition.title} />

          {loaded.artifactMap.artifacts.map((artifact) => {
            const active = artifact.id === activeArtifactId
            const clipPath = polygonToClipPath(artifact)
            return (
              <button
                key={artifact.id}
                className={`artifact artifact--${artifact.kind}${active ? ' is-active' : ''}`}
                style={{
                  left: `${artifact.bounds.x * 100}%`,
                  top: `${artifact.bounds.y * 100}%`,
                  width: `${artifact.bounds.w * 100}%`,
                  height: `${artifact.bounds.h * 100}%`,
                  clipPath,
                  WebkitClipPath: clipPath,
                }}
                onMouseEnter={() => setActiveArtifactId(artifact.id)}
                onFocus={() => setActiveArtifactId(artifact.id)}
                onClick={() => {
                  setActiveArtifactId(artifact.id)
                  setActiveWindowId(artifact.id)
                }}
                type="button"
              >
                <span>{artifact.label}</span>
              </button>
            )
          })}
        </section>

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
      </section>

      <aside className="side-rail">
        <section className="panel">
          <div className="eyebrow">Brief</div>
          <h2>{loaded.edition.title}</h2>
          <p>{loaded.brief.mood}</p>
          <p>Lighting: {loaded.brief.lighting}</p>
          <p>Motion: {loaded.ambiance.motion_system}</p>
        </section>

        <section className="panel">
          <div className="eyebrow">Source window</div>
          {activeBinding ? <SourceWindow binding={activeBinding} active={activeWindowId === activeBinding.artifact_id} onActivate={() => setActiveWindowId(activeBinding.artifact_id)} onClose={() => setActiveWindowId(null)} /> : <p>No binding selected.</p>}
        </section>

        <section className="panel">
          <div className="eyebrow">Review</div>
          <p>Geometry: {loaded.review.geometry_status}</p>
          <p>Clickability: {loaded.review.clickability_status}</p>
          <p>Behavior: {loaded.review.behavior_status}</p>
        </section>
      </aside>
    </main>
  )
}

function SourceWindow({ binding, active, onActivate, onClose }: { binding: SourceBindingRecord; active: boolean; onActivate: () => void; onClose: () => void }) {
  return (
    <div className={`source-window${active ? ' is-active' : ''}`}>
      <div className="source-window__top">
        <div>
          <div className="eyebrow">{binding.kicker}</div>
          <strong>{binding.title}</strong>
        </div>
        <div className="source-window__actions">
          {!active ? <button onClick={onActivate} type="button">Pin</button> : null}
          {active ? <button onClick={onClose} type="button">Close</button> : null}
        </div>
      </div>
      <p>{binding.excerpt}</p>
      {binding.source_url ? (
        <a href={binding.source_url} target="_blank" rel="noreferrer">Open source ↗</a>
      ) : (
        <span className="fallback">No live source URL bound yet</span>
      )}
    </div>
  )
}

export default App
