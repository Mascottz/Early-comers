# Supabase access model

Supabase is the shared source of truth for staff identity and attendance. The Elm app keeps an on-device offline queue in browser storage, then synchronizes when a connection is available.

## Access rules

1. Disable public email signups in Supabase Auth. Staff are provisioned by an admin; the sign-in page only accepts emails that already exist in `staff_profiles`.
2. Add approved admin addresses to `admin_emails` with a trusted SQL session. Admin status is checked from the verified email in the auth token.
3. Create a row in `staff_invites` for each staff member, then prepare a one-time link through the Supabase Admin API. The `invite-staff` edge function keeps the service role key server-side and returns a branded `/invite` link. Never put the service role key in the PWA.
4. Run `schema.sql` in the Supabase SQL editor.
5. Configure the Elm browser bridge with the project URL and public anon key. The anon key is safe for the browser only when the included row level security policies are active.
6. Deploy the `pin-auth` edge function with JWT verification off. It is the only sign-in endpoint that an anonymous browser can call.

## Staff information

Use these columns when preparing the staff import:

```csv
full_name,email,nickname,title
```

Email addresses should be the staff members’ real inboxes. Full names stay on the official profile, while the AKA in `nickname` appears on the daily wall. Admin access is separate from job title and comes only from `admin_emails`.

## Offline behavior

The device creates a stable attendance ID and records `occurred_at`, `local_date`, and `local_time` at the moment of scanning. A unique constraint on `worker_id` and `local_date` makes retries safe. A worker can insert only a row whose `worker_id` matches `auth.uid()`.

## Required Auth settings

- Enable email.
- Disable public signups.
- Enable magic links; they are used once to enrol a person and let them choose a PIN.
- Add the production PWA URL to the allowed redirect URLs.
- Use HTTPS in production so camera access, installation, and service workers work on iPhone.

## Signing in with a PIN

The sign-in page asks for three things:

1. an approved staff email from `staff_profiles`;
2. the universal team password, stored only as the `TEAM_ACCESS_PASSWORD` edge secret;
3. the person's own six-digit PIN, stored as a bcrypt hash in `staff_pins`.

The universal password alone never opens a session. The `pin-auth` function checks the password server-side, throttles repeated failures, verifies the PIN, and only then asks the Admin API for a one-time magic-link token. The browser follows the returned branded `/invite?token=…` link, and `invite.html` finishes the sign-in. No secret is ever sent to the browser.

First-time staff use the private link prepared by an admin. Once that link opens the app, the person is asked to choose a PIN before the workspace appears. After that, the email + team password + PIN page is the normal route.

- Set the shared password with `TEAM_ACCESS_PASSWORD` in edge function secrets, never in the repo or browser config.
- PIN verification locks an account for 15 minutes after five wrong PINs.
- IP-level failures are throttled after ten bad attempts in 15 minutes.
- If an email has no PIN yet, `pin-auth` returns `409` and the page tells the person to use their private first-time link.

## Private invite links

The app never sends invite email itself. An admin prepares a link for one staff member, and the `invite-staff` edge function generates a one-time token with the Admin API. The branded link is:

```text
https://earlycomers.vercel.app/invite?token=…&type=magiclink
```

`invite.html` verifies the token with Supabase, then redirects back to the app with a normal session. Links expire after one hour and work once. Keep the edge function’s `verify_jwt` setting enabled; it checks both the signed-in user and `admin_emails`.
