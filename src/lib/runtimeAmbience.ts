import type { AmbianceRecord, SourceBindingRecord } from '../types/runtime'
import { getActiveBindingAmbienceMode } from './sourceWindowContent'

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'none'

export const getRuntimeAmbienceClasses = (ambiance: AmbianceRecord | null, binding: SourceBindingRecord | null): string[] => {
  const classes = [getActiveBindingAmbienceMode(binding)]

  if (!ambiance) return classes

  classes.push(`recipe-motion-${slugify(ambiance.motion_system)}`)
  classes.push(`recipe-color-${slugify(ambiance.color_drift)}`)
  classes.push(`recipe-glow-${slugify(ambiance.glow_behavior)}`)
  classes.push(`recipe-audio-${slugify(ambiance.audio_posture)}`)
  classes.push(`recipe-webgl-${slugify(ambiance.webgl_mode)}`)

  return classes
}
