export interface Env {
  GOOGLE_CLIENT_ID?: string
  GOOGLE_API_KEY?: string
  GOOGLE_CLIENT_SECRET?: string
  ASSETS?: { fetch: (request: Request) => Promise<Response> }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Handle CORS preflight
    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // 1. API: Get public Auth config (Client ID & API Key stored in Worker environment)
    if (url.pathname === '/api/auth/config') {
      const clientId = env.GOOGLE_CLIENT_ID || ''
      const apiKey = env.GOOGLE_API_KEY || ''

      return new Response(
        JSON.stringify({
          configured: Boolean(clientId),
          clientId,
          apiKey,
        }),
        { headers: corsHeaders }
      )
    }

    // 2. API: Generate Google OAuth Consent URL
    if (url.pathname === '/api/auth/url') {
      const clientId = env.GOOGLE_CLIENT_ID || ''
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: 'Worker chưa cấu hình GOOGLE_CLIENT_ID' }),
          { status: 400, headers: corsHeaders }
        )
      }

      const redirectUri = `${url.origin}/`
      const scope = encodeURIComponent(
        [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/drive.appdata',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
        ].join(' ')
      )

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token&scope=${scope}&include_granted_scopes=true&prompt=consent`

      return new Response(JSON.stringify({ authUrl }), { headers: corsHeaders })
    }

    // 3. Static Assets: serve React PWA dist files
    if (env.ASSETS) {
      return env.ASSETS.fetch(request)
    }

    return new Response('Not found', { status: 404 })
  },
}
