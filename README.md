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
- Daily dated office QR, printable every morning
- CSV attendance export
- Installable iPhone PWA with local fonts and cached application assets
- Staff portraits for Merciful, MD, Mascott, FundsTech, and IB China, with custom illustrations for everyone else
- A responsive organic interface

Admin access cannot be selected in the interface. Production admin status comes only from a verified email in the protected Supabase `admin_emails` table.

The typed office-code fallback has been removed. The printed pass now carries the current Africa/Lagos date, so a pass from yesterday is rejected and a fresh one must be printed each morning. A photo of today's pass can still be used remotely, so daily rotation limits reuse but does not prove physical presence; a rotating on-screen pass or location checks would be needed for stronger verification.

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
4. Test the email + team password + PIN page, including a first-time email, on an installed iPhone PWA.

## Signing in

The sign-in page accepts only emails that already exist in `staff_profiles`. It asks for the approved email, the shared ProofsTech team password, and that person's own six-digit PIN. The shared password alone never opens a session: the `pin-auth` edge function checks it server-side, verifies the PIN against the bcrypt hash in `staff_pins`, then returns a single-use `/invite?token=…` link for the browser to follow.

There is no separate PIN setup screen. On an approved email's first sign-in, the six digits entered become that person's PIN; every later sign-in must match it. Because the team password is shared, have each person claim their email promptly.

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

### Scanning at the door

Opening **Scan** starts a live camera preview with a square box in the middle. Nothing is read until you press **Scan** — the preview alone never checks anyone in.

When you press Scan, the app captures only the pixels inside the box and tries to decode them:

- If the pass sits completely inside the box, the check-in is recorded and the camera closes.
- If part of the pass is outside the box, the code is cut off and cannot decode, so the app says so and keeps looking. Move the phone back until the whole code fits, then tap Scan again.
- Press **Stop** to cancel, or close the panel.

On browsers with the native `BarcodeDetector` API (Android Chrome) the bounding box is also checked directly; elsewhere `html5-qrcode` decodes the cropped frame, so a half-visible code still fails.

## Install video

`video/` is a [Remotion](https://remotion.dev) project that renders a 35-second 3D explainer showing how to install the app on iPhone (Safari → Share → Add to Home Screen) and Android (Chrome → ⋮ → Add to Home screen).

```bash
cd video
npm install
npm run studio   # live preview
npm run render   # out/attendance-install.mp4
```

The **Install video** workflow (`.github/workflows/install-video.yml`) renders the MP4 on every push to `main` that touches `video/`, and on manual dispatch. Each run uploads the file as the `attendance-install-video` artifact (kept 90 days) and refreshes the permanent download at [`releases/tag/install-video-latest`](https://github.com/Mascottz/Early-comers/releases/tag/install-video-latest).

The same project also renders a narrated ~72 second brand ad (`AdVideo`): `npm run render:ad` locally, or the **Ad video** workflow, which publishes [`releases/tag/ad-video-latest`](https://github.com/Mascottz/Early-comers/releases/tag/ad-video-latest) and the `attendance-ad-video` artifact.

Brand fonts are vendored in `video/public/fonts/` with their SIL Open Font License files, so the render needs no network access.

## Lateness and fines

The grace period ends at **09:30** local time. A check-in at 09:30 is on time; 09:31 onward is late.

Each late day carries a **₦2,000 fine**. Because attendance allows only one check-in per worker per day, the maximum is one fine per late day. The home summary, the daily wall, and the CSV export all show the status and fine.

## Daily office pass

ProofsTech HQ is in Abuja, Nigeria. The office pass uses the Africa/Lagos timezone (WAT, UTC+1), which is the correct timezone identifier for Nigeria.

`/api/qr.svg` always generates the pass for the current date in Africa/Lagos. The payload looks like:

```text
proofstech://attendance?office=PROOFSTECH-HQ-2026&day=2026-11-11
```

The app accepts a pass only when both the office code and today's date match. Print a fresh pass from **Office QR** each morning and remove yesterday's sheet. If a pass is left up overnight, the next morning's scan is rejected with “That office pass is from another day.”

`/api/qr.svg` is never cached by the service worker, and the Office QR image is requested with the current day, so a screen left open refreshes at midnight.

## Local configuration

The local office code defaults to `PROOFSTECH-HQ-2026`. Set the `OFFICE_CODE` environment variable to change it. The code is embedded in the office QR and is not shown as a typed check-in fallback. The SQLite database lives in `data/attendance.db` and is intentionally excluded from Git.
