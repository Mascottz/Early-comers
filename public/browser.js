const saved = localStorage.getItem('proofstech-attendance-v2')
const hash = new URLSearchParams(window.location.hash.slice(1))
let callbackSession = null
if (hash.get('access_token')) {
  callbackSession = JSON.stringify({
    access_token: hash.get('access_token'),
    refresh_token: hash.get('refresh_token'),
    expires_at: Math.floor(Date.now() / 1000) + Number(hash.get('expires_in') || 3600),
    user: { id: '', email: '' }
  })
  localStorage.setItem('proofstech-session-v1', callbackSession)
  history.replaceState(null, '', window.location.pathname + window.location.search)
}
const session = callbackSession || localStorage.getItem('proofstech-session-v1')
const config = window.ATTENDANCE_CONFIG || {}
const now = new Date()
const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const app = Elm.Main.init({
  node: document.getElementById('app'),
  flags: {
    saved,
    session,
    today: localDate,
    now: now.getTime(),
    online: navigator.onLine,
    supabaseUrl: config.supabaseUrl || '',
    supabaseKey: config.supabaseKey || '',
    officeCode: config.officeCode || '',
    exemptStaff: config.exemptStaff || '',
    origin: window.location.origin
  }
})

// iOS keeps a standalone PWA suspended in the background: timers stop and the
// page can come back from the bfcache without a reload. Nudge Elm to refetch
// whenever the app is brought forward again.
function nudgeRefresh() {
  try {
    app.ports.appActive.send(null)
  } catch (_) {}
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') nudgeRefresh()
})
window.addEventListener('pageshow', event => {
  if (event.persisted) nudgeRefresh()
})
window.addEventListener('focus', nudgeRefresh)
window.addEventListener('online', nudgeRefresh)

app.ports.saveSession.subscribe(value => {
  localStorage.setItem('proofstech-session-v1', value)
})

app.ports.clearSession.subscribe(() => {
  localStorage.removeItem('proofstech-session-v1')
  localStorage.removeItem('proofstech-attendance-v2')
})

app.ports.saveLocal.subscribe(value => {
  try {
    localStorage.setItem('proofstech-attendance-v2', value)
  } catch (error) {
    app.ports.scannerMessage.send('storage-error')
  }
})

let cameraSession = null
let scanRequest = 0
let scanDecoder = null
let nativeDetector = null

function waitForElement(id, timeout = 6000) {
  const existing = document.getElementById(id)
  if (existing) return Promise.resolve(existing)
  return new Promise((resolve, reject) => {
    const started = Date.now()
    const look = () => {
      const element = document.getElementById(id)
      if (element) return resolve(element)
      if (Date.now() - started > timeout) {
        return reject(new Error('The camera view did not open. Close the scanner and tap Scan again.'))
      }
      setTimeout(look, 100)
    }
    setTimeout(look, 100)
  })
}

function waitForVideo(video, timeout = 4000) {
  if (video.videoWidth > 0 && video.videoHeight > 0) return Promise.resolve(true)
  return new Promise(resolve => {
    const started = Date.now()
    const look = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) return resolve(true)
      if (Date.now() - started > timeout) return resolve(false)
      setTimeout(look, 100)
    }
    setTimeout(look, 100)
  })
}

// Nothing in the scanner may fail silently: any stray error while the overlay is
// open is reported back to Elm so the user always sees a reaction.
function reportToElm(text) {
  try {
    app.ports.scannerMessage.send(text)
  } catch (_) {}
}

function reportUnexpected(error) {
  if (!document.getElementById('camera-surface')) return
  const detail = (error && (error.name || error.message)) || String(error || 'unknown')
  reportToElm('Scanner error: ' + String(detail).slice(0, 160))
}

window.addEventListener('error', event => reportUnexpected(event.error || event.message))
window.addEventListener('unhandledrejection', event => reportUnexpected(event.reason))

function cameraErrorMessage(error) {
  const name = (error && error.name) || ''
  const message = (error && error.message) || 'Camera unavailable'
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Camera permission is off. Allow camera access in your browser settings, then scan again.'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'This device has no usable camera. Open Attendance on a phone, then scan.'
  if (name === 'NotReadableError' || name === 'AbortError') return 'Another app is using the camera. Close it, then try again.'
  return message
}

