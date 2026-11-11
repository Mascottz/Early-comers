# Attendance by ProofsTech

An offline-ready workplace attendance PWA for iPhone and desktop. The repository name is Early-comers; the product name is Attendance by ProofsTech.

## Stack

- Elm 0.19.1 for the interface and offline attendance state
- FastAPI and SQLite for the local development service
- Supabase Auth, Postgres, and row level security for production identity and shared synchronization
- A small browser bridge only for camera access, local storage, service workers, and installation APIs

## What works

- QR-only staff check-in, with no typed office-code fallback to share
- Approved-email sign-in with the shared team password plus a personal six-digit PIN
- Admin-prepared private invite links that sign a staff member in automatically without sending email
- One check-in per worker per local day, including safe retries
- Offline check-in, persistent local records, and synchronization after reconnecting
- Shared daily wall with dates and arrival times
- Staff directory and admin team creation in the local development service
- Printable and downloadable office QR
- CSV attendance export
- Installable iPhone PWA with local fonts and cached application assets
- Staff portraits for Merciful, MD, Mascott, FundsTech, and IB China, with custom illustrations for everyone else
- A responsive organic interface

Admin access cannot be selected in the interface. Production admin status comes only from a verified email in the protected Supabase `admin_emails` table.

The typed office-code fallback has been removed. A printed QR still can be photographed and reused, so this closes the easy code-sharing path rather than proving physical presence; rotating QR or location checks would be needed for stronger verification.

## Local setup

Requirements: Node.js 22 or later, Python 3.11 or later, and Git.

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
npm install
.venv/bin/uvicorn server.main:app --host 0.0.0.0 --port 8000
```

Compile the Elm application after source changes:

```sh
npm run compile
```

For a production build:

```sh
npm run build
```

The build script copies local fonts and the QR scanning library, prepares Elm dependencies, compiles optimized Elm, and checks the Python service. `scripts/bootstrap_elm.py` can load Elm packages from GitHub in environments where the Elm package registry is unavailable.

## Tests

```sh
npm test
```

The API tests use isolated temporary SQLite databases and cover seeded records, device timezone preservation, duplicate check-ins, unknown workers, and staff creation.

## Supabase

See `supabase/README.md` and `supabase/schema.sql` for the production access model. Staff can be prepared with the columns shown in `supabase/staff.example.csv`.

Do not put a Supabase service role key or the `TEAM_ACCESS_PASSWORD` value in the Elm app, browser bridge, repository, or environment exposed to the browser. Staff invites, PIN verification, private link generation, and admin email changes require trusted server code.

## Vercel deployment

The production deployment is https://earlycomers.vercel.app/.

The repository includes `vercel.json`, a Python QR function at `api/qr.py`, and build-time browser configuration. Import the GitHub branch into Vercel and set these environment variables:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
OFFICE_CODE=PROOFSTECH-HQ-2026
```

`scripts/write_runtime_config.py` creates the ignored `public/runtime-config.js` file during the build. Never replace the publishable key with a service role or secret key.

After the first deployment:

1. Add the production URL to Supabase Auth’s site URL and allowed redirect URLs.
2. Deploy both edge functions: `invite-staff` and `pin-auth`.
3. Set the `TEAM_ACCESS_PASSWORD` edge secret. Never put it in Vercel, the repo, or browser config.
4. Test a first-time private link and the email + team password + PIN page on an installed iPhone PWA.

## Signing in

The sign-in page accepts only emails that already exist in `staff_profiles`. It asks for the approved email, the shared ProofsTech team password, and that person's own six-digit PIN. The shared password alone never opens a session: the `pin-auth` edge function checks it server-side, verifies the PIN against the bcrypt hash in `staff_pins`, then returns a single-use `/invite?token=…` link for the browser to follow.

A person who has not chosen a PIN yet is sent to the private first-time link prepared by an admin. That link opens the app, and the person chooses a PIN before the workspace appears.

Deploy the function after changing it:

```sh
supabase functions deploy pin-auth --project-ref gbkdxrbqkohfbscmooic --no-verify-jwt
```

Five wrong PINs lock the account for 15 minutes. Ten bad attempts from one address in 15 minutes are throttled. The team password and service role key stay in Supabase edge secrets.

## Private invite links

Admins can prepare a private link from the Team page or when adding a new worker. The `invite-staff` edge function asks Supabase for a one-time magic link, then rewrites it to the branded route:

```text
https://earlycomers.vercel.app/invite?token=…&type=magiclink
```

Opening that route verifies the token and signs the staff member in automatically. Links expire after one hour, work once, and are never emailed by the app. `invite.html` marks the page `noindex` and `no-referrer` so the token is not passed to third parties.

Deploy the function after changing it:

```sh
supabase functions deploy invite-staff --project-ref gbkdxrbqkohfbscmooic
```

## PWA kit

The app includes 180, 192, and 512 pixel icons, a maskable icon, standalone display, iPhone metadata, safe area support, local fonts, a service worker, offline navigation, cached QR assets, and persistent offline attendance. Production camera access requires HTTPS.

Staff portraits live in `public/staff/` and are mapped by nickname in `src/Art.elm`. The five current portraits are optimized square JPEGs and are precached by the service worker for offline display. Samuel Akeem (ProofsTech) keeps the custom illustration until a portrait is supplied.

## iPhone installation

1. Deploy the PWA over HTTPS.
2. Open it once in Safari while connected.
3. Open Safari’s Share menu.
4. Choose Add to Home Screen.
5. Open Attendance from the home screen.

After the first connected visit, the interface and saved records work offline. Camera scanning requires permission. Staff check-in is QR only; if camera access is denied, allow it in browser settings and scan the printed office QR again.

## Local configuration

The local office code defaults to `PROOFSTECH-HQ-2026`. Set the `OFFICE_CODE` environment variable to change it. The code is embedded in the office QR and is not shown as a typed check-in fallback. The SQLite database lives in `data/attendance.db` and is intentionally excluded from Git.
