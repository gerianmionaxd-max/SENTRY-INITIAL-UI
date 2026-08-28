/*
 * Sentry attendance dashboard interactions.
 * This is a client-side demo: form submissions only update the interface.
 */

const GUARDS = {
  ramon: { name: 'Ramon Santos', id: 'SG-2024-0182', post: 'Trinitarian Centre', assignment: 'Main Gate · Day shift', phone: '+63 917 555 0182', email: 'ramon.santos@sentry.ph', status: 'On duty', image: 'images/SP.jpg' },
  ricardo: { name: 'Ricardo Williams', id: 'SG-2024-0097', post: 'Trinidad Complex', assignment: 'Lobby post · Day shift', phone: '+63 917 555 0097', email: 'ricardo.williams@sentry.ph', status: 'On duty', image: 'images/RW.png' },
  leo: { name: 'Leo Jimenez', id: 'SG-2024-0241', post: 'Macario-Catalina Building', assignment: 'Gate post · Day shift', phone: '+63 917 555 0241', email: 'leo.jimenez@sentry.ph', status: 'Late arrival', image: 'images/LJ.webp' },
  juan: { name: 'Juan Flores', id: 'SG-2024-0064', post: 'Trinitarian Centre', assignment: 'Loading Bay · Day shift', phone: '+63 917 555 0064', email: 'juan.flores@sentry.ph', status: 'On duty', image: 'images/JF.png' },
  kevin: { name: 'Kevin Silva', id: 'SG-2024-0156', post: 'JTA Building', assignment: 'Perimeter post · Night shift', phone: '+63 917 555 0156', email: 'kevin.silva@sentry.ph', status: 'Absent', image: 'images/KS.jpg' },
};

const HR_ACTIONS = {
  add: 'Add new guard / employee', edit: 'Edit employee information', status: 'Activate / deactivate employee',
  id: 'Assign employee ID', schedule: 'Manage schedules / shifts', exceptions: 'Review late / absent records',
  report: 'Generate attendance report', correct: 'Correct attendance record',
};

const PAYROLL_ACTIONS = {
  validated: 'Validated attendance data', overtime: 'Overtime and leave adjustments',
  reports: 'Generate payroll-ready report', run: 'Review payroll run',
};

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const USER_ACCOUNTS_KEY = 'sentryUserAccounts';
const LEGACY_PENDING_ACCOUNTS_KEY = 'sentryPendingAccountRequests';
// Demo-only administrator account for this frontend prototype. Replace with backend authentication later.
const DEMO_ADMIN_ACCOUNT = { userId: 'ADMIN-001', username: 'admin', email: 'admin@sentry.local', password: 'admin123', status: 'Active', department: 'Administration', accessRights: ['Admin'] };
const DEPARTMENT_ACCESS = {
  Security: ['Read', 'Write'],
  'Human Resources': ['Read', 'Write', 'Execute'],
  Payroll: ['Read', 'Write', 'Execute'],
};

function accessForDepartment(department) {
  return [...(DEPARTMENT_ACCESS[department] || ['Read'])];
}

function getStoredAccounts() {
  const savedAccounts = JSON.parse(localStorage.getItem(USER_ACCOUNTS_KEY) || '[]');
  return savedAccounts.length ? savedAccounts : JSON.parse(localStorage.getItem(LEGACY_PENDING_ACCOUNTS_KEY) || '[]');
}

function saveStoredAccounts(accounts) {
  localStorage.setItem(USER_ACCOUNTS_KEY, JSON.stringify(accounts));
  localStorage.removeItem(LEGACY_PENDING_ACCOUNTS_KEY);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function createToast(element) {
  let timeoutId;
  return message => {
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => element.classList.remove('show'), 2600);
  };
}

function closeWhenBackdropIsClicked(modal, close) {
  modal.addEventListener('click', event => {
    if (event.target === modal) close();
  });
}

function renderRecordList(items) {
  return `<div class="hr-record-list">${items.map(([name, detail]) => `
    <div class="hr-record"><div><strong>${name}</strong><span>${detail}</span></div><button type="button">Review</button></div>`).join('')}
  </div>`;
}

