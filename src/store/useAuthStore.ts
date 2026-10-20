import { create } from 'zustand'
import type { GoogleUser } from '../types'
import { requestGoogleLogin } from '../services/googleAuth'

interface AuthStore {
  user: GoogleUser | null
  clientId: string
  apiKey: string
  isLoading: boolean
  error: string | null
  setClientId: (clientId: string) => void
  setApiKey: (apiKey: string) => void
  login: () => Promise<void>
  logout: () => void
  clearError: () => void
}

const STORAGE_USER_KEY = 'ebook_google_user'
const STORAGE_CLIENT_ID_KEY = 'ebook_google_client_id'
const STORAGE_API_KEY_KEY = 'ebook_google_api_key'

function getInitialUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY)
    if (raw) {
      const user = JSON.parse(raw) as GoogleUser
      if (user.expiresAt && user.expiresAt > Date.now()) {
        return user
      }
    }
  } catch {
    // ignore
  }
  return null
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: getInitialUser(),
  clientId:
    localStorage.getItem(STORAGE_CLIENT_ID_KEY) ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '',
  apiKey:
    localStorage.getItem(STORAGE_API_KEY_KEY) ||
    import.meta.env.VITE_GOOGLE_API_KEY ||
    '',
  isLoading: false,
  error: null,

  setClientId: (clientId: string) => {
    localStorage.setItem(STORAGE_CLIENT_ID_KEY, clientId)
    set({ clientId })
  },

  setApiKey: (apiKey: string) => {
    localStorage.setItem(STORAGE_API_KEY_KEY, apiKey)
    set({ apiKey })
  },

  login: async () => {
    const { clientId } = get()
    set({ isLoading: true, error: null })

    return new Promise((resolve) => {
      requestGoogleLogin(
        clientId,
        (user) => {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
          set({ user, isLoading: false, error: null })
          resolve()
        },
        (errorMsg) => {
          set({ isLoading: false, error: errorMsg })
          resolve()
        }
      )
    })
  },

  logout: () => {
    localStorage.removeItem(STORAGE_USER_KEY)
    set({ user: null, error: null })
  },

  clearError: () => {
    set({ error: null })
  },
}))
