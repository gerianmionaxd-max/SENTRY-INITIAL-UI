/* ==========================================================
   1. ATTENDANCE FILTERS AND QR SEARCH
   Controls the attendance table without reloading the page.
========================================================== */
const filters = document.querySelectorAll('.filter');
const rows = document.querySelectorAll('#attendanceRows tr');
const toast = document.getElementById('toast');

filters.forEach(filter => filter.addEventListener('click', () => {
  filters.forEach(item => item.classList.remove('active'));
  filter.classList.add('active');
  const status = filter.dataset.filter;
  rows.forEach(row => row.style.display = status === 'all' || row.dataset.status === status ? '' : 'none');
}));

/* ==========================================================
   2. QR CAMERA SCANNER
   Requests camera permission and displays the live preview.
========================================================== */
const scannerModal = document.getElementById('scannerModal');
const scannerVideo = document.getElementById('scannerVideo');
const scannerMessage = document.getElementById('scannerMessage');
let scannerStream;
async function launchScanner() {
  scannerModal.hidden = false;
  scannerMessage.textContent = 'Requesting camera access…';
  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    scannerVideo.srcObject = scannerStream;
    scannerMessage.textContent = 'Position the guard’s QR code within the frame.';
  } catch (error) {
    scannerMessage.textContent = 'Camera access was not available. Please allow camera permission and try again.';
  }
}
function closeScanner() {
  if (scannerStream) scannerStream.getTracks().forEach(track => track.stop());
  scannerStream = undefined;
  scannerVideo.srcObject = null;
  scannerModal.hidden = true;
}
document.getElementById('quickScan').addEventListener('click', launchScanner);
document.getElementById('closeScanner').addEventListener('click', closeScanner);
scannerModal.addEventListener('click', event => { if (event.target === scannerModal) closeScanner(); });
document.getElementById('viewAll').addEventListener('click', () => showAllProfiles());

/* ==========================================================
   3. PERSONNEL CARD CAROUSEL
   Moves the on-duty cards left and right.
========================================================== */
const staffTrack = document.getElementById('staffTrack');
const staffNext = document.getElementById('staffNext');
const staffPrev = document.getElementById('staffPrev');
function updateCarouselControls() {
  const maxScroll = staffTrack.scrollWidth - staffTrack.clientWidth;
  staffPrev.disabled = staffTrack.scrollLeft <= 2;
  staffNext.disabled = maxScroll <= 2 || staffTrack.scrollLeft >= maxScroll - 2;
}
function staffStep() {
  const card = staffTrack.querySelector('.staff-card');
  return card ? card.offsetWidth + 16 : 260;
}
staffNext.addEventListener('click', () => staffTrack.scrollBy({ left: staffStep(), behavior: 'smooth' }));
staffPrev.addEventListener('click', () => staffTrack.scrollBy({ left: -staffStep(), behavior: 'smooth' }));
staffTrack.addEventListener('scroll', updateCarouselControls);
window.addEventListener('resize', updateCarouselControls);
updateCarouselControls();

const qrSearch = document.getElementById('qrSearch');
const qrSearchBtn = document.getElementById('qrSearchBtn');
function searchByQr() {
  const query = qrSearch.value.trim().toUpperCase();
  filters.forEach(item => item.classList.remove('active'));
  let matches = 0;
  rows.forEach(row => {
    const match = !query || row.dataset.qr.includes(query);
    row.style.display = match ? '' : 'none';
    if (match) matches++;
  });
  toast.textContent = query ? (matches ? `${matches} guard record found for ${query}` : `No guard record found for ${query}`) : 'Showing all guard attendance records';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}
qrSearchBtn.addEventListener('click', searchByQr);
qrSearch.addEventListener('keydown', event => { if (event.key === 'Enter') searchByQr(); });

