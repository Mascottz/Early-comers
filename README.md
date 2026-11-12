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

On a short iPhone the scanner panel scrolls and the **Scan** button is pinned to the bottom of the panel, so it is reachable even when the preview fills the screen. If the camera cannot open at all, the panel still shows a **Scan** button above the explanation, so the control is never missing.

The scanner never sits silent: the button stays tappable while the camera wakes up, permission and camera errors are shown in plain words, and if the camera has not started within six seconds the panel says so and offers **Try the camera again**.

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

Grace is **fifteen minutes after 09:00**, so 09:15 is on time and 09:16 onward is late. Launch day, **12 November 2026**, kept a thirty minute grace (09:30). Grace is decided per day: an entry from 12 November is measured against 09:30, everything from 13 November against 09:15, which is why old records keep the verdict they were given.

The boss is not watched. `MD` is exempt by default (`EXEMPT_STAFF` in the build environment, comma separated, matched against the profile nickname, case-insensitive). Exempt arrivals are still recorded — they just never carry a Late tag, a fine, or a line in the late record, and the team list shows them as **Not tracked**.

Each late day carries a **₦2,000 fine**. Because attendance allows only one check-in per worker per day, the maximum is one fine per late day. The home summary, the daily wall, and the CSV export all show the status and fine.

Anyone who arrives after the grace period wears a **Late** tag for that whole day: the tag sits beside their name on the daily wall and the home preview, next to their time in the team list and on their own hero card, and the wall lists every late arrival for the day under **Late today**. The tag is tied to the day's record, so yesterday's tag stays on yesterday and today starts clean.

## The late record

Admins get a **Late record** page (desktop nav, or the link at the bottom of the daily wall). It lists every late arrival for one month — date, weekday, person, arrival time, how many minutes past that day's grace, and the fine — with month arrows, a This month shortcut, and totals at the top. It reads straight from Supabase for the selected month (`local_date=gte.…-01&local_date=lte.…-31`), so it works for any month, not just what the app happens to have cached. **Export month CSV** downloads the same month as a spreadsheet.

## Monthly records backup

`.github/workflows/monthly-backup.yml` runs at 03:10 UTC on the first of every month (and on manual dispatch). It calls `scripts/backup_records.py`, which pages through `attendance_entries` and `staff_profiles` with the service role key, writes one CSV per table, keeps them as a workflow artifact for 400 days, and uploads them to the [`records-backup`](https://github.com/Mascottz/Early-comers/releases/tag/records-backup) release so the archive lives outside Supabase.

To switch it on, add two repository secrets: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Project settings → API → service_role). Without them the job only prints a warning. Run it locally with:

```bash
SUPABASE_URL=https://<project>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<key> python3 scripts/backup_records.py
```

## Staying up to date

The app refreshes itself every **10 seconds** while it is signed in and online, and immediately whenever it comes back to the foreground or regains a connection, so a check-in on someone else's phone shows up on the wall without a reload. The connection line at the top shows the age of the last successful sync (`updated 12s ago`). Check-ins made offline are pushed as soon as it refreshes.

iPhone and iPad keep a backgrounded app frozen and can restore it from the back/forward cache without a reload, so the bridge also nudges Elm on `visibilitychange`, `pageshow` and `focus`; the app refetches the moment it comes forward.

An installed attendance app on iPhone has no pull-to-refresh — the gesture belongs to Safari, not to us — so there is an explicit control instead: **tap the connection bar** at the top of any screen, or **Profile → Refresh now**. While the fetch is in flight the bar reads *Refreshing the office records…* with a spinning ring, and it settles back to *updated just now*. Tapping it while offline shows a toast and keeps everything saved. If a refresh cannot finish within nine seconds you get a toast saying nothing was lost, and the background refresh keeps going.

## Records that outlive a season

Every check-in is written to Supabase (`attendance_entries`, one row per person per day, plus `staff_profiles` for the team). The app never deletes rows — a record written in 2026 is still there in 2028.

PostgREST returns at most 1000 rows per request by default, so the app does not try to hold all of history in memory. Instead:

- **Jump to a day** on the Daily wall — the date field (or the `‹` `›` arrows) loads that exact day from Supabase, however old it is.
- **Export month CSV** — exports the whole month that contains the day you are looking at, one Supabase query for the month, so a year's records can be collected twelve months at a time.
- The wall, the team list and the home summary all come from the same rows, so an old day shows the same names, times and Late tags it did on the day.

For a permanent archive, the Supabase dashboard can export the table as CSV at any time, and Postgres backups are on Supabase's paid plans; exporting a month from inside the app is the day-to-day equivalent.

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
