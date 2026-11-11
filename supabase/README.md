# Supabase access model

Supabase is the shared source of truth for staff identity and attendance. The Elm app keeps an on-device offline queue in browser storage, then synchronizes when a connection is available.

## Access rules

1. Disable public email signups in Supabase Auth. Staff join only through an admin invite.
2. Add approved admin addresses to `admin_emails` with a trusted SQL session. Admin status is checked from the verified email in the auth token.
3. Create a row in `staff_invites` for each staff member, then send an invite through the Supabase Admin API. Never put the service role key in the PWA.
4. Run `schema.sql` in the Supabase SQL editor.
5. Configure the Elm browser bridge with the project URL and public anon key. The anon key is safe for the browser only when the included row level security policies are active.

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
- Enable magic links.
- Add the production PWA URL to the allowed redirect URLs.
- Use HTTPS in production so camera access, installation, and service workers work on iPhone.
