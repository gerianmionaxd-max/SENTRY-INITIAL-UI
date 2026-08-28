<<<<<<< HEAD
/* Guard Portal behavior: mock login, screen navigation, and dynamic QR refresh. */
const loginScreen = document.getElementById('loginScreen');
const phoneApp = document.getElementById('phoneApp');
const toast = document.getElementById('guardToast');
const timer = document.getElementById('qrTimer');
const token = document.getElementById('qrToken');
const qrImage = document.getElementById('dynamicQr');
const qrButton = document.getElementById('refreshQr');
const qrHint = document.getElementById('qrHint');
let seconds = 30;
let qrSequence = 1;
let qrIsActive = false;

document.getElementById('guardLogin').addEventListener('submit', event => {
  event.preventDefault();
  loginScreen.hidden = true;
  phoneApp.hidden = false;
});
document.querySelectorAll('.bottom-nav button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.bottom-nav button').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  button.classList.add('active');
  document.getElementById(button.dataset.screen).classList.add('active');
}));
function refreshQr(showConfirmation = false) {
  if (qrIsActive) return;
  qrIsActive = true;
  seconds = 30;
  qrSequence++;
  const nonce = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  const qrValue = JSON.stringify({ guardId: 'SG-2024-0241', guard: 'Leo Jimenez', purpose: 'attendance', issuedAt: new Date().toISOString(), nonce });
  token.textContent = `QR-LEO-0241-${String(qrSequence).padStart(4, '0')}`;
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&format=png&data=${encodeURIComponent(qrValue)}`;
  qrButton.disabled = true;
  qrButton.querySelector('span').textContent = 'QR active';
  qrHint.textContent = 'Keep this code visible until it is scanned';
  if (showConfirmation) showToast('A new dynamic QR code was generated');
}
function expireQr() {
  qrIsActive = false;
  qrImage.removeAttribute('src');
  token.textContent = 'QR code expired';
  qrHint.textContent = 'Generate a new QR code to time-in or time-out';
  qrButton.disabled = false;
  qrButton.querySelector('span').textContent = 'Generate dynamic QR';
}
function showToast(message) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2400); }
qrButton.addEventListener('click', () => refreshQr(true));
document.getElementById('editProfile').addEventListener('click', () => { document.getElementById('profileModal').hidden = false; });
document.getElementById('closeProfileModal').addEventListener('click', () => { document.getElementById('profileModal').hidden = true; });
document.getElementById('profileModal').addEventListener('click', event => { if (event.target.id === 'profileModal') event.currentTarget.hidden = true; });
document.getElementById('profileForm').addEventListener('submit', event => { event.preventDefault(); document.getElementById('profileModal').hidden = true; showToast('Profile update request submitted'); });
document.getElementById('notifications').addEventListener('click', () => showToast('No new guard notifications'));
timer.textContent = '00:30';
setInterval(() => {
  if (!qrIsActive) return;
  seconds--;
  timer.textContent = `00:${String(Math.max(seconds, 0)).padStart(2, '0')}`;
  if (seconds <= 0) expireQr();
}, 1000);
=======
/* Guard portal interactions. This page is intentionally a front-end demo. */

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const USER_ACCOUNTS_KEY = 'sentryUserAccounts';
const DEMO_GUARD_ACCOUNT = {
  userId: 'SG-2024-0241', username: 'leo', password: 'leojimenez', name: 'Leo Jimenez',
  email: 'leo.jimenez@sentry.ph', post: 'Macario-Catalina Building', image: 'images/LJ.webp', status: 'Active', department: 'Security',
};

function getApprovedGuardAccounts() {
  const savedAccounts = JSON.parse(localStorage.getItem(USER_ACCOUNTS_KEY) || '[]');
  return savedAccounts
    .filter(account => account.status === 'Active' && account.department === 'Security')
    .map(account => ({ ...account, name: account.username, post: 'Mobile attendance portal', image: 'images/1568-logo-1781901055.317-00a3e4-color.webp' }));
}

function initGuardPortal() {
  const toast = $('#guardToast');
  const loginScreen = $('#loginScreen');
  const phoneApp = $('#phoneApp');
  const timer = $('#qrTimer');
  const token = $('#qrToken');
  const qrImage = $('#dynamicQr');
  const qrButton = $('#refreshQr');
  const qrHint = $('#qrHint');
  const loginMessage = $('#guardLoginMessage');
  let currentGuard = DEMO_GUARD_ACCOUNT;
  let secondsRemaining = 30;
  let sequence = 0;
  let isQrActive = false;
  let toastTimeout;

  const showToast = message => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2400);
  };
  const updateTimer = () => { timer.textContent = `00:${String(Math.max(secondsRemaining, 0)).padStart(2, '0')}`; };
  const expireQr = () => {
    isQrActive = false;
    qrImage.removeAttribute('src');
    token.textContent = 'QR code expired';
    qrHint.textContent = 'Generate a new QR code to time-in or time-out';
    qrButton.disabled = false;
    $('span', qrButton).textContent = 'Generate dynamic QR';
  };
  const refreshQr = () => {
    if (isQrActive) return;
    isQrActive = true;
    secondsRemaining = 30;
    sequence += 1;
    const nonce = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
    const value = JSON.stringify({ guardId: currentGuard.userId, guard: currentGuard.name, purpose: 'attendance', issuedAt: new Date().toISOString(), nonce });
    token.textContent = `QR-${currentGuard.userId}-${String(sequence).padStart(4, '0')}`;
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&format=png&data=${encodeURIComponent(value)}`;
    qrButton.disabled = true;
    $('span', qrButton).textContent = 'QR active';
    qrHint.textContent = 'Keep this code visible until it is scanned';
    updateTimer();
    showToast('A new dynamic QR code was generated');
  };

  const renderGuardProfile = () => {
    $('#guardWelcomeName').textContent = currentGuard.name;
    $('#guardWelcomeId').textContent = currentGuard.userId;
    $('#guardWelcomeImage').src = currentGuard.image;
    $('#guardWelcomeImage').alt = `${currentGuard.name} profile`;
    $('#guardProfileName').textContent = currentGuard.name;
    $('#guardProfileId').textContent = currentGuard.userId;
    $('#guardProfilePost').textContent = currentGuard.post;
    $('#guardProfileEmail').textContent = currentGuard.email;
    $('#guardProfileImage').src = currentGuard.image;
    $('#guardProfileImage').alt = `${currentGuard.name} profile`;
  };

  $('#guardLogin').addEventListener('submit', event => {
    event.preventDefault();
    const identity = $('#guardIdentity').value.trim().toLowerCase();
    const password = $('#guardPassword').value;
    const guard = [DEMO_GUARD_ACCOUNT, ...getApprovedGuardAccounts()].find(account => account.username.toLowerCase() === identity || account.email.toLowerCase() === identity);
    if (!guard || guard.password !== password) {
      loginMessage.textContent = 'Invalid username/email or password.';
      return;
    }
    if (guard.expirationDate && guard.expirationDate < new Date().toISOString().slice(0, 10)) {
      loginMessage.textContent = 'Your account access has expired. Please contact the administrator.';
      return;
    }
    currentGuard = guard;
    renderGuardProfile();
    loginScreen.hidden = true;
    phoneApp.hidden = false;
  });
  $$('.bottom-nav button').forEach(button => button.addEventListener('click', () => {
    $$('.bottom-nav button').forEach(item => item.classList.toggle('active', item === button));
    $$('.screen').forEach(screen => screen.classList.toggle('active', screen.id === button.dataset.screen));
  }));
  qrButton.addEventListener('click', refreshQr);
  $('#editProfile').addEventListener('click', () => { $('#profileModal').hidden = false; });
  $('#closeProfileModal').addEventListener('click', () => { $('#profileModal').hidden = true; });
  $('#profileModal').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.hidden = true; });
  $('#profileForm').addEventListener('submit', event => { event.preventDefault(); $('#profileModal').hidden = true; showToast('Profile update request submitted'); });
  $('#notifications').addEventListener('click', () => showToast('No new guard notifications'));
  renderGuardProfile();
  updateTimer();
  setInterval(() => {
    if (!isQrActive) return;
    secondsRemaining -= 1;
    updateTimer();
    if (secondsRemaining <= 0) expireQr();
  }, 1000);
}

document.addEventListener('DOMContentLoaded', initGuardPortal);
>>>>>>> 70fdd62 (updated source codes hehe)