async function teardownCamera() {
  const session = cameraSession
  cameraSession = null
  if (!session) return
  session.armed = false
  clearTimeout(session.tick)
  clearTimeout(session.deadline)
  try {
    session.stream.getTracks().forEach(track => track.stop())
  } catch (_) {}
  try {
    session.video.pause()
    session.video.srcObject = null
    session.video.remove()
  } catch (_) {}
}

function ensureDecoderHolder() {
  let holder = document.getElementById('scan-decoder-holder')
  if (!holder) {
    holder = document.createElement('div')
    holder.id = 'scan-decoder-holder'
    holder.className = 'scan-decoder-holder'
    document.body.appendChild(holder)
  }
  return holder
}

async function getNativeDetector() {
  if (nativeDetector !== null) return nativeDetector
  try {
    if (typeof window.BarcodeDetector === 'undefined') {
      nativeDetector = false
      return nativeDetector
    }
    const formats = (await window.BarcodeDetector.getSupportedFormats?.()) || []
    if (formats.length && !formats.includes('qr_code')) {
      nativeDetector = false
      return nativeDetector
    }
    nativeDetector = new window.BarcodeDetector({ formats: ['qr_code'] })
  } catch (_) {
    nativeDetector = false
  }
  return nativeDetector
}

function ensureDecoder() {
  if (scanDecoder) return scanDecoder
  ensureDecoderHolder()
  scanDecoder = new Html5Qrcode('scan-decoder-holder', {
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    verbose: false
  })
  return scanDecoder
}

/** Grab only the pixels inside the on-screen scan box, so a half-visible code cannot decode. */
function captureScanBox() {
  const session = cameraSession
  if (!session) return null
  const video = session.video
  if (!video || video.readyState < 2) return null
  const videoWidth = video.videoWidth
  const videoHeight = video.videoHeight
  if (!videoWidth || !videoHeight) return null

  const viewRect = video.getBoundingClientRect()
  if (!viewRect.width || !viewRect.height) return null

  const scale = Math.max(viewRect.width / videoWidth, viewRect.height / videoHeight)
  const drawnWidth = videoWidth * scale
  const drawnHeight = videoHeight * scale
  const offsetX = (viewRect.width - drawnWidth) / 2
  const offsetY = (viewRect.height - drawnHeight) / 2

  let sourceX = 0
  let sourceY = 0
  let sourceWidth = videoWidth
  let sourceHeight = videoHeight

  const frame = document.querySelector('[data-scan-frame]')
  if (frame) {
    const frameRect = frame.getBoundingClientRect()
    const inset = frameRect.width * 0.035
    sourceX = (frameRect.left - viewRect.left + inset - offsetX) / scale
    sourceY = (frameRect.top - viewRect.top + inset - offsetY) / scale
    sourceWidth = (frameRect.width - inset * 2) / scale
    sourceHeight = (frameRect.height - inset * 2) / scale
  }

  sourceX = Math.max(0, sourceX)
  sourceY = Math.max(0, sourceY)
  sourceWidth = Math.min(sourceWidth, videoWidth - sourceX)
  sourceHeight = Math.min(sourceHeight, videoHeight - sourceY)
  if (sourceWidth < 60 || sourceHeight < 60) return null

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(sourceWidth)
  canvas.height = Math.round(sourceHeight)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height)
  return canvas
}

function canvasToFile(canvas) {
  return new Promise(resolve => {
    canvas.toBlob(
      blob => {
        if (!blob) return resolve(null)
        resolve(new File([blob], 'office-pass.jpg', { type: blob.type || 'image/jpeg' }))
      },
      'image/jpeg',
      0.92
    )
  })
}

async function decodeCanvas(canvas) {
  const detector = await getNativeDetector()
  if (detector) {
    try {
      const codes = await detector.detect(canvas)
      if (codes && codes.length) {
        const found = codes[0]
        const box = found.boundingBox
        if (box) {
          const margin = 4
          const spills =
            box.x <= margin ||
            box.y <= margin ||
            box.x + box.width >= canvas.width - margin ||
            box.y + box.height >= canvas.height - margin
          if (spills) return { outside: true }
        }
        if (found.rawValue) return { text: found.rawValue }
      }
    } catch (_) {}
    return null
  }

  const file = await canvasToFile(canvas)
  if (!file) return null
  try {
    const result = await ensureDecoder().scanFileV2(file, false)
    if (result && result.decodedText) return { text: result.decodedText }
  } catch (_) {}
  return null
}

