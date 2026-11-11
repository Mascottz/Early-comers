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
    const host = url.hostname
    const local = host === 'localhost' || host === '127.0.0.1'
    const preview = host.endsWith('.vercel.app') && host.startsWith('early-comers')
    if (host === 'earlycomers.vercel.app' || preview || local) return url.origin
  } catch (_) {}
  return 'https://earlycomers.vercel.app'
}

function constantTimeEqual(left: string, right: string) {
  const encoder = new TextEncoder()
  const a = encoder.encode(left)
  const b = encoder.encode(right)
  const length = Math.max(a.length, b.length)
  let difference = a.length ^ b.length
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0)
  }
  return difference === 0
}

async function rpc(
  base: string,
  headers: Record<string, string>,
  name: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(`${base}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!response.ok) return null
  return response.json()
}

async function prepareLink(
  base: string,
  headers: Record<string, string>,
  email: string,
  site: string,
) {
  const response = await fetch(`${base}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'magiclink',
      email,
    }),
  })
  const data = await response.json()
  if (!response.ok || !data.hashed_token) {
    throw new Error('Could not create session link')
  }
  const tokenType = String(data.verification_type || 'magiclink')
  return `${site}/invite?token=${encodeURIComponent(data.hashed_token)}&type=${encodeURIComponent(tokenType)}`
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const base = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const teamPassword = Deno.env.get('TEAM_ACCESS_PASSWORD') ?? ''
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }

  let input: Record<string, unknown> = {}
  try {
    input = await request.json()
  } catch (_) {
    return json({ error: 'Invalid request' }, 400)
  }

  const email = String(input.email || '').trim().toLowerCase()
  const password = String(input.password || '')
  const pin = String(input.pin || '').trim()
  const site = siteOrigin(input.redirect_to)

  if (!email.includes('@') || !/^[0-9]{6}$/.test(pin) || password.length < 6) {
    return json({ error: 'Enter your approved email, team password, and six-digit PIN' }, 400)
  }

  const forwarded = request.headers.get('x-forwarded-for') || ''
  const address =
    forwarded.split(',')[0].trim() ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const throttle = await rpc(base, headers, 'check_auth_throttle', { p_key: address })
  if (!throttle) return json({ error: 'Sign-in is unavailable right now' }, 503)
  if (throttle.blocked) {
    return json({ error: 'Too many attempts. Try again later.', retry_after: throttle.retry_after }, 429)
  }

  if (!teamPassword || !constantTimeEqual(password, teamPassword)) {
    await rpc(base, headers, 'record_auth_failure', { p_key: address })
    await new Promise((resolve) => setTimeout(resolve, 500))
    return json({ error: 'Email, team password, or PIN is incorrect' }, 401)
  }

  await rpc(base, headers, 'clear_auth_failures', { p_key: address })

  const result = await rpc(base, headers, 'verify_staff_pin', { p_email: email, p_pin: pin })
  if (!result) return json({ error: 'Sign-in is unavailable right now' }, 503)

  if (result.status === 'email_not_allowed') {
    return json({ error: 'This email is not approved for ProofsTech attendance' }, 403)
  }
  if (result.status === 'pin_not_set') {
    return json({ error: 'No PIN is set for this email. Use the first-time email link, then set your PIN.' }, 409)
  }
  if (result.status === 'locked') {
    return json({ error: 'Too many PIN attempts. Try again later.', retry_after: result.retry_after }, 429)
  }
  if (result.status !== 'ok') {
    return json({
      error: 'Email, team password, or PIN is incorrect',
      attempts_left: result.attempts_left,
    }, 401)
  }

  try {
    const inviteLink = await prepareLink(base, headers, email, site)
    return json({ invite_link: inviteLink })
  } catch (_) {
    return json({ error: 'Could not open your session. Try again.' }, 502)
  }
})
