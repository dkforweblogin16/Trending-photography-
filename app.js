// ============================================
//  TRENDING PHOTOGRAPHY - Firebase & Core JS
// ============================================

// ─── Firebase Config (Replace with your own) ───
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Admin email
const ADMIN_EMAIL = "lavkush@trendingphotography.in";

// WhatsApp number (with country code, no +)
const WHATSAPP_NUMBER = "919876543210";

// ─── Initialize Firebase ───
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, setDoc, getDoc,
  getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// ─── State ───
let currentUser = null;
let isAdmin = false;
let currentPage = 'home';
let allBookings = []; // admin cache

// ─── Utility Functions ───
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function showLoading(show = true) {
  const el = $('#loadingOverlay');
  if (el) el.classList.toggle('show', show);
}

function showAlert(containerId, type, msg, duration = 4000) {
  const el = $(`#${containerId}`);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = msg;
  if (duration) setTimeout(() => el.classList.remove('show'), duration);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
}

function getBadgeHtml(status) {
  return `<span class="badge badge-${status}">${status.charAt(0).toUpperCase()+status.slice(1)}</span>`;
}

function whatsappLink(msg) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ─── Page Navigation ───
function navigateTo(pageId) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  const target = $(`#page-${pageId}`);
  if (target) { target.classList.add('active'); currentPage = pageId; }
  const navBtn = $(`.bottom-nav-item[data-page="${pageId}"]`);
  if (navBtn) navBtn.classList.add('active');
  window.scrollTo({ top: 0 });
  // Trigger page-specific init
  if (pageId === 'dashboard') initDashboard();
  if (pageId === 'admin') initAdmin();
  if (pageId === 'portfolio') initPortfolio();
}

// ─── Auth State Observer ───
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    isAdmin = (user.email === ADMIN_EMAIL);
    updateNavForUser(user);
    // Ensure user doc exists
    const uRef = doc(db, 'users', user.uid);
    const uSnap = await getDoc(uRef);
    if (!uSnap.exists()) {
      await setDoc(uRef, {
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        createdAt: serverTimestamp()
      });
    }
  } else {
    isAdmin = false;
    updateNavForGuest();
  }
});

function updateNavForUser(user) {
  const authBtn = $('#navAuthBtn');
  if (authBtn) {
    authBtn.innerHTML = `<span>${getInitials(user.email)}</span>`;
    authBtn.title = user.email;
    authBtn.onclick = () => navigateTo('dashboard');
  }
  // Show/hide admin nav
  const adminNav = $('.bottom-nav-item[data-page="admin"]');
  if (adminNav) adminNav.classList.toggle('hidden', !isAdmin);
  // Show dashboard nav
  const dashNav = $('.bottom-nav-item[data-page="dashboard"]');
  if (dashNav) dashNav.classList.remove('hidden');
  // Hide auth nav
  const authNav = $('.bottom-nav-item[data-page="auth"]');
  if (authNav) authNav.classList.add('hidden');
}

function updateNavForGuest() {
  const authBtn = $('#navAuthBtn');
  if (authBtn) { authBtn.innerHTML = '👤'; authBtn.onclick = () => navigateTo('auth'); }
  const adminNav = $('.bottom-nav-item[data-page="admin"]');
  if (adminNav) adminNav.classList.add('hidden');
  const dashNav = $('.bottom-nav-item[data-page="dashboard"]');
  if (dashNav) dashNav.classList.add('hidden');
  const authNav = $('.bottom-nav-item[data-page="auth"]');
  if (authNav) authNav.classList.remove('hidden');
}

