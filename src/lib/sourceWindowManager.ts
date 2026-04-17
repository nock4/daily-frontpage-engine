import type { SourceBindingRecord, SourceWindowState } from '../types/runtime'

const unique = (values: string[]) => Array.from(new Set(values))
const isAudioBinding = (binding: SourceBindingRecord) => binding.window_type === 'audio'

export const createWindowState = (): SourceWindowState => ({
  previewBindingId: null,
  primaryBindingId: null,
  focusedBindingId: null,
  openBindingIds: [],
  minimizedBindingIds: [],
  persistentBindingIds: [],
  bindingWindowTypes: {},
})

export const hoverBinding = (state: SourceWindowState, binding: SourceBindingRecord): SourceWindowState => {
  if (binding.hover_behavior !== 'preview') return { ...state, previewBindingId: null }
  if (state.openBindingIds.includes(binding.id)) return { ...state, previewBindingId: null }
  return { ...state, previewBindingId: binding.id }
}

export const clearPreview = (state: SourceWindowState): SourceWindowState => ({
  ...state,
  previewBindingId: null,
})

export const pinBinding = (state: SourceWindowState, binding: SourceBindingRecord): SourceWindowState => {
  const openBindingIds = unique([...state.openBindingIds, binding.id])
  const bindingWindowTypes = { ...state.bindingWindowTypes, [binding.id]: binding.window_type }
  const persistentBindingIds = binding.playback_persistence
    ? unique([...state.persistentBindingIds, binding.id])
    : state.persistentBindingIds.filter((id) => id !== binding.id)

  if (isAudioBinding(binding)) {
    const currentPrimaryId = state.primaryBindingId
    const currentPrimaryType = currentPrimaryId ? state.bindingWindowTypes[currentPrimaryId] : null

    if (currentPrimaryId && currentPrimaryType && currentPrimaryType !== 'audio' && currentPrimaryId !== binding.id) {
      return {
        ...state,
        previewBindingId: null,
        focusedBindingId: binding.id,
        openBindingIds,
        minimizedBindingIds: unique([...state.minimizedBindingIds.filter((id) => id !== currentPrimaryId), binding.id]),
        persistentBindingIds,
        bindingWindowTypes,
      }
    }

    return {
      ...state,
      previewBindingId: null,
      primaryBindingId: binding.id,
      focusedBindingId: binding.id,
      openBindingIds,
      minimizedBindingIds: state.minimizedBindingIds.filter((id) => id !== binding.id),
      persistentBindingIds,
      bindingWindowTypes,
    }
  }

  const retainedAudioIds = state.openBindingIds.filter((id) => state.persistentBindingIds.includes(id))
  const minimizedBindingIds = unique([...retainedAudioIds].filter((id) => id !== binding.id))
  const nextOpenBindingIds = unique([...minimizedBindingIds, binding.id])

  return {
    previewBindingId: null,
    primaryBindingId: binding.id,
    focusedBindingId: binding.id,
    openBindingIds: nextOpenBindingIds,
    minimizedBindingIds,
    persistentBindingIds,
    bindingWindowTypes,
  }
}

export const focusWindow = (state: SourceWindowState, bindingId: string): SourceWindowState => {
  if (!state.openBindingIds.includes(bindingId)) return state
  return {
    ...state,
    focusedBindingId: bindingId,
    primaryBindingId: state.minimizedBindingIds.includes(bindingId) ? state.primaryBindingId : bindingId,
  }
}

export const restoreWindow = (state: SourceWindowState, bindingId: string): SourceWindowState => {
  if (!state.openBindingIds.includes(bindingId)) return state
  return {
    ...state,
    primaryBindingId: bindingId,
    focusedBindingId: bindingId,
    minimizedBindingIds: state.minimizedBindingIds.filter((id) => id !== bindingId),
  }
}

export const closeWindow = (state: SourceWindowState, bindingId: string): SourceWindowState => {
  const openBindingIds = state.openBindingIds.filter((id) => id !== bindingId)
  const minimizedBindingIds = state.minimizedBindingIds.filter((id) => id !== bindingId)
  const persistentBindingIds = state.persistentBindingIds.filter((id) => id !== bindingId)
  const bindingWindowTypes = { ...state.bindingWindowTypes }
  delete bindingWindowTypes[bindingId]
  const primaryBindingId = state.primaryBindingId === bindingId ? openBindingIds.find((id) => !minimizedBindingIds.includes(id)) ?? null : state.primaryBindingId
  const focusedBindingId = state.focusedBindingId === bindingId ? primaryBindingId : state.focusedBindingId

  return {
    previewBindingId: state.previewBindingId === bindingId ? null : state.previewBindingId,
    primaryBindingId,
    focusedBindingId,
    openBindingIds,
    minimizedBindingIds,
    persistentBindingIds,
    bindingWindowTypes,
  }
}
