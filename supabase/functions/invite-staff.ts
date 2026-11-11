const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
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
  const exists = (userData.users || []).some((item) => item.email?.toLowerCase() === email)

  if (!exists) {
    const createResponse = await fetch(`${base}/auth/v1/admin/users`, {
      method: 'POST',
      headers: serviceHeaders,
      body: JSON.stringify({ email, email_confirm: true }),
    })
    if (!createResponse.ok) return json(await createResponse.json(), 400)
  }

  const profileResponse = await fetch(
    `${base}/rest/v1/staff_profiles?email=eq.${encodeURIComponent(email)}&select=id,nickname,title,initials,color,avatar,active`,
    { headers: serviceHeaders },
  )
  const profiles = await profileResponse.json()
  return json(profiles[0] || null)
})
