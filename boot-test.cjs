const fs = require('fs');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  url: 'https://earlycomers.vercel.app/',
  runScripts: 'outside-only',
  pretendToBeVisual: true
});
const { window } = dom;

window.ATTENDANCE_CONFIG = { supabaseUrl: '', supabaseKey: '', officeCode: 'PROOFSTECH-HQ-2026' };
window.eval(fs.readFileSync('public/app.js', 'utf8'));
console.log('Elm loaded:', typeof window.Elm);

// minimal camera + qr library stubs
window.isSecureContext = true;
const track = { stop(){}, applyConstraints: async () => {} };
Object.defineProperty(window.navigator, 'mediaDevices', {
  value: { getUserMedia: async () => ({ getTracks: () => [track], getVideoTracks: () => [track] }) },
  configurable: true
});
window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
Object.defineProperty(window.HTMLMediaElement.prototype, 'videoWidth', { get: () => 1280 });
Object.defineProperty(window.HTMLMediaElement.prototype, 'videoHeight', { get: () => 720 });
Object.defineProperty(window.HTMLMediaElement.prototype, 'readyState', { get: () => 4 });
window.HTMLMediaElement.prototype.pause = function () {};
window.Html5Qrcode = function () {
  this.scanFileV2 = async () => { throw new Error('no code'); };
  this.stop = async () => {};
  this.clear = () => {};
};
window.Html5QrcodeSupportedFormats = { QR_CODE: 0 };

window.eval(fs.readFileSync('public/browser.js', 'utf8'));

setTimeout(() => {
  const doc = window.document;
  const scanNav = doc.querySelector('.nav-scan-link') || doc.querySelector('.mobile-scan');
  console.log('scan nav found:', !!scanNav);
  if (scanNav) scanNav.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  setTimeout(() => {
    console.log('overlay:', !!doc.querySelector('.scanner-overlay'));
    console.log('panel:', !!doc.querySelector('.scanner-panel'));
    console.log('camera surface:', !!doc.getElementById('camera-surface'));
    console.log('scan frame:', !!doc.querySelector('[data-scan-frame]'));
    const btn = doc.querySelector('.scan-button');
    console.log('scan button:', btn ? btn.textContent : 'MISSING');
    console.log('caption:', doc && doc.querySelector('.camera-caption') && doc.querySelector('.camera-caption').textContent);
    const video = doc.querySelector('#camera-surface video');
    console.log('video in surface:', !!video);
    const armBtn = doc.querySelector('.scan-button');
    console.log('button now:', armBtn && armBtn.textContent);
    if (armBtn) armBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    setTimeout(() => {
      console.log('AFTER CLICK button:', doc.querySelector('.scan-button') && doc.querySelector('.scan-button').textContent);
      console.log('armed class:', !!doc.querySelector('.scan-frame.is-armed'));
      console.log('hint:', doc.querySelector('.scan-hint') && doc.querySelector('.scan-hint').textContent);
      process.exit(0);
    }, 400);
    console.log('body text sample:', doc.body.textContent.slice(0, 160).replace(/\s+/g, ' '));
  }, 900);
}, 400);
