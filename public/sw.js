const CACHE = 'attendance-v8'
const CORE = [
  '/', '/index.html', '/styles.css', '/app.js', '/browser.js',
  '/manifest.webmanifest', '/runtime-config.js', '/favicon.svg', '/apple-touch-icon.png',
  '/pwa-192.png', '/pwa-512.png', '/offline.html', '/invite.html',
  '/staff/merciful.jpg', '/staff/md.jpg', '/staff/mascott.jpg',
  '/staff/fundstech.jpg', '/staff/ib-china.jpg',
  '/vendor/html5-qrcode.min.js',
  '/fonts/bricolage-grotesque-latin-600-normal.woff2',
  '/fonts/bricolage-grotesque-latin-700-normal.woff2',
  '/fonts/dm-sans-latin-400-normal.woff2',
  '/fonts/dm-sans-latin-500-normal.woff2'
]

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return
  if (request.mode === 'navigate') {
    const path = new URL(request.url).pathname
    const isInvite = path === '/invite' || path === '/invite.html'
    event.respondWith(
      fetch(request)
        .then(response => {
          if (!isInvite) {
            const copy = response.clone()
            caches.open(CACHE).then(cache => cache.put('/index.html', copy))
          }
          return response
        })
        .catch(() => {
          const fallback = isInvite ? caches.match('/invite.html') : caches.match('/index.html')
          return fallback.then(response => response || caches.match('/offline.html'))
        })
    )
    return
  }
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok && new URL(request.url).origin === self.location.origin) {
          const copy = response.clone()
          caches.open(CACHE).then(cache => cache.put(request, copy))
        }
        return response
      }).catch(() => cached)
      return cached || network
    })
  )
})
