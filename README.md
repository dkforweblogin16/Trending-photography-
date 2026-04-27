# 📸 Trending Photography by Lavkush
## Premium Photography Booking Web App

> *Capturing Happy Moments That Last Forever*  
> *Aapki Kahani, Hamari Nazar Se*

---

## 🗂️ Folder Structure

```
trending-photography/
├── index.html              ← Main app (all pages)
├── css/
│   └── style.css           ← Complete luxury styling
├── js/
│   └── app.js              ← Firebase + all logic
├── assets/
│   └── hero.mp4            ← (Add your hero video here)
├── firestore.rules         ← Security rules
├── firestore.indexes.json  ← DB indexes
├── firebase.json           ← Hosting config
├── .firebaserc             ← Project reference
└── README.md               ← This file
```

---

## ✅ Features Included

### 🌟 Landing Page
- [x] Animated hero with particle effects (+ video support)
- [x] Taglines: "Capturing Happy Moments That Last Forever" & "Aapki Kahani, Hamari Nazar Se"
- [x] Services grid (Wedding, Pre-wedding, Birthday, Anniversary, Baby Shower, Corporate)
- [x] Portfolio preview section
- [x] Pricing cards (Basic / Standard / Premium)
- [x] Testimonials auto-slider (4 reviews)
- [x] Contact section with WhatsApp, Call, Email
- [x] WhatsApp floating button (pulsing)
- [x] Sticky bottom navigation (mobile-first)

### 🔐 Authentication (Firebase)
- [x] Email/password signup with name
- [x] Login with error handling
- [x] Auto-redirects after login
- [x] Admin detection by email
- [x] Persistent session (Firebase handles it)

### 📅 Booking System
- [x] Multi-step booking form
- [x] Fields: name, phone, event type, date, location, package, notes
- [x] Package selector (Basic/Standard/Premium)
- [x] Min date validation (no past dates)
- [x] Saves to Firestore: `bookings/{id}`
- [x] Booking confirmation with ID
- [x] WhatsApp confirmation share

### 👤 User Dashboard
- [x] Profile card with initials avatar
- [x] Stats: Total / Pending / Confirmed / Completed
- [x] All bookings listed with status badges
- [x] Cancel/query via WhatsApp
- [x] Direct call button

### ⚙️ Admin Panel
- [x] Only accessible to admin email
- [x] View all bookings
- [x] Filter: by status, event type, date, name/phone search
- [x] Update status: Pending → Confirmed → Completed → Cancelled
- [x] Add manual booking (bottom sheet modal)
- [x] Delete booking with confirmation
- [x] WhatsApp client directly from booking card
- [x] Booking stats overview

### 🖼️ Portfolio
- [x] Grid gallery with category tabs
- [x] Categories: All, Wedding, Pre-Wedding, Events
- [x] Fullscreen lightbox preview
- [x] Placeholder design (ready for real photos)

