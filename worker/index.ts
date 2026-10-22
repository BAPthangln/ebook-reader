export interface Env {
  GOOGLE_CLIENT_ID?: string
  GOOGLE_API_KEY?: string
  GOOGLE_CLIENT_SECRET?: string
  ASSETS?: { fetch: (request: Request) => Promise<Response> }
}

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Standard CORS headers for API calls
    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // 1. API: Get public Auth status & config
    if (url.pathname === '/api/auth/config') {
      const clientId = env.GOOGLE_CLIENT_ID || ''
      const hasSecret = Boolean(env.GOOGLE_CLIENT_SECRET)
      const apiKey = env.GOOGLE_API_KEY || ''

      return new Response(
        JSON.stringify({
          configured: Boolean(clientId && hasSecret),
          hasClientId: Boolean(clientId),
          hasSecret: hasSecret,
          clientId: clientId,
          apiKey: apiKey,
        }),
        { headers: corsHeaders }
      )
    }

    // 2. API: Start OAuth 2.0 Login (Redirect to Google OAuth consent screen)
    if (url.pathname === '/api/auth/login') {
      const clientId = env.GOOGLE_CLIENT_ID || ''
      if (!clientId) {
        return new Response(
          `<!DOCTYPE html>
          <html lang="vi">
          <head><meta charset="utf-8"/><title>Lỗi cấu hình</title>
          <style>body{background:#090d16;color:#f8fafc;font-family:sans-serif;padding:40px;text-align:center;}</style>
          </head>
          <body>
            <h2>Chưa cấu hình Google OAuth</h2>
            <p>Vui lòng cấu hình <code>GOOGLE_CLIENT_ID</code> và <code>GOOGLE_CLIENT_SECRET</code> trong Cloudflare Dashboard (Variables and Secrets).</p>
          </body></html>`,
          { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
      }

      const returnTo = url.searchParams.get('return_to') || url.origin
      const mode = url.searchParams.get('mode') || 'popup'
      const redirectUri = `${url.origin}/api/auth/callback`

      const stateData = {
        returnTo,
        mode,
        ts: Date.now(),
      }
      const state = btoa(JSON.stringify(stateData))

      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      googleAuthUrl.searchParams.set('client_id', clientId)
      googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
      googleAuthUrl.searchParams.set('response_type', 'code')
      googleAuthUrl.searchParams.set('scope', SCOPES)
      googleAuthUrl.searchParams.set('access_type', 'offline')
      googleAuthUrl.searchParams.set('prompt', 'consent')
      googleAuthUrl.searchParams.set('include_granted_scopes', 'true')
      googleAuthUrl.searchParams.set('state', state)

      return Response.redirect(googleAuthUrl.toString(), 302)
    }

    // 3. API: OAuth Callback from Google (Exchange code for access_token & refresh_token)
    if (url.pathname === '/api/auth/callback') {
      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')
      const errorDesc = url.searchParams.get('error_description') || error
      const rawState = url.searchParams.get('state')

      let returnTo = url.origin
      if (rawState) {
        try {
          const parsedState = JSON.parse(atob(rawState))
          if (parsedState.returnTo) returnTo = parsedState.returnTo
        } catch {
          // ignore parsing error
        }
      }

      // Handle OAuth error from Google
      if (error) {
        return new Response(
          `<!DOCTYPE html>
          <html lang="vi">
          <head>
            <meta charset="utf-8" />
            <title>Xác thực Google không thành công</title>
            <style>
              body { background: #090d16; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
              .card { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 24px; padding: 32px 28px; max-width: 440px; width: 90%; }
              h2 { color: #f87171; margin-top: 0; }
              p { font-size: 13px; color: #cbd5e1; }
              button { background: #334155; color: white; border: none; padding: 10px 20px; border-radius: 12px; cursor: pointer; margin-top: 16px; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Đăng nhập thất bại</h2>
              <p>${escapeHtml(errorDesc || 'Yêu cầu xác thực bị hủy hoặc từ chối.')}</p>
              <button onclick="window.close()">Đóng cửa sổ này</button>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(errorDesc || error)} }, '*');
                setTimeout(() => window.close(), 1500);
              } else {
                setTimeout(() => { window.location.href = ${JSON.stringify(returnTo)}; }, 2500);
              }
            </script>
          </body>
          </html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
      }

      if (!code) {
        return new Response('Thiếu OAuth Authorization Code', { status: 400 })
      }

      const clientId = env.GOOGLE_CLIENT_ID || ''
      const clientSecret = env.GOOGLE_CLIENT_SECRET || ''

      if (!clientId || !clientSecret) {
        return new Response(
          `<!DOCTYPE html>
          <html><head><meta charset="utf-8"/><title>Thiếu bí mật</title></head>
          <body style="background:#090d16;color:white;font-family:sans-serif;padding:30px;">
            <h3>Lỗi máy chủ: Chưa cấu hình GOOGLE_CLIENT_SECRET trên Cloudflare Worker.</h3>
            <p>Vui lòng mở Cloudflare Dashboard > ebook-reader > Settings > Variables and Secrets để cấu hình.</p>
          </body></html>`,
          { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
      }

      // Exchange authorization code for tokens securely on Cloudflare Worker
      const redirectUri = `${url.origin}/api/auth/callback`
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })

      if (!tokenRes.ok) {
        const errText = await tokenRes.text()
        console.error('Lỗi đổi token với Google:', errText)
        return new Response(
          `<!DOCTYPE html>
          <html><head><meta charset="utf-8"/><title>Đổi token thất bại</title>
          <style>body{background:#090d16;color:#f87171;font-family:sans-serif;padding:30px;}</style></head>
          <body>
            <h3>Đổi mã xác thực Google thất bại</h3>
            <pre style="background:#1e293b;padding:15px;border-radius:12px;color:#e2e8f0;overflow:auto;">${escapeHtml(errText)}</pre>
          </body></html>`,
          { status: 502, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
      }

      const tokenData = (await tokenRes.json()) as {
        access_token: string
        refresh_token?: string
        expires_in: number
        id_token?: string
      }

      // Fetch user profile info using access_token
      let profile = { name: 'Google User', email: '', picture: '' }
      try {
        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })
        if (userRes.ok) {
          profile = await userRes.json()
        }
      } catch (err) {
        console.warn('Không thể lấy userinfo từ Google:', err)
      }

      const authPayload = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || '',
        expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
        email: profile.email || '',
        name: profile.name || 'Google User',
        picture: profile.picture || '',
      }

      return new Response(
        `<!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Đăng nhập Google thành công - CloudBook</title>
          <style>
            body {
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: #090d16;
              color: #f8fafc;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              text-align: center;
              padding: 20px;
            }
            .card {
              background: rgba(30, 41, 59, 0.7);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 24px;
              padding: 32px 28px;
              max-width: 420px;
              width: 100%;
              backdrop-filter: blur(16px);
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            }
            .avatar {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              margin: 0 auto 16px;
              border: 2px solid #3b82f6;
              object-fit: cover;
            }
            .avatar-placeholder {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              margin: 0 auto 16px;
              background: linear-gradient(135deg, #2563eb, #7c3aed);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: bold;
              color: white;
            }
            h2 { font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #ffffff; }
            p { font-size: 13px; color: #94a3b8; margin: 0 0 24px; line-height: 1.5; }
            .spinner {
              width: 28px;
              height: 28px;
              border: 3px solid rgba(59, 130, 246, 0.2);
              border-top-color: #3b82f6;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin: 0 auto;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            ${
              profile.picture
                ? `<img class="avatar" src="${escapeHtml(profile.picture)}" alt="avatar" />`
                : `<div class="avatar-placeholder">${escapeHtml(
                    (profile.name || 'U').charAt(0).toUpperCase()
                  )}</div>`
            }
            <h2>Đăng nhập thành công!</h2>
            <p>Xin chào, <strong>${escapeHtml(
              profile.name
            )}</strong><br /><span style="font-size:11px;color:#64748b;">${escapeHtml(
              profile.email
            )}</span><br /><br />Đang đồng bộ dữ liệu vào CloudBook Reader...</p>
            <div class="spinner"></div>
          </div>
          <script>
            const authData = ${JSON.stringify(authPayload)};
            const returnTo = ${JSON.stringify(returnTo)};

            // If in popup window, send postMessage to main window and close
            if (window.opener && window.opener !== window) {
              try {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', data: authData }, '*');
                setTimeout(() => {
                  window.close();
                }, 400);
              } catch (e) {
                console.warn('postMessage failed, redirecting:', e);
                window.location.href = returnTo + '#auth_data=' + encodeURIComponent(JSON.stringify(authData));
              }
            } else {
              // Direct navigation fallback (mobile / full redirect)
              setTimeout(() => {
                window.location.href = returnTo + '#auth_data=' + encodeURIComponent(JSON.stringify(authData));
              }, 400);
            }
          </script>
        </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // 4. API: Refresh Access Token using Refresh Token
    if (url.pathname === '/api/auth/refresh' && request.method === 'POST') {
      try {
        const body = (await request.json()) as { refreshToken?: string }
        const refreshToken = body?.refreshToken

        if (!refreshToken) {
          return new Response(JSON.stringify({ error: 'Missing refreshToken' }), {
            status: 400,
            headers: corsHeaders,
          })
        }

        const clientId = env.GOOGLE_CLIENT_ID || ''
        const clientSecret = env.GOOGLE_CLIENT_SECRET || ''

        if (!clientId || !clientSecret) {
          return new Response(
            JSON.stringify({ error: 'Worker credentials not configured' }),
            { status: 500, headers: corsHeaders }
          )
        }

        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        })

        if (!res.ok) {
          const errData = await res.text()
          console.error('Lỗi refresh token:', errData)
          return new Response(
            JSON.stringify({ error: 'Token refresh failed', details: errData }),
            { status: 401, headers: corsHeaders }
          )
        }

        const data = (await res.json()) as {
          access_token: string
          expires_in: number
        }

        return new Response(
          JSON.stringify({
            accessToken: data.access_token,
            expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
          }),
          { headers: corsHeaders }
        )
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
          { status: 500, headers: corsHeaders }
        )
      }
    }

    // 5. Static Assets: serve React PWA dist files
    if (env.ASSETS) {
      return env.ASSETS.fetch(request)
    }

    return new Response('Not found', { status: 404 })
  },
}
