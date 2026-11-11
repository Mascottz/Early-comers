# Attendance install video

Remotion explainer: how to put **Attendance by ProofsTech** on an iPhone and Android home screen.

- 1920×1080, 30 fps, ~35 s, H.264 with no audio track
- Composition id `InstallVideo`
- Output `out/attendance-install.mp4`

## Commands

```bash
npm install
npm run studio    # Remotion Studio preview
npm run typecheck
npm run render    # full MP4 render
npm run still     # single poster frame -> out/poster.png
```

Remotion downloads its own `chrome-headless-shell` on first render (`npx remotion browser ensure`). If Chrome is already on the machine, point Remotion at it:

```bash
REMOTION_BROWSER_EXECUTABLE=/path/to/chrome npm run still
```

## Structure

| File | Purpose |
| --- | --- |
| `src/Root.tsx` | registers the `InstallVideo` composition |
| `src/InstallVideo.tsx` | scene order and transitions |
| `src/timeline.ts` | scene durations, size, fps |
| `src/scenes/IntroScene.tsx` | title card |
| `src/scenes/IphoneScene.tsx` | Safari share sheet → Add to Home Screen |
| `src/scenes/AndroidScene.tsx` | Chrome ⋮ menu → Add to Home screen |
| `src/scenes/OutroScene.tsx` | recap + `earlycomers.vercel.app` |
| `src/Phone.tsx` | CSS-3D phone frame, status bar, icons |
| `src/screens/*` | in-phone mock UI (site page, share sheet, home screen) |
| `src/components/*` | instruction panel, callouts, scene background |
| `src/theme.ts` | brand colours and font stacks |

## Fonts

`public/fonts/` holds Bricolage Grotesque (600/700) and DM Sans (400/500) as `.woff2`, copied from the PWA's `public/fonts/`. Both are licensed under the SIL Open Font License; the licence files are vendored next to them and must stay there when the fonts are redistributed (for example inside the rendered MP4).

## CI

`.github/workflows/install-video.yml` runs on pushes to `main` touching `video/` and via **Run workflow**. It installs dependencies with `npm ci`, typechecks, ensures headless Chrome, renders, uploads the `attendance-install-video` artifact, and updates the `install-video-latest` GitHub Release with the MP4.
