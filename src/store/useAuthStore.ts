import { create } from 'zustand'
import type { GoogleUser } from '../types'
import { fetchGoogleUserProfile } from '../services/googleAuth'

interface AuthStore {
  user: GoogleUser | null
  clientId: string
  apiKey: string
  isWorkerConfigured: boolean
  isLoading: boolean
  error: string | null
  initAuth: () => Promise<void>
  setClientId: (clientId: string) => void
  setApiKey: (apiKey: string) => void
  login: () => Promise<void>
  refreshAccessToken: () => Promise<string | null>
  getValidAccessToken: () => Promise<string | null>
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
      // Return user if valid or has refresh token
      if (user.refreshToken || (user.expiresAt && user.expiresAt > Date.now())) {
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
  isWorkerConfigured: false,
  isLoading: false,
  error: null,

  initAuth: async () => {
    // 1. Check if redirected back with #auth_data=... in URL hash (Worker OAuth code exchange)
    if (window.location.hash.includes('auth_data=')) {
      try {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        const rawAuthData = params.get('auth_data')
        if (rawAuthData) {
          const authData = JSON.parse(decodeURIComponent(rawAuthData)) as GoogleUser
          if (authData.accessToken) {
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authData))
            set({ user: authData })
            window.history.replaceState(null, '', window.location.pathname)
            return
          }
        }
      } catch (err) {
        console.warn('Lỗi đọc auth_data từ hash:', err)
      }
    }

    // 2. Legacy fallback: Check if redirected back with #access_token=... in URL hash
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
          window.history.replaceState(null, '', window.location.pathname)
          return
        }
      } catch (err) {
        console.warn('Lỗi xử lý OAuth redirect hash:', err)
      }
    }

    // 3. Fetch Auth configuration from Cloudflare Worker
    try {
      const res = await fetch('/api/auth/config')
      if (res.ok) {
        const data = await res.json()
        set({ isWorkerConfigured: Boolean(data.configured) })
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

    // 4. Silently refresh token if expired or about to expire in 5 minutes
    const currentUser = get().user
    if (currentUser?.refreshToken) {
      if (!currentUser.expiresAt || currentUser.expiresAt < Date.now() + 5 * 60 * 1000) {
        get().refreshAccessToken()
      }
    }
  },

  refreshAccessToken: async (): Promise<string | null> => {
    const { user } = get()
    if (!user?.refreshToken) return null

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: user.refreshToken }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          console.warn('Google refresh token đã bị thu hồi hoặc hết hạn.')
          get().logout()
        }
        return null
      }

      const data = (await res.json()) as { accessToken: string; expiresAt: number }
      const updatedUser: GoogleUser = {
        ...user,
        accessToken: data.accessToken,
        expiresAt: data.expiresAt,
      }
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser))
      set({ user: updatedUser })
      return data.accessToken
    } catch (err) {
      console.warn('Lỗi khi làm mới token:', err)
      return null
    }
  },

  getValidAccessToken: async (): Promise<string | null> => {
    const { user, refreshAccessToken } = get()
    if (!user) return null

    // Still valid for at least 1 minute
    if (user.expiresAt && user.expiresAt > Date.now() + 60 * 1000) {
      return user.accessToken
    }

    // Attempt token refresh
    if (user.refreshToken) {
      const refreshed = await refreshAccessToken()
      if (refreshed) return refreshed
    }

    return user.accessToken
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
    set({ isLoading: true, error: null })

    return new Promise((resolve) => {
      // Check if Worker OAuth is available
      const loginUrl = `/api/auth/login?return_to=${encodeURIComponent(
        window.location.origin
      )}&mode=popup`

      // Open OAuth popup window centered on screen
      const width = 500
      const height = 650
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      const popup = window.open(
        loginUrl,
        'google_oauth_login',
        `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0`
      )

      // Fallback: If popup is blocked by browser, perform full redirect
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.location.href = `/api/auth/login?return_to=${encodeURIComponent(
          window.location.origin
        )}&mode=redirect`
        return
      }

      // Popup opened successfully: Listen for message from popup
      let popupTimer: ReturnType<typeof setInterval> | null = null

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage)
          if (popupTimer) clearInterval(popupTimer)

          const authUser = event.data.data as GoogleUser
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authUser))
          set({ user: authUser, isLoading: false, error: null })
          resolve()
        } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage)
          if (popupTimer) clearInterval(popupTimer)

          set({
            isLoading: false,
            error: event.data.error || 'Đăng nhập Google thất bại.',
          })
          resolve()
        }
      }

      window.addEventListener('message', handleMessage)

      // Detect if user manually closed the popup without completing login
      popupTimer = setInterval(() => {
        if (popup.closed) {
          if (popupTimer) clearInterval(popupTimer)
          window.removeEventListener('message', handleMessage)
          set({ isLoading: false })
          resolve()
        }
      }, 500)
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
