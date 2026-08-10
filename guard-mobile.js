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
