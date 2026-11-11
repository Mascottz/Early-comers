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
    origin: window.location.origin
  }
})

app.ports.saveSession.subscribe(value => {
  localStorage.setItem('proofstech-session-v1', value)
})

app.ports.clearSession.subscribe(() => {
  localStorage.removeItem('proofstech-session-v1')
  localStorage.removeItem('proofstech-attendance-v2')
})

let scanner = null
let stopping = false

app.ports.saveLocal.subscribe(value => {
  try {
    localStorage.setItem('proofstech-attendance-v2', value)
  } catch (error) {
    app.ports.scannerMessage.send('storage-error')
  }
})

app.ports.startScanner.subscribe(async () => {
  try {
    if (!window.isSecureContext) throw new Error('Camera access needs HTTPS')
    if (scanner) await scanner.clear()
    scanner = new Html5Qrcode('camera-surface', {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false
    })
    await scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: (width, height) => {
          const edge = Math.floor(Math.min(width, height) * 0.72)
          return { width: edge, height: edge }
        }
      },
      decoded => {
        if (!stopping) {
          stopping = true
          app.ports.scanDecoded.send(decoded)
        }
      },
      () => {}
    )
    stopping = false
    app.ports.scannerMessage.send('ready')
  } catch (error) {
    app.ports.scannerMessage.send(error && error.message ? error.message : 'Camera unavailable')
  }
})

app.ports.stopScanner.subscribe(async () => {
  stopping = true
  try {
    if (scanner && scanner.isScanning) await scanner.stop()
    if (scanner) await scanner.clear()
  } catch (_) {}
  scanner = null
})

app.ports.downloadQr.subscribe(async () => {
  try {
    const response = await fetch('/api/qr.svg')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'proofstech-office-qr.svg'
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
