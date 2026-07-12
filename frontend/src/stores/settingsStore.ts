import { create } from 'zustand'
import type { AppSettings } from '@/types'

interface SettingsState {
  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => void
}

const defaults: AppSettings = {
  apiKey: '',
  baseUrl: 'http://localhost:8000',
  model: 'qwen2.5:1.5b'
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: { ...defaults },
  updateSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } }))
}))
