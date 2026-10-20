import type { GoogleUser } from '../types'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: {
              access_token?: string
              expires_in?: number
              error?: string
              error_description?: string
            }) => void
            error_callback?: (err: unknown) => void
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void
          }
        }
      }
    }
    gapi?: {
      load: (apiName: string, callback: () => void) => void
      client: {
        init: (config: { apiKey: string; discoveryDocs: string[] }) => Promise<void>
        setToken: (token: { access_token: string }) => void
      }
    }
  }
}

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

export async function fetchGoogleUserProfile(accessToken: string): Promise<Partial<GoogleUser>> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (!res.ok) {
      throw new Error(`Failed to fetch user profile: ${res.statusText}`)
    }
    const data = await res.json()
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
    }
  } catch (err) {
    console.error('Error fetching Google profile:', err)
    return {}
  }
}

export function requestGoogleLogin(
  clientId: string,
  onSuccess: (user: GoogleUser) => void,
  onError: (err: string) => void
): void {
  if (!window.google?.accounts?.oauth2) {
    onError('Google Identity Services script chưa được tải. Vui lòng kiểm tra kết nối mạng.')
    return
  }

  if (!clientId || clientId.trim() === '') {
    onError('Chưa cấu hình Google Client ID. Vui lòng nhập Client ID trong phần Cài đặt.')
    return
  }

  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: SCOPES,
      callback: async (resp) => {
        if (resp.error) {
          onError(`Đăng nhập Google thất bại: ${resp.error_description || resp.error}`)
          return
        }

        if (resp.access_token) {
          const expiresIn = resp.expires_in || 3600
          const expiresAt = Date.now() + expiresIn * 1000
          const profile = await fetchGoogleUserProfile(resp.access_token)

          const user: GoogleUser = {
            accessToken: resp.access_token,
            expiresAt,
            email: profile.email || 'user@gmail.com',
            name: profile.name || 'Google User',
            picture: profile.picture || '',
          }

          onSuccess(user)
        }
      },
      error_callback: (err) => {
        console.error('OAuth token error:', err)
        onError('Xác thực Google bị từ chối hoặc đóng cửa sổ đăng nhập.')
      },
    })

    tokenClient.requestAccessToken({ prompt: 'consent' })
  } catch (error) {
    console.error('Failed to initTokenClient:', error)
    onError(`Lỗi khởi tạo đăng nhập Google: ${error instanceof Error ? error.message : String(error)}`)
  }
}
