import { create } from 'zustand'
import type { ReaderSettings, ReaderTheme } from '../types'

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'sepia',
  customBgColor: '#fbf0d9',
  customTextColor: '#4a3728',
  fontFamily: 'Merriweather',
  fontSize: 18,
  lineHeight: 1.6,
  margin: 'normal',
  textAlign: 'justify',
  layout: 'paginated',
  columnCount: 'auto',
}

interface SettingsStore extends ReaderSettings {
  updateSettings: (newSettings: Partial<ReaderSettings>) => void
  setTheme: (theme: ReaderTheme) => void
  setFontSize: (size: number) => void
  resetSettings: () => void
}

const STORAGE_KEY = 'ebook_reader_settings'

function loadSavedSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...loadSavedSettings(),

  updateSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state, ...newSettings }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  },

  setTheme: (theme) => {
    set((state) => {
      const updated = { ...state, theme }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  },

  setFontSize: (fontSize) => {
    set((state) => {
      const clamped = Math.max(12, Math.min(36, fontSize))
      const updated = { ...state, fontSize: clamped }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  },

  resetSettings: () => {
    set(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS))
      } catch {
        // ignore
      }
      return DEFAULT_SETTINGS
    })
  },
}))