function stopScanLoop(reason) {
  const session = cameraSession
  if (!session) return
  session.armed = false
  clearTimeout(session.tick)
  clearTimeout(session.deadline)
  if (reason) app.ports.scannerMessage.send(reason)
}

async function scanTick() {
  const session = cameraSession
  if (!session || !session.armed) return
  const canvas = captureScanBox()
  if (canvas) {
    const outcome = await decodeCanvas(canvas)
    if (!cameraSession || !session.armed) return
    if (outcome && outcome.outside) {
      app.ports.scannerMessage.send('outside-frame')
    } else if (outcome && outcome.text) {
      stopScanLoop(null)
      app.ports.scanDecoded.send(outcome.text)
      return
    }
  }
  session.tick = setTimeout(scanTick, 180)
}

app.ports.armScanner.subscribe(async () => {
  const session = cameraSession
  if (!session) return
  try {
    if (session.video && session.video.paused) await session.video.play()
  } catch (_) {}
  session.armed = true
  app.ports.scannerMessage.send('armed')
  clearTimeout(session.deadline)
  session.deadline = setTimeout(() => {
    if (cameraSession === session && session.armed) stopScanLoop('scan-timeout')
  }, 25000)
  scanTick()
})

app.ports.disarmScanner.subscribe(() => {
  stopScanLoop('paused')
})

app.ports.startScanner.subscribe(async () => {
  const request = ++scanRequest
  let settled = false
  const settle = message => {
    if (settled || request !== scanRequest) return
    settled = true
    reportToElm(message)
  }

  try {
    if (!window.isSecureContext) throw new Error('Camera access needs HTTPS. Open the site over https, then scan.')
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('This browser cannot open the camera. Use Safari on iPhone or Chrome on Android.')
    }

    // iOS only shows the camera prompt for a call made inside the tap itself, so
    // ask for the stream before waiting on the overlay to render.
    const streamPromise = navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    })
    streamPromise.catch(() => {})

    const surface = await waitForElement('camera-surface')
    if (request !== scanRequest) {
      streamPromise.then(stream => stream.getTracks().forEach(track => track.stop())).catch(() => {})
      return
    }

    teardownCamera()
    const stream = await streamPromise
    if (request !== scanRequest) {
      stream.getTracks().forEach(track => track.stop())
      return
    }

    const track = stream.getVideoTracks()[0]
    if (track && track.applyConstraints) {
      try {
        await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] })
      } catch (_) {}
    }
    if (request !== scanRequest) {
      stream.getTracks().forEach(t => t.stop())
      return
    }

    const video = document.createElement('video')
    video.setAttribute('playsinline', 'true')
    video.setAttribute('webkit-playsinline', 'true')
    video.setAttribute('autoplay', 'true')
    video.muted = true
    video.playsInline = true
    video.srcObject = stream
    surface.innerHTML = ''
    surface.appendChild(video)

    cameraSession = { stream, video, armed: false, tick: null, deadline: null, request }

    // Attach first, then let the preview settle: never block the Scan button on
    // video metadata, which can take a moment (or never arrive on some Androids).
    try {
      await video.play()
    } catch (_) {}
    settle('ready')
    waitForVideo(video)
    getNativeDetector()
  } catch (error) {
    settle(cameraErrorMessage(error))
  } finally {
    if (!settled) {
      settle('The camera did not start. Close the scanner and tap Scan again.')
    }
  }
})

app.ports.stopScanner.subscribe(async () => {
  scanRequest += 1
  await teardownCamera()
})

app.ports.downloadQr.subscribe(async () => {
  try {
    const response = await fetch(`/api/qr.svg?day=${localDate}`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `proofstech-office-qr-${localDate}.svg`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (_) {
    app.ports.scannerMessage.send('download-error')
  }
})

app.ports.printQr.subscribe(() => window.print())

app.ports.exportCsv.subscribe(csv => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `proofstech-attendance-${localDate}.csv`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
})

app.ports.openLink.subscribe(url => {
  try {
    const target = new URL(url, window.location.origin)
    if (target.origin !== window.location.origin) return
    window.location.assign(target.href)
  } catch (_) {}
})

app.ports.copyInviteLink.subscribe(async text => {
  try {
    await navigator.clipboard.writeText(text)
    app.ports.linkCopied.send(true)
  } catch (_) {
    app.ports.linkCopied.send(false)
  }
})

window.addEventListener('online', () => app.ports.onlineChanged.send(true))
window.addEventListener('offline', () => app.ports.onlineChanged.send(false))

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}