function initAuthentication() {
  const screen = $('#authScreen');
  const loginForm = $('#loginForm');
  const registrationForm = $('#registrationForm');
  const title = $('#authTitle');
  const copy = $('#authCopy');
  const switcher = $('#authSwitch');
  const message = $('#authMessage');

  const showLogin = () => {
    title.textContent = 'Welcome back';
    copy.textContent = 'Sign in to access the attendance dashboard.';
    loginForm.hidden = false;
    registrationForm.hidden = true;
    switcher.innerHTML = 'Need a staff account? <button type="button">Request one</button>';
    message.textContent = '';
    message.classList.remove('success');
  };
  const showRegistration = () => {
    title.textContent = 'Request a staff account';
    copy.textContent = 'Your request will be reviewed by an administrator.';
    loginForm.hidden = true;
    registrationForm.hidden = false;
    switcher.innerHTML = 'Already have an account? <button type="button">Log in</button>';
    message.textContent = '';
    message.classList.remove('success');
  };

  switcher.addEventListener('click', event => {
    if (event.target.matches('button')) (registrationForm.hidden ? showRegistration : showLogin)();
  });
  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const identity = $('#authIdentity').value.trim().toLowerCase();
    const password = $('#authPassword').value;
    const account = [...getStoredAccounts(), DEMO_ADMIN_ACCOUNT].find(item => item.username.toLowerCase() === identity || item.email.toLowerCase() === identity);
    if (!account || account.password !== password) {
      message.textContent = 'Invalid username/email or password.';
      return;
    }
    if (account.status === 'Pending') {
      message.textContent = 'Your account is awaiting administrator approval.';
      return;
    }
    if (account.status !== 'Active') {
      message.textContent = 'Your account is inactive. Please contact the administrator.';
      return;
    }
    if (account.expirationDate && account.expirationDate < new Date().toISOString().slice(0, 10)) {
      message.textContent = 'Your account access has expired. Please contact the administrator.';
      return;
    }
    if (account.department === 'Security') {
      message.textContent = 'Security staff use the mobile attendance app. Please sign in on your assigned mobile device.';
      return;
    }
    const accessRights = account.accessRights || [];
    sessionStorage.setItem('sentryLoggedInUser', JSON.stringify({ userId: account.userId, username: account.username, accessRights }));
    if ($('#rememberMe').checked) localStorage.setItem('sentryRememberedUser', account.username);
    else localStorage.removeItem('sentryRememberedUser');
    $('#adminPanelNav').hidden = !accessRights.includes('Admin');
    screen.hidden = true;
  });
  registrationForm.addEventListener('submit', event => {
    event.preventDefault();
    const details = Object.fromEntries(new FormData(registrationForm));
    const requests = getStoredAccounts();
    const existingAccount = requests.find(request => request.username.toLowerCase() === details.username.toLowerCase() || request.email.toLowerCase() === details.email.toLowerCase());
    if (existingAccount?.status === 'Pending') {
      message.textContent = 'This account request is already awaiting administrator approval.';
      return;
    }
    if (existingAccount?.status === 'Active') {
      message.textContent = 'An active account with this username or email already exists.';
      return;
    }
    // Prototype only: localStorage is a temporary stand-in for a backend/database.
    if (existingAccount) Object.assign(existingAccount, details, { status: 'Pending', requestedAt: new Date().toISOString() });
    else requests.push({ userId: `USR-${Date.now()}`, ...details, status: 'Pending', requestedAt: new Date().toISOString() });
    saveStoredAccounts(requests);
    registrationForm.reset();
    message.textContent = existingAccount
      ? 'Your account request was resubmitted. Please wait for administrator approval.'
      : 'Your account request was submitted. Please wait for administrator approval.';
    message.classList.add('success');
  });
}

function initAttendance(toast) {
  const filters = $$('.filter');
  const rows = $$('#attendanceRows tr');
  const searchInput = $('#qrSearch');

  const showRows = predicate => rows.forEach(row => { row.hidden = !predicate(row); });
  const activateFilter = activeFilter => filters.forEach(filter => filter.classList.toggle('active', filter === activeFilter));

  filters.forEach(filter => filter.addEventListener('click', () => {
    activateFilter(filter);
    const status = filter.dataset.filter;
    showRows(row => status === 'all' || row.dataset.status === status);
  }));

  const searchByQr = () => {
    const query = searchInput.value.trim().toUpperCase();
    activateFilter(null);
    let matches = 0;
    showRows(row => {
      const isMatch = !query || row.dataset.qr.includes(query);
      matches += Number(isMatch);
      return isMatch;
    });
    toast(query
      ? (matches ? `${matches} guard record found for ${query}` : `No guard record found for ${query}`)
      : 'Showing all guard attendance records');
  };

  $('#qrSearchBtn').addEventListener('click', searchByQr);
  searchInput.addEventListener('keydown', event => { if (event.key === 'Enter') searchByQr(); });
}