### 🎨 UI/UX
- [x] Dark luxury theme + gold accents (#C9A84C)
- [x] Glassmorphism cards
- [x] Smooth animations (fade-up on scroll)
- [x] Particle hero animation
- [x] Mobile-first responsive design
- [x] Bottom sticky nav with Book CTA center
- [x] Cormorant Garamond + Montserrat + Playfair Display fonts
- [x] Custom scrollbar, selection colors

---

## 🚀 Setup Guide

### Step 1: Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add Project** → Name it (e.g., `trending-photography`)
3. Disable Google Analytics (optional) → **Create Project**

### Step 2: Enable Authentication

1. Left sidebar → **Authentication** → **Get Started**
2. **Sign-in method** tab → Enable **Email/Password**
3. Click **Save**

### Step 3: Create Firestore Database

1. Left sidebar → **Firestore Database** → **Create Database**
2. Choose **Start in production mode** (we'll add rules)
3. Select a region close to India (e.g., `asia-south1`)
4. Click **Done**

### Step 4: Get Your Firebase Config

1. Project Settings (gear icon) → **General**
2. Scroll to **Your apps** → Click **</>** (Web)
3. Register app → Copy the `firebaseConfig` object

### Step 5: Update Config in app.js

Open `js/app.js` and replace:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",              // ← Replace
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Also update:
```javascript
const ADMIN_EMAIL = "lavkush@trendingphotography.in"; // Your admin email
const WHATSAPP_NUMBER = "919876543210";               // Your WhatsApp (no +)
```

### Step 6: Deploy Firestore Rules

In the Firebase Console → **Firestore** → **Rules** tab, paste contents of `firestore.rules`.

---

## 📦 Firebase CLI Deployment

### Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Login & Initialize
```bash
firebase login
cd trending-photography
firebase init
```

Select:
- **Firestore** ✓
- **Hosting** ✓
- Public directory: `.` (dot, current folder)
- Single-page app: **Yes**
- Don't overwrite `index.html`

### Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

### Deploy Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Website
```bash
firebase deploy --only hosting
```

### Deploy Everything
```bash
firebase deploy
```

Your site will be live at: `https://your-project-id.web.app`

---

## 🖼️ Adding Real Portfolio Photos

Replace the placeholder grid in `js/app.js` with your actual image URLs:

```javascript
const PORTFOLIO_ITEMS = [
  { cat: 'Wedding', label: 'Sacred Union', img: 'assets/wedding-1.jpg' },
  { cat: 'Wedding', label: 'Golden Hour', img: 'assets/wedding-2.jpg' },
  // ... add more
];
```

Then in `renderPortfolio()`, replace `portfolio-placeholder` with:
```html
<img class="portfolio-img" src="${item.img}" alt="${item.label}" loading="lazy"/>
```

---

## 🎥 Adding Hero Video

1. Place your video file as `assets/hero.mp4`
2. In `index.html`, find `id="heroVideoWrap"` and change `display:none` to `display:block`

```html
<div class="hero-video-wrap" id="heroVideoWrap">  <!-- remove style="display:none" -->
```

Recommended: 10-30 second loop, 720p, compressed (~5MB)

---

## 🗃️ Database Structure

```
Firestore/
├── users/
│   └── {userId}/
│       ├── name: "Rajesh Kumar"
│       ├── email: "rajesh@gmail.com"
│       └── createdAt: Timestamp
│
└── bookings/
    └── {bookingId}/
        ├── userId: "abc123"
        ├── userEmail: "rajesh@gmail.com"
        ├── name: "Rajesh Kumar"
        ├── phone: "9876543210"
        ├── eventType: "Wedding"
        ├── date: "2025-12-15"
        ├── location: "Delhi"
        ├── package: "standard"
        ├── notes: "Outdoor shots preferred"
        ├── status: "pending"  ← pending|confirmed|completed|cancelled
        └── createdAt: Timestamp
```

---

## 🔒 Security Model

| Action | Regular User | Admin |
|--------|-------------|-------|
| Create booking | ✅ Own only | ✅ Any |
| Read bookings | ✅ Own only | ✅ All |
| Update status | ❌ | ✅ |
| Delete booking | ❌ | ✅ |
| Add manual booking | ❌ | ✅ |
| View all users | ❌ | ✅ |

---

## 📱 Admin Account Setup

1. First deploy the app
2. Go to your live URL → Account → Sign Up with your admin email
   - Email: `lavkush@trendingphotography.in` (or whatever you set in app.js)
   - Create password
3. After signup, you'll automatically see the Admin panel in bottom nav

---

## 💬 WhatsApp Integration

Update your WhatsApp number in `js/app.js`:
```javascript
const WHATSAPP_NUMBER = "919876543210"; // 91 = India country code
```

The app auto-generates WhatsApp messages for:
- Booking confirmations
- Client cancellation requests  
- Admin reaching out to clients

---

## 🎨 Customization

### Colors (css/style.css)
```css
:root {
  --gold: #C9A84C;        /* Main gold */
  --gold-light: #E8C97A;  /* Light gold */
  --gold-dark: #9A7A2E;   /* Dark gold */
  --bg-deep: #080808;     /* Darkest bg */
  --bg-dark: #0E0E0E;     /* Section bg */
}
```

### Pricing
Edit the pricing cards in `index.html` (search for `₹8,000`, `₹18,000`, `₹35,000`).

### Testimonials
Find `id="testimonialsTrack"` in `index.html` and edit the testimonial cards.

### Contact Info
Search for `919876543210` and `lavkush@trendingphotography.in` — replace throughout.

---

## 📞 Support

Built for **Lavkush – Trending Photography**

For issues, reach out via WhatsApp or email as configured in the app.

---

*Made with ❤️ — Capturing Happy Moments That Last Forever*