/* ==========================================================
   4. GUARD PROFILE DATA AND POP-UPS
   This mock data is shown when a profile button is clicked.
========================================================== */
const guards = {
  ramon: { name: 'Ramon Santos', id: 'SG-2024-0182', post: 'Trinitarian Centre', assignment: 'Main Gate · Day shift', phone: '+63 917 555 0182', email: 'ramon.santos@sentry.ph', status: 'On duty', image: 'images/SP.jpg' },
  ricardo: { name: 'Ricardo Williams', id: 'SG-2024-0097', post: 'Trinidad Complex', assignment: 'Lobby post · Day shift', phone: '+63 917 555 0097', email: 'ricardo.williams@sentry.ph', status: 'On duty', image: 'images/RW.png' },
  leo: { name: 'Leo Jimenez', id: 'SG-2024-0241', post: 'Macario-Catalina Building', assignment: 'Gate post · Day shift', phone: '+63 917 555 0241', email: 'leo.jimenez@sentry.ph', status: 'Late arrival', image: 'images/LJ.webp' },
  juan: { name: 'Juan Flores', id: 'SG-2024-0064', post: 'Trinitarian Centre', assignment: 'Loading Bay · Day shift', phone: '+63 917 555 0064', email: 'juan.flores@sentry.ph', status: 'On duty', image: 'images/JF.png' },
  kevin: { name: 'Kevin Silva', id: 'SG-2024-0156', post: 'JTA Building', assignment: 'Perimeter post · Night shift', phone: '+63 917 555 0156', email: 'kevin.silva@sentry.ph', status: 'Absent', image: 'images/KS.jpg' }
};

const profileModal = document.getElementById('profileModal');
const profileDetails = document.getElementById('profileDetails');
const profileName = document.getElementById('profileName');
const profileImage = document.getElementById('profileImage');
const profileStatus = document.getElementById('profileStatus');
function showProfile(id) {
  const guard = guards[id];
  if (!guard) return;
  profileName.textContent = guard.name;
  profileImage.src = guard.image;
  profileImage.alt = `${guard.name} profile photo`;
  profileStatus.textContent = `● ${guard.status}`;
  profileDetails.className = 'profile-details';
  profileDetails.innerHTML = [
    ['Guard ID', guard.id], ['Assigned post', guard.post], ['Assignment', guard.assignment],
    ['Contact number', guard.phone], ['Email address', guard.email], ['Registration status', 'Verified guard']
  ].map(([label, value]) => `<div class="profile-detail"><span>${label}</span><strong>${value}</strong></div>`).join('');
  profileModal.hidden = false;
}
function showAllProfiles() {
  profileName.textContent = 'Registered guards';
  profileImage.src = 'images/1568-logo-1781901055.317-00a3e4-color.webp';
  profileImage.alt = 'Sentry logo';
  profileStatus.textContent = `${Object.keys(guards).length} guard records`;
  profileDetails.className = 'profile-details all-guards';
  profileDetails.innerHTML = Object.values(guards).map(guard => `<div class="guard-summary"><img src="${guard.image}" alt=""><div><strong>${guard.name}</strong><small>${guard.id} · ${guard.post}</small></div></div>`).join('');
  profileModal.hidden = false;
}
document.querySelectorAll('.profile-button').forEach(button => button.addEventListener('click', () => showProfile(button.dataset.guard)));
function closeProfile() { profileModal.hidden = true; }
document.getElementById('closeProfile').addEventListener('click', closeProfile);
profileModal.addEventListener('click', event => { if (event.target === profileModal) closeProfile(); });

/* ==========================================================
   5. MOCK LOGIN / SIGN-UP SCREEN
   For demonstration only: form submission opens the dashboard.
========================================================== */
const authScreen = document.getElementById('authScreen');
const authForm = document.getElementById('authForm');
const toggleAuth = document.getElementById('toggleAuth');
const authTitle = document.getElementById('authTitle');
const authCopy = document.getElementById('authCopy');
const authSubmit = document.getElementById('authSubmit');
const authSwitch = document.getElementById('authSwitch');
const nameField = document.getElementById('nameField');
const authName = document.getElementById('authName');
const authMessage = document.getElementById('authMessage');
let signingUp = false;

function setAuthMode(signup) {
  signingUp = signup;
  authTitle.textContent = signup ? 'Create your account' : 'Welcome back';
  authCopy.textContent = signup ? 'Register to access the attendance dashboard.' : 'Sign in to access the attendance dashboard.';
  authSubmit.textContent = signup ? 'Create account' : 'Log in';
  nameField.hidden = !signup;
  authName.required = signup;
  authSwitch.innerHTML = signup ? 'Already registered? <button type="button" id="toggleAuth">Log in</button>' : 'New to Sentry? <button type="button" id="toggleAuth">Sign up</button>';
  document.getElementById('toggleAuth').addEventListener('click', () => setAuthMode(!signingUp));
  authMessage.textContent = '';
}
toggleAuth.addEventListener('click', () => setAuthMode(true));
authForm.addEventListener('submit', event => {
  event.preventDefault();
  authScreen.hidden = true;
});