function updateSystemCounts() {
  const rows = $$('#attendanceRows tr');
  const countByStatus = status => rows.filter(row => row.dataset.status === status).length;
  const total = rows.length;
  const onDuty = countByStatus('present');
  const late = countByStatus('late');
  const absent = countByStatus('absent');
  const verified = total - absent;
  const activeRequestedAccounts = getStoredAccounts().filter(account => account.status === 'Active').length;
  const pendingAccounts = getStoredAccounts().filter(account => account.status === 'Pending').length;
  const setText = (selector, value) => { const element = $(selector); if (element) element.textContent = value; };

  setText('#allFilterCount', total);
  setText('#presentFilterCount', onDuty);
  setText('#lateFilterCount', late);
  setText('#absentFilterCount', absent);
  setText('#onDutyStat', onDuty);
  setText('#lateStat', late);
  setText('#absentStat', absent);
  setText('#verifiedStat', verified);
  setText('#verifiedRing', verified);
  setText('#hrRegisteredGuardCount', Object.keys(GUARDS).length + activeRequestedAccounts);
  setText('#hrExceptionCount', late + absent);
  setText('#hrExceptionNote', `${late} late · ${absent} absent today`);
  setText('#hrPendingAccountCount', pendingAccounts);
  setText('#hrAttendanceRecordCount', total);
  setText('#hrExceptionTaskCount', late + absent);
  setText('#payrollValidatedCount', verified);
  setText('#payrollTaskCount', verified);
  setText('#adminAttendanceRate', `${Math.round((onDuty / total) * 100)}%`);
  setText('#adminOnDutyCount', onDuty);
  setText('#adminCoverageNote', `Of ${total} current guards`);
  setText('#adminExceptionCount', late + absent);
  setText('#adminExceptionNote', `${late} late · ${absent} absent`);
  setText('#adminVerificationRate', `${Math.round((verified / total) * 100)}%`);
  setText('#adminLateCount', late);
  setText('#adminAbsentCount', absent);
}

function initScanner() {
  const modal = $('#scannerModal');
  const video = $('#scannerVideo');
  const message = $('#scannerMessage');
  let stream;

  const close = () => {
    stream?.getTracks().forEach(track => track.stop());
    stream = undefined;
    video.srcObject = null;
    modal.hidden = true;
  };
  const open = async () => {
    modal.hidden = false;
    message.textContent = 'Requesting camera access…';
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      video.srcObject = stream;
      message.textContent = 'Position the guard’s QR code within the frame.';
    } catch {
      message.textContent = 'Camera access was not available. Please allow camera permission and try again.';
    }
  };

  $('#quickScan').addEventListener('click', open);
  $('#closeScanner').addEventListener('click', close);
  closeWhenBackdropIsClicked(modal, close);
}

function initCarousel() {
  const track = $('#staffTrack');
  const previous = $('#staffPrev');
  const next = $('#staffNext');
  const updateControls = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = maxScroll <= 2 || track.scrollLeft >= maxScroll - 2;
  };
  const step = () => track.querySelector('.staff-card')?.offsetWidth + 16 || 260;

  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  previous.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  track.addEventListener('scroll', updateControls);
  window.addEventListener('resize', updateControls);
  updateControls();
}

function initProfiles() {
  const modal = $('#profileModal');
  const details = $('#profileDetails');
  const name = $('#profileName');
  const image = $('#profileImage');
  const status = $('#profileStatus');
  const open = () => { modal.hidden = false; };
  const close = () => { modal.hidden = true; };

  const showProfile = guardId => {
    const guard = GUARDS[guardId];
    if (!guard) return;
    name.textContent = guard.name;
    image.src = guard.image;
    image.alt = `${guard.name} profile photo`;
    status.textContent = `● ${guard.status}`;
    details.className = 'profile-details';
    details.innerHTML = [['Guard ID', guard.id], ['Assigned post', guard.post], ['Assignment', guard.assignment], ['Contact number', guard.phone], ['Email address', guard.email], ['Registration status', 'Verified guard']]
      .map(([label, value]) => `<div class="profile-detail"><span>${label}</span><strong>${value}</strong></div>`).join('');
    open();
  };
  const showAll = () => {
    name.textContent = 'Registered guards';
    image.src = 'images/1568-logo-1781901055.317-00a3e4-color.webp';
    image.alt = 'Sentry logo';
    status.textContent = `${Object.keys(GUARDS).length} guard records`;
    details.className = 'profile-details all-guards';
    details.innerHTML = Object.values(GUARDS).map(guard => `<div class="guard-summary"><img src="${guard.image}" alt=""><div><strong>${guard.name}</strong><small>${guard.id} · ${guard.post}</small></div></div>`).join('');
    open();
  };

  $$('.profile-button').forEach(button => button.addEventListener('click', () => showProfile(button.dataset.guard)));
  $('#viewAll').addEventListener('click', showAll);
  $('#closeProfile').addEventListener('click', close);
  closeWhenBackdropIsClicked(modal, close);
  return { showAll };
}