// ─── AUTH ───
async function handleSignup(e) {
  e.preventDefault();
  const name = $('#signupName').value.trim();
  const email = $('#signupEmail').value.trim();
  const pass = $('#signupPass').value;
  if (!name || !email || !pass) return showAlert('signupAlert', 'error', 'Please fill all fields.');
  if (pass.length < 6) return showAlert('signupAlert', 'error', 'Password must be at least 6 characters.');
  showLoading(true);
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, 'users', cred.user.uid), {
      name, email, createdAt: serverTimestamp()
    });
    showLoading(false);
    showAlert('signupAlert', 'success', 'Account created! Welcome 🎉');
    setTimeout(() => navigateTo('dashboard'), 1200);
  } catch(err) {
    showLoading(false);
    showAlert('signupAlert', 'error', getAuthError(err.code));
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = $('#loginEmail').value.trim();
  const pass = $('#loginPass').value;
  if (!email || !pass) return showAlert('loginAlert', 'error', 'Please fill all fields.');
  showLoading(true);
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    showLoading(false);
    setTimeout(() => navigateTo(auth.currentUser?.email === ADMIN_EMAIL ? 'admin' : 'dashboard'), 300);
  } catch(err) {
    showLoading(false);
    showAlert('loginAlert', 'error', getAuthError(err.code));
  }
}

async function handleLogout() {
  await signOut(auth);
  navigateTo('home');
}

function getAuthError(code) {
  const map = {
    'auth/email-already-in-use': 'Email already registered. Please login.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/weak-password': 'Password too weak.',
    'auth/invalid-credential': 'Invalid credentials. Check email & password.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

// ─── BOOKING ───
let selectedPackage = 'basic';

function selectPackage(pkg) {
  selectedPackage = pkg;
  $$('.package-option').forEach(o => {
    o.classList.toggle('selected', o.dataset.package === pkg);
  });
}

async function handleBooking(e) {
  e.preventDefault();
  if (!currentUser) {
    showAlert('bookingAlert', 'error', 'Please login to book a session.');
    setTimeout(() => navigateTo('auth'), 1500);
    return;
  }
  const name = $('#bookName').value.trim();
  const phone = $('#bookPhone').value.trim();
  const eventType = $('#bookEvent').value;
  const date = $('#bookDate').value;
  const location = $('#bookLocation').value.trim();
  const notes = $('#bookNotes').value.trim();
  if (!name || !phone || !eventType || !date || !location) {
    return showAlert('bookingAlert', 'error', 'Please fill all required fields.');
  }
  showLoading(true);
  try {
    const bookingData = {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      name, phone, eventType, date, location,
      package: selectedPackage,
      notes,
      status: 'pending',
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'bookings'), bookingData);
    showLoading(false);
    // Show success state
    $('#bookingForm').classList.add('hidden');
    const success = $('#bookingSuccess');
    success.classList.remove('hidden');
    $('#bookingId').textContent = docRef.id.slice(-8).toUpperCase();
    // WhatsApp notification
    const waMsg = `🎉 Booking Confirmed!\n\nName: ${name}\nEvent: ${eventType}\nDate: ${date}\nPackage: ${selectedPackage.charAt(0).toUpperCase()+selectedPackage.slice(1)}\nLocation: ${location}\n\nBooking ID: ${docRef.id.slice(-8).toUpperCase()}\n\n— Trending Photography`;
    $('#waConfirmBtn').href = whatsappLink(waMsg);
  } catch(err) {
    showLoading(false);
    showAlert('bookingAlert', 'error', 'Booking failed. Please try again.');
    console.error(err);
  }
}

async function cancelBooking(bookingId) {
  const booking = allBookings.find(b => b.id === bookingId) || {};
  const waMsg = `Hi! I want to cancel/discuss my booking.\n\nBooking ID: ${bookingId.slice(-8).toUpperCase()}\nName: ${booking.name || ''}\nEvent: ${booking.eventType || ''}\nDate: ${booking.date || ''}`;
  window.open(whatsappLink(waMsg), '_blank');
}

// ─── DASHBOARD ───
async function initDashboard() {
  if (!currentUser) { navigateTo('auth'); return; }
  const uRef = doc(db, 'users', currentUser.uid);
  const uSnap = await getDoc(uRef);
  const userData = uSnap.exists() ? uSnap.data() : {};
  const displayName = userData.name || currentUser.email.split('@')[0];

  $('#dashWelcome').textContent = `Welcome, ${displayName.split(' ')[0]} ✨`;
  $('#dashAvatar').textContent = getInitials(displayName);
  $('#dashName').textContent = displayName;
  $('#dashEmail').textContent = currentUser.email;

  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });
  $('#dashDate').textContent = today;

  // Fetch bookings
  showLoading(true);
  try {
    const q = query(collection(db, 'bookings'), where('userId','==',currentUser.uid), orderBy('createdAt','desc'));
    const snap = await getDocs(q);
    const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Stats
    $('#statTotal').textContent = bookings.length;
    $('#statPending').textContent = bookings.filter(b => b.status === 'pending').length;
    $('#statConfirmed').textContent = bookings.filter(b => b.status === 'confirmed').length;
    $('#statCompleted').textContent = bookings.filter(b => b.status === 'completed').length;

    renderDashBookings(bookings);
    showLoading(false);
  } catch(err) {
    showLoading(false);
    console.error(err);
    $('#dashBookingsList').innerHTML = `<div class="alert alert-error show">Failed to load bookings.</div>`;
  }
}

