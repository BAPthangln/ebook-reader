import { create } from 'zustand'
import type { GoogleUser } from '../types'
import { requestGoogleLogin, fetchGoogleUserProfile } from '../services/googleAuth'

interface AuthStore {
  user: GoogleUser | null
  clientId: string
  apiKey: string
  isLoading: boolean
  error: string | null
  initAuth: () => Promise<void>
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

  initAuth: async () => {
    // 1. Check if redirected back with OAuth access_token in URL hash
    if (window.location.hash.includes('access_token=')) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const expiresInStr = hashParams.get('expires_in')
        const expiresIn = expiresInStr ? parseInt(expiresInStr, 10) : 3600

        if (accessToken) {
          const profile = await fetchGoogleUserProfile(accessToken)
          const user: GoogleUser = {
            accessToken,
            expiresAt: Date.now() + expiresIn * 1000,
            email: profile.email || 'user@gmail.com',
            name: profile.name || 'Google User',
            picture: profile.picture || '',
          }
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
          set({ user })
          // Clean hash from address bar
          window.history.replaceState(null, '', window.location.pathname)
          return
        }
      } catch (err) {
        console.warn('Lỗi xử lý OAuth redirect hash:', err)
      }
    }

    // 2. Fetch Client ID and API Key from OAuth Cloudflare Worker if not yet set
    try {
      const res = await fetch('/api/auth/config')
      if (res.ok) {
        const data = await res.json()
        if (data.clientId && !get().clientId) {
          localStorage.setItem(STORAGE_CLIENT_ID_KEY, data.clientId)
          set({ clientId: data.clientId })
        }
        if (data.apiKey && !get().apiKey) {
          localStorage.setItem(STORAGE_API_KEY_KEY, data.apiKey)
          set({ apiKey: data.apiKey })
        }
      }
    } catch {
      // Offline or local dev without worker
    }
  },

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