function initWorkspace(toast, profiles) {
  const sections = { attendance: [], hr: [$('#hrPanel'), $('#hrActions')], payroll: [$('#payrollPanel')], admin: [$('#adminPanel')] };
  const navItems = { attendance: $('#attendanceNav'), hr: $('#hrPanelNav'), payroll: $('#payrollPanelNav'), admin: $('#adminPanelNav') };
  const bodyClasses = ['hr-panel-active', 'payroll-panel-active', 'admin-panel-active'];
  const actionModal = $('#hrActionModal');
  const actionTitle = $('#hrActionTitle');
  const actionDescription = $('#hrActionDescription');
  const actionContent = $('#hrActionContent');
  const pendingAccountRows = $('#pendingAccountRows');
  const pendingAccountCount = $('#pendingAccountCount');
  const accessAssignmentForm = $('#accessAssignmentForm');
  const accessUserId = $('#accessUserId');
  const accessExpiration = $('#accessExpiration');
  const rightInputs = { Read: $('#accessRead'), Write: $('#accessWrite'), Execute: $('#accessExecute'), Admin: $('#accessAdmin') };

  const renderPendingAccounts = () => {
    const pendingAccounts = getStoredAccounts().filter(account => account.status === 'Pending');
    pendingAccountCount.textContent = pendingAccounts.length;
    pendingAccountRows.innerHTML = pendingAccounts.length
      ? pendingAccounts.map(account => `<tr><td>${escapeHtml(account.userId)}</td><td><strong>${escapeHtml(account.username)}</strong></td><td>${escapeHtml(account.email)}</td><td>${escapeHtml(account.department)}</td><td><span class="pending-status">Pending</span></td><td><div class="account-actions"><button class="approve-account" data-account-action="approve" data-user-id="${escapeHtml(account.userId)}" type="button">Approve</button><button class="reject-account" data-account-action="reject" data-user-id="${escapeHtml(account.userId)}" type="button">Reject</button></div></td></tr>`).join('')
      : '<tr><td class="empty-pending" colspan="6">No account requests are awaiting approval.</td></tr>';
  };

  const updateAccessRightsView = () => {
    const account = getStoredAccounts().find(item => item.userId === accessUserId.value);
    const rights = account?.accessRights || (account ? accessForDepartment(account.department) : []);
    Object.entries(rightInputs).forEach(([right, input]) => { input.checked = rights.includes(right); });
    accessExpiration.value = account?.expirationDate || '';
    accessExpiration.disabled = !account;
  };

  const renderAccessAssignment = () => {
    const activeAccounts = getStoredAccounts().filter(account => account.status === 'Active');
    const selectedId = accessUserId.value;
    accessUserId.innerHTML = '<option value="">Select an active user</option>' + activeAccounts
      .map(account => `<option value="${escapeHtml(account.userId)}">${escapeHtml(account.userId)} — ${escapeHtml(account.username)} (${escapeHtml(account.department)})</option>`).join('');
    accessUserId.value = activeAccounts.some(account => account.userId === selectedId) ? selectedId : '';
    updateAccessRightsView();
  };

  const setPanel = panel => {
    document.body.classList.remove(...bodyClasses);
    if (panel !== 'attendance') document.body.classList.add(`${panel}-panel-active`);
    Object.entries(sections).forEach(([name, elements]) => elements.forEach(element => { element.hidden = name !== panel; }));
    Object.entries(navItems).forEach(([name, item]) => item.classList.toggle('active', name === panel));
    updateSystemCounts();
    if (panel === 'admin') { renderPendingAccounts(); renderAccessAssignment(); }
  };
  Object.entries(navItems).forEach(([panel, item]) => item.addEventListener('click', event => { event.preventDefault(); setPanel(panel); }));

  const openAction = (action, type = 'hr') => {
    if (action === 'profiles') return profiles.showAll();
    if (action === 'attendance') return setPanel('attendance');
    const isPayroll = type === 'payroll';
    actionTitle.textContent = (isPayroll ? PAYROLL_ACTIONS : HR_ACTIONS)[action];
    actionDescription.textContent = isPayroll
      ? 'This mock payroll tool uses validated attendance records from the attendance system.'
      : 'Use this mock HR tool to review and update staff information.';
    const records = isPayroll
      ? { validated: [['Ramon Santos', '22 work days · 0.5 overtime hours'], ['Ricardo Williams', '22 work days · 2 overtime hours'], ['Juan Flores', '22 work days · 1 overtime hour']], overtime: [['Ricardo Williams', '2 overtime hours · Pending'], ['Leo Jimenez', '1 leave day · Pending'], ['Kevin Silva', 'Night differential · Pending']] }
      : { exceptions: [['Leo Jimenez', 'Late arrival · 07:03 AM'], ['Kevin Silva', 'No QR scan recorded · Absent']], schedule: [['Ramon Santos', 'Trinitarian Centre · Day shift'], ['Ricardo Williams', 'Trinidad Complex · Day shift'], ['Kevin Silva', 'JTA Building · Night shift']] };
    if (records[action]) actionContent.innerHTML = renderRecordList(records[action]);
    else if (action === 'report' || action === 'reports' || action === 'run') actionContent.innerHTML = '<form class="hr-form"><label>Period<select><option>Today — 10 Aug 2026</option><option>This week</option><option>This month</option></select></label><label>Output<select><option>PDF summary</option><option>Excel spreadsheet</option></select></label><button type="submit">Generate report</button></form>';
    else actionContent.innerHTML = `<form class="hr-form"><label>Employee<select>${Object.values(GUARDS).map(guard => `<option>${guard.name} — ${guard.id}</option>`).join('')}</select></label><label>${action === 'add' ? 'Employee name' : 'Update details'}<input required placeholder="Enter required information"></label><button type="submit">Save ${action === 'add' ? 'employee' : 'changes'}</button></form>`;
    actionModal.hidden = false;
  };

  $$('[data-hr-action]').forEach(button => button.addEventListener('click', () => openAction(button.dataset.hrAction)));
  $$('[data-payroll-action]').forEach(button => button.addEventListener('click', () => openAction(button.dataset.payrollAction, 'payroll')));
  $('#addEmployee').addEventListener('click', () => openAction('add'));
  $('#createPayroll').addEventListener('click', () => openAction('run', 'payroll'));
  $('#reviewExceptions').addEventListener('click', () => openAction('exceptions'));
  $('#exportAnalytics').addEventListener('click', () => toast('Analytics summary is ready to export'));
  pendingAccountRows.addEventListener('click', event => {
    const button = event.target.closest('[data-account-action]');
    if (!button) return;
    const accounts = getStoredAccounts();
    const account = accounts.find(item => item.userId === button.dataset.userId);
    if (!account) return;
    const approved = button.dataset.accountAction === 'approve';
    account.status = approved ? 'Active' : 'Inactive';
    if (approved) account.accessRights = accessForDepartment(account.department);
    saveStoredAccounts(accounts);
    renderPendingAccounts();
    renderAccessAssignment();
    updateSystemCounts();
    toast(`${account.username}'s account was ${approved ? 'approved and activated' : 'rejected and marked inactive'}`);
  });
  accessUserId.addEventListener('change', updateAccessRightsView);
  accessAssignmentForm.addEventListener('submit', event => {
    event.preventDefault();
    const accounts = getStoredAccounts();
    const account = accounts.find(item => item.userId === accessUserId.value && item.status === 'Active');
    if (!account) return toast('Select an active user first');
    if (accessExpiration.value && accessExpiration.value < new Date().toISOString().slice(0, 10)) return toast('Choose today or a future expiration date');
    account.accessRights = accessForDepartment(account.department);
    account.expirationDate = accessExpiration.value;
    saveStoredAccounts(accounts);
    updateAccessRightsView();
    toast(`${account.username}'s department access and expiration date were saved`);
  });
  $('#closeHrAction').addEventListener('click', () => { actionModal.hidden = true; });
  closeWhenBackdropIsClicked(actionModal, () => { actionModal.hidden = true; });
  actionContent.addEventListener('submit', event => {
    event.preventDefault();
    actionModal.hidden = true;
    toast(/payroll/i.test(actionTitle.textContent) ? 'Payroll report is ready to generate' : 'HR record updated successfully');
  });
}

function initDashboard() {
  const toast = createToast($('#toast'));
  initAuthentication();
  initAttendance(toast);
  updateSystemCounts();
  initScanner();
  initCarousel();
  const profiles = initProfiles();
  initWorkspace(toast, profiles);
}

document.addEventListener('DOMContentLoaded', initDashboard);