function renderDashBookings(bookings) {
  const container = $('#dashBookingsList');
  if (!bookings.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📷</div>
        <div class="empty-title">No Bookings Yet</div>
        <div class="empty-desc">Book your first photography session!</div>
        <button class="btn btn-gold mt-4" onclick="navigateTo('booking')">Book Now</button>
      </div>`;
    return;
  }
  container.innerHTML = bookings.map(b => `
    <div class="card booking-card">
      <div class="booking-card-header">
        <div>
          <div class="booking-event-type">${getEventIcon(b.eventType)} ${b.eventType}</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">ID: ${b.id.slice(-8).toUpperCase()}</div>
        </div>
        ${getBadgeHtml(b.status)}
      </div>
      <div class="booking-meta">
        <div class="booking-meta-item">
          <div class="booking-meta-label">Date</div>
          ${formatDate(b.date)}
        </div>
        <div class="booking-meta-item">
          <div class="booking-meta-label">Package</div>
          ${b.package?.charAt(0).toUpperCase()+b.package?.slice(1) || '—'}
        </div>
        <div class="booking-meta-item">
          <div class="booking-meta-label">Location</div>
          ${b.location || '—'}
        </div>
        <div class="booking-meta-item">
          <div class="booking-meta-label">Booked On</div>
          ${formatTimestamp(b.createdAt)}
        </div>
      </div>
      ${b.notes ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:12px;font-style:italic">"${b.notes}"</div>` : ''}
      <div class="booking-actions">
        ${b.status !== 'completed' && b.status !== 'cancelled' ? 
          `<button class="btn btn-sm btn-danger" onclick="cancelBooking('${b.id}')">Cancel / Query</button>` : ''}
        <a href="tel:+${WHATSAPP_NUMBER}" class="btn btn-sm btn-outline">📞 Call</a>
      </div>
    </div>`).join('');
}

function getEventIcon(type) {
  const map = { Wedding:'💍', 'Pre-wedding':'❤️', Birthday:'🎂', Anniversary:'🥂', 'Baby Shower':'🍼', Engagement:'💫', Corporate:'🏢', Other:'📸' };
  return map[type] || '📸';
}

// ─── ADMIN ───
async function initAdmin() {
  if (!isAdmin) { navigateTo('home'); return; }
  await loadAdminBookings();
}

async function loadAdminBookings(filters = {}) {
  showLoading(true);
  try {
    let q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(200));
    const snap = await getDocs(q);
    allBookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Filter in-memory
    let filtered = [...allBookings];
    if (filters.status && filters.status !== 'all') filtered = filtered.filter(b => b.status === filters.status);
    if (filters.event && filters.event !== 'all') filtered = filtered.filter(b => b.eventType === filters.event);
    if (filters.date) filtered = filtered.filter(b => b.date === filters.date);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(b => b.name?.toLowerCase().includes(s) || b.phone?.includes(s));
    }

    // Stats
    $('#adminTotal').textContent = allBookings.length;
    $('#adminPending').textContent = allBookings.filter(b => b.status==='pending').length;
    $('#adminConfirmed').textContent = allBookings.filter(b => b.status==='confirmed').length;

    renderAdminBookings(filtered);
    showLoading(false);
  } catch(err) {
    showLoading(false);
    console.error(err);
  }
}

function renderAdminBookings(bookings) {
  const container = $('#adminBookingsList');
  if (!bookings.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No bookings found</div></div>`;
    return;
  }
  container.innerHTML = bookings.map(b => `
    <div class="card admin-booking-card">
      <div class="admin-booking-header">
        <div>
          <div class="admin-booking-name">${b.name}</div>
          <div class="admin-booking-id">ID: ${b.id.slice(-8).toUpperCase()}</div>
        </div>
        ${getBadgeHtml(b.status)}
      </div>
      <div class="booking-meta">
        <div class="booking-meta-item"><div class="booking-meta-label">Event</div>${getEventIcon(b.eventType)} ${b.eventType}</div>
        <div class="booking-meta-item"><div class="booking-meta-label">Date</div>${formatDate(b.date)}</div>
        <div class="booking-meta-item"><div class="booking-meta-label">Package</div>${b.package?.charAt(0).toUpperCase()+b.package?.slice(1)||'—'}</div>
        <div class="booking-meta-item"><div class="booking-meta-label">Phone</div><a href="tel:${b.phone}" style="color:var(--gold)">${b.phone}</a></div>
        <div class="booking-meta-item"><div class="booking-meta-label">Location</div>${b.location||'—'}</div>
        <div class="booking-meta-item"><div class="booking-meta-label">Booked</div>${formatTimestamp(b.createdAt)}</div>
      </div>
      ${b.notes ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:10px;font-style:italic">"${b.notes}"</div>` : ''}
      <div class="admin-actions">
        <select class="status-selector" onchange="updateBookingStatus('${b.id}', this.value)">
          <option ${b.status==='pending'?'selected':''} value="pending">⏳ Pending</option>
          <option ${b.status==='confirmed'?'selected':''} value="confirmed">✅ Confirmed</option>
          <option ${b.status==='completed'?'selected':''} value="completed">🏆 Completed</option>
          <option ${b.status==='cancelled'?'selected':''} value="cancelled">❌ Cancelled</option>
        </select>
        <a href="${whatsappLink(`Hi ${b.name}! Your ${b.eventType} booking on ${b.date} is confirmed with Trending Photography. 📸`)}" target="_blank" class="btn btn-sm btn-success">WhatsApp</a>
        <a href="tel:${b.phone}" class="btn btn-sm btn-outline">📞 Call</a>
        <button class="btn btn-sm btn-danger" onclick="deleteBooking('${b.id}')">Delete</button>
      </div>
    </div>`).join('');
}

async function updateBookingStatus(id, status) {
  try {
    await updateDoc(doc(db, 'bookings', id), { status });
    const b = allBookings.find(x => x.id === id);
    if (b) b.status = status;
    // Re-render silently
    const selectors = $$('.status-selector');
    // update badge inline
    const cards = $$('.admin-booking-card');
    cards.forEach(card => {
      const sel = card.querySelector('.status-selector');
      if (sel?.onchange?.toString().includes(id)) {
        const badgeEl = card.querySelector('.badge');
        if (badgeEl) { badgeEl.className = `badge badge-${status}`; badgeEl.textContent = status.charAt(0).toUpperCase()+status.slice(1); }
      }
    });
  } catch(err) { alert('Failed to update status.'); console.error(err); }
}

async function deleteBooking(id) {
  if (!confirm('Delete this booking? This cannot be undone.')) return;
  showLoading(true);
  try {
    await deleteDoc(doc(db, 'bookings', id));
    allBookings = allBookings.filter(b => b.id !== id);
    showLoading(false);
    renderAdminBookings(allBookings);
  } catch(err) { showLoading(false); alert('Failed to delete.'); }
}

async function addManualBooking(e) {
  e.preventDefault();
  if (!isAdmin) return;
  const name = $('#manualName').value.trim();
  const phone = $('#manualPhone').value.trim();
  const eventType = $('#manualEvent').value;
  const date = $('#manualDate').value;
  const location = $('#manualLocation').value.trim();
  const pkg = $('#manualPackage').value;
  const notes = $('#manualNotes').value.trim();
  if (!name || !phone || !eventType || !date) return alert('Fill required fields.');
  showLoading(true);
  try {
    await addDoc(collection(db, 'bookings'), {
      userId: 'manual', userEmail: 'admin',
      name, phone, eventType, date, location, package: pkg, notes,
      status: 'confirmed', createdAt: serverTimestamp()
    });
    closeModal('addBookingModal');
    showLoading(false);
    loadAdminBookings();
  } catch(err) { showLoading(false); alert('Failed to add booking.'); }
}

function applyAdminFilters() {
  const status = $('#filterStatus').value;
  const event = $('#filterEvent').value;
  const date = $('#filterDate').value;
  const search = $('#filterSearch').value.trim();
  loadAdminBookings({ status, event, date, search });
}

// ─── PORTFOLIO ───
const PORTFOLIO_ITEMS = [
  { cat: 'Wedding', label: 'Sacred Union', color: '#2a1a2a' },
  { cat: 'Wedding', label: 'Golden Hour', color: '#1a1a0a' },
  { cat: 'Wedding', label: 'Eternal Vows', color: '#0a1a2a' },
  { cat: 'Pre-wedding', label: 'Love Story', color: '#1a0a2a' },
  { cat: 'Pre-wedding', label: 'Soulmates', color: '#0a2a1a' },
  { cat: 'Pre-wedding', label: 'Wanderlust', color: '#2a0a0a' },
  { cat: 'Events', label: 'Celebration', color: '#0a2a2a' },
  { cat: 'Events', label: 'Joy Moments', color: '#1a2a0a' },
  { cat: 'Events', label: 'Memories', color: '#2a2a0a' },
];

let activePortfolioTab = 'All';

function initPortfolio() {
  renderPortfolio('All');
}

function renderPortfolio(cat) {
  activePortfolioTab = cat;
  $$('.portfolio-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === cat));
  const items = cat === 'All' ? PORTFOLIO_ITEMS : PORTFOLIO_ITEMS.filter(i => i.cat === cat);
  const grid = $('#portfolioGrid');
  grid.innerHTML = items.map((item, i) => `
    <div class="portfolio-item${i % 5 === 0 ? ' span-2' : ''}" onclick="openLightbox(${i}, '${cat}')">
      <div class="portfolio-placeholder" style="height:100%;background:linear-gradient(135deg, ${item.color}, rgba(201,168,76,0.05))">
        <div class="icon">📸</div>
        <div>${item.label}</div>
        <div style="font-size:0.65rem;color:var(--text-muted)">${item.cat}</div>
      </div>
      <div class="portfolio-overlay">
        <span class="portfolio-label">⊞ View Full</span>
      </div>
    </div>`).join('');
}

function openLightbox(idx, cat) {
  const items = cat === 'All' ? PORTFOLIO_ITEMS : PORTFOLIO_ITEMS.filter(i => i.cat === cat);
  const item = items[idx] || PORTFOLIO_ITEMS[idx];
  if (!item) return;
  const lb = $('#lightbox');
  lb.classList.add('open');
  const img = $('#lightboxImg');
  img.style.display = 'none';
  const placeholder = $('#lightboxPlaceholder');
  placeholder.style.cssText = `
    width:90vw; max-width:500px; height:60vw; max-height:350px;
    background: linear-gradient(135deg, ${item.color}, rgba(201,168,76,0.08));
    border-radius:12px; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:10px;
    font-family: var(--font-display); font-size:1.5rem; color:var(--text-secondary);
  `;
  placeholder.innerHTML = `<div style="font-size:4rem">📸</div><div>${item.label}</div><div style="font-size:0.8rem;color:var(--text-muted)">${item.cat}</div>`;
}

function closeLightbox() {
  $('#lightbox').classList.remove('open');
}

// ─── MODALS ───
function openModal(id) { $(`#${id}`)?.classList.add('open'); }
function closeModal(id) { $(`#${id}`)?.classList.remove('open'); }

// ─── TESTIMONIAL SLIDER ───
let sliderIndex = 0;
let sliderInterval;

function initSlider() {
  const track = $('#testimonialsTrack');
  const dots = $$('.slider-dot');
  if (!track) return;
  const total = track.children.length;
  sliderInterval = setInterval(() => {
    sliderIndex = (sliderIndex + 1) % total;
    track.style.transform = `translateX(-${sliderIndex * 100}%)`;
    dots.forEach((d,i) => d.classList.toggle('active', i === sliderIndex));
  }, 4000);
  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    sliderIndex = i;
    track.style.transform = `translateX(-${i * 100}%)`;
    dots.forEach((d,j) => d.classList.toggle('active', j === i));
  }));
}

