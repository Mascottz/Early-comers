const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
      Pragma: 'no-cache',
    },
  })
}

function siteOrigin(value: unknown) {
  try {
    const url = new URL(String(value || 'https://earlycomers.vercel.app'))
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (url.origin === 'https://earlycomers.vercel.app' || local) return url.origin
  } catch (_) {}
  return 'https://earlycomers.vercel.app'
}

async function profileBy(
  base: string,
  serviceHeaders: Record<string, string>,
  query: string,
) {
  const response = await fetch(
    `${base}/rest/v1/staff_profiles?${query}&select=id,nickname,title,initials,color,avatar,active`,
    { headers: serviceHeaders },
  )
  if (!response.ok) return null
  const profiles = await response.json()
  return Array.isArray(profiles) && profiles.length > 0 ? profiles[0] : null
}

async function prepareLink(
  base: string,
  serviceHeaders: Record<string, string>,
  email: string,
  site: string,
) {
  const response = await fetch(`${base}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({
      type: 'magiclink',
      email,
      redirect_to: site,
    }),
  })
  const data = await response.json()
  if (!response.ok || !data.hashed_token) {
    throw new Error('Could not generate the private invite link')
  }

  const tokenType = String(data.verification_type || 'magiclink')
  return `${site}/invite?token=${encodeURIComponent(data.hashed_token)}&type=${encodeURIComponent(tokenType)}`
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const base = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const serviceHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }
  const userToken = request.headers.get('Authorization') ?? ''

  const userResponse = await fetch(`${base}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: userToken },
  })
  const user = await userResponse.json()
  if (!userResponse.ok || !user.email) return json({ error: 'Sign in again' }, 401)

  const adminResponse = await fetch(
    `${base}/rest/v1/admin_emails?email=eq.${encodeURIComponent(user.email.toLowerCase())}&select=email`,
    { headers: serviceHeaders },
  )
  const admins = await adminResponse.json()
  if (!Array.isArray(admins) || admins.length === 0) {
    return json({ error: 'Admin access required' }, 403)
  }

  const input = await request.json()
  const site = siteOrigin(input.redirect_to)

  if (input.action === 'link') {
    const workerId = String(input.worker_id || '').trim()
    if (!workerId) return json({ error: 'Choose a staff member' }, 400)

    const profile = await profileBy(base, serviceHeaders, `id=eq.${encodeURIComponent(workerId)}`)
    if (!profile) return json({ error: 'Staff member not found' }, 404)

    const emailResponse = await fetch(
      `${base}/rest/v1/staff_profiles?id=eq.${encodeURIComponent(workerId)}&select=email`,
      { headers: serviceHeaders },
    )
    const emails = await emailResponse.json()
    const email = Array.isArray(emails) && emails.length > 0 ? emails[0].email : ''
    if (!email) return json({ error: 'Staff email not found' }, 404)

    try {
      const inviteLink = await prepareLink(base, serviceHeaders, email, site)
      return json({ ...profile, invite_link: inviteLink })
    } catch (_) {
      return json({ error: 'Could not prepare the invite link' }, 502)
    }
  }

  const email = String(input.email || '').trim().toLowerCase()
  const fullName = String(input.full_name || '').trim()
  const nickname = String(input.nickname || '').trim()
  const title = String(input.title || '').trim()
  if (!email.includes('@') || fullName.length < 2 || nickname.length < 1 || title.length < 2) {
    return json({ error: 'Complete the staff profile' }, 400)
  }

  const inviteResponse = await fetch(`${base}/rest/v1/staff_invites?on_conflict=email`, {
    method: 'POST',
    headers: { ...serviceHeaders, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ email, full_name: fullName, nickname, title }),
  })
  if (!inviteResponse.ok) return json(await inviteResponse.json(), 400)

  const usersResponse = await fetch(`${base}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: serviceHeaders,
  })
  const userData = await usersResponse.json()
  const exists = (userData.users || []).some((item: { email?: string }) => item.email?.toLowerCase() === email)

  if (!exists) {
    const createResponse = await fetch(`${base}/auth/v1/admin/users`, {
      method: 'POST',
      headers: serviceHeaders,
      body: JSON.stringify({ email, email_confirm: true }),
    })
    if (!createResponse.ok) return json(await createResponse.json(), 400)
  }

  let profile = null
  for (let attempt = 0; attempt < 5 && !profile; attempt += 1) {
    profile = await profileBy(base, serviceHeaders, `email=eq.${encodeURIComponent(email)}`)
    if (!profile) await new Promise((resolve) => setTimeout(resolve, 180))
  }
  if (!profile) return json({ error: 'Staff profile not ready' }, 500)

  let inviteLink = ''
  try {
    inviteLink = await prepareLink(base, serviceHeaders, email, site)
  } catch (_) {}

  return json({ ...profile, invite_link: inviteLink })
})
