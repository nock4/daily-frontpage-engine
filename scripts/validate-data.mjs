import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const layout = JSON.parse(fs.readFileSync(path.join(root, 'public/data/layout.json'), 'utf8'))
const signals = JSON.parse(fs.readFileSync(path.join(root, 'public/data/signals.json'), 'utf8'))

const regionIds = new Set(layout.regions.map((region) => region.id))
const clusterIds = new Set(signals.clusters.map((cluster) => cluster.id))
const signalIds = new Set(signals.signals.map((signal) => signal.id))
const errors = []

for (const region of layout.regions) {
  if (!clusterIds.has(region.clusterId)) errors.push(`Unknown cluster on region ${region.id}: ${region.clusterId}`)
  if (region.signalId && !signalIds.has(region.signalId)) errors.push(`Unknown signal on region ${region.id}: ${region.signalId}`)
  if (region.defaultSignalId && !signalIds.has(region.defaultSignalId)) errors.push(`Unknown default signal on region ${region.id}: ${region.defaultSignalId}`)
  if (!fs.existsSync(path.join(root, 'public', region.mask))) errors.push(`Missing mask file for ${region.id}: ${region.mask}`)
}

for (const cluster of signals.clusters) {
  if (!regionIds.has(cluster.heroRegionId)) errors.push(`Unknown heroRegionId on cluster ${cluster.id}: ${cluster.heroRegionId}`)
  for (const signalId of cluster.signalIds) {
    if (!signalIds.has(signalId)) errors.push(`Unknown signal in cluster ${cluster.id}: ${signalId}`)
  }
}

for (const signal of signals.signals) {
  if (!clusterIds.has(signal.clusterId)) errors.push(`Unknown cluster on signal ${signal.id}: ${signal.clusterId}`)
  if (!regionIds.has(signal.regionId)) errors.push(`Unknown region on signal ${signal.id}: ${signal.regionId}`)
  for (const relatedId of signal.relatedIds) {
    if (!signalIds.has(relatedId)) errors.push(`Unknown relatedId on signal ${signal.id}: ${relatedId}`)
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(JSON.stringify({
  regions: layout.regions.length,
  signals: signals.signals.length,
  clusters: signals.clusters.length,
  status: 'ok',
}, null, 2))