// ─── SCROLL ANIMATIONS ───
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.1 });
  $$('.fade-up').forEach(el => observer.observe(el));
}

// ─── PARTICLES ───
function initParticles() {
  const container = $('#heroParticles');
  if (!container) return;
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random()*100}%;
      animation-duration: ${8 + Math.random()*12}s;
      animation-delay: ${Math.random()*10}s;
      width: ${1+Math.random()*2}px;
      height: ${1+Math.random()*2}px;
    `;
    container.appendChild(p);
  }
}

// ─── STICKY NAV ───
function initStickyNav() {
  window.addEventListener('scroll', () => {
    const nav = $('#topNav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

// ─── BOOKING MIN DATE ───
function setMinDate() {
  const inputs = $$('input[type="date"]');
  const today = new Date().toISOString().split('T')[0];
  inputs.forEach(i => { if (!i.classList.contains('no-min')) i.min = today; });
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initStickyNav();
  initScrollAnimations();
  initSlider();
  setMinDate();
  navigateTo('home');
  updateNavForGuest();

  // Package selection
  $$('.package-option').forEach(opt => {
    opt.addEventListener('click', () => selectPackage(opt.dataset.package));
  });
  selectPackage('basic');

  // Auth tabs
  $$('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.auth-tab').forEach(t => t.classList.remove('active'));
      $$('.auth-form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      $(`#${tab.dataset.form}`)?.classList.add('active');
    });
  });

  // Admin filter
  $$('#filterStatus, #filterEvent, #filterDate').forEach(el => {
    el.addEventListener('change', applyAdminFilters);
  });
  $('#filterSearch')?.addEventListener('input', debounce(applyAdminFilters, 400));

  // Close lightbox on backdrop click
  $('#lightbox')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeLightbox();
  });

  // Close modal on backdrop click
  $$('.modal').forEach(m => m.addEventListener('click', (e) => {
    if (e.target === m) m.classList.remove('open');
  }));
});

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// Make functions global
window.navigateTo = navigateTo;
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.handleBooking = handleBooking;
window.selectPackage = selectPackage;
window.cancelBooking = cancelBooking;
window.updateBookingStatus = updateBookingStatus;
window.deleteBooking = deleteBooking;
window.addManualBooking = addManualBooking;
window.applyAdminFilters = applyAdminFilters;
window.initPortfolio = initPortfolio;
window.renderPortfolio = renderPortfolio;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.openModal = openModal;
window.closeModal = closeModal;
window.WHATSAPP_NUMBER = WHATSAPP_NUMBER;
