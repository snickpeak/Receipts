# User Stories
## Receipts – Private Journal
**Version:** 1.0  
**Last Updated:** May 2026

Stories are organized by feature area. Status labels: **Built**, **Planned**, **In Progress**.

---

## Authentication & Onboarding

### US-001 — Sign Up
**As a** new user,  
**I want to** create an account with my email address,  
**So that** my journal is backed up and accessible if I reinstall the app.

**Status:** Built  
**Acceptance Criteria:**
- [ ] User can enter email and password on the sign-up screen
- [ ] Clerk handles session creation and token storage securely
- [ ] User is redirected to onboarding on first sign-up
- [ ] Error states shown for invalid email or weak password

---

### US-002 — Sign In
**As a** returning user,  
**I want to** sign in to my existing account,  
**So that** my entries are restored across devices.

**Status:** Built  
**Acceptance Criteria:**
- [ ] User can sign in with email and password
- [ ] Successful sign-in redirects to Timeline
- [ ] Incorrect credentials show a clear error message
- [ ] Session persists across app restarts without requiring re-login

---

### US-003 — Guest Mode
**As a** privacy-conscious user,  
**I want to** use the app without creating an account,  
**So that** none of my data ever touches a server.

**Status:** Built  
**Acceptance Criteria:**
- [ ] "Continue without account" option available on landing page
- [ ] All data stored locally only in guest mode
- [ ] Cloud sync features are hidden or disabled in guest mode
- [ ] User can upgrade to a full account from settings without losing local data

---

### US-004 — Onboarding
**As a** first-time user,  
**I want to** understand what the app is for and how to use it,  
**So that** I can get value from it immediately.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Onboarding screen shown once on first launch post-signup
- [ ] Key concepts explained: entries, tags, privacy lock
- [ ] Skip option available
- [ ] Never shown again after first completion

---

## Entry Creation

### US-005 — Write a Journal Entry
**As a** user,  
**I want to** write a titled entry with body text,  
**So that** I can record a moment or thought in detail.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Compose screen has title and body text inputs
- [ ] Entry saves with a timestamp on submission
- [ ] Entry appears at top of Timeline immediately after saving
- [ ] Empty entries (no title, no body) are not saved

---

### US-006 — Attach a Photo
**As a** user,  
**I want to** attach a photo to my entry,  
**So that** I have visual context for what I wrote.

**Status:** Built  
**Acceptance Criteria:**
- [ ] User can open camera or choose from gallery
- [ ] Multiple photos can be attached to one entry
- [ ] Photos display as thumbnails in the entry detail view
- [ ] Full-screen pinch-to-zoom viewer available on tap
- [ ] Option to strip photo metadata before saving (privacy setting)

---

### US-007 — Extract Text from a Photo (OCR)
**As a** user,  
**I want to** take a photo of a physical receipt, note, or document and have the text extracted,  
**So that** I can search and read it without retyping.

**Status:** Built  
**Acceptance Criteria:**
- [ ] OCR runs on-device using expo-text-extractor
- [ ] Extracted text is inserted into the entry body
- [ ] No image data is sent to an external service
- [ ] User can edit the extracted text before saving

---

### US-008 — Record a Voice Memo
**As a** user,  
**I want to** record my voice and attach it to an entry,  
**So that** I can capture thoughts faster than typing.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Record button available in the compose screen
- [ ] High-quality audio recorded and attached to the entry
- [ ] Memo playable from entry detail view
- [ ] On web: live transcription via Web Speech API

---

### US-009 — Add a Mood
**As a** user,  
**I want to** tag an entry with a mood emoji,  
**So that** I can track how I was feeling when I wrote it.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Emoji picker available in the compose screen
- [ ] One mood per entry
- [ ] Mood displayed in the entry list and detail view
- [ ] Mood included in Weekly Digest summary

---

### US-010 — Geo-tag an Entry
**As a** user,  
**I want to** automatically attach my location to an entry,  
**So that** I remember where I was when it happened.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Location permission requested with a clear explanation
- [ ] GPS coordinates captured and attached on entry save
- [ ] Location displayed as a human-readable place name in entry detail
- [ ] User can manually search and set a place instead
- [ ] Location tagging can be disabled globally in settings

---

### US-011 — Apply Tags
**As a** user,  
**I want to** tag my entries with categories like Win, Money, or Promise,  
**So that** I can filter and find them easily later.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Default tags available: Win, Money, Memory, Promise, Proof
- [ ] Multiple tags can be applied to a single entry
- [ ] Tags are displayed as colored chips in the entry list and detail
- [ ] User can filter Timeline by one or more tags
- [ ] Custom tags can be created with a name, color, and icon

---

## Organization & Navigation

### US-012 — Browse the Timeline
**As a** user,  
**I want to** scroll through all my entries grouped by time period,  
**So that** I can review what I've documented recently.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Entries grouped as: Today, Yesterday, This Week, Earlier
- [ ] Each entry shows title, date, tags, and mood at a glance
- [ ] Timeline is filterable by tag
- [ ] Empty state shown when no entries exist

---

### US-013 — Pin Entries
**As a** user,  
**I want to** pin up to 5 entries to the top of my Timeline,  
**So that** my most important receipts are always visible.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Pin option available from entry detail or long-press
- [ ] Pinned entries appear in a horizontal strip above the main timeline
- [ ] Maximum of 5 pinned entries enforced
- [ ] Unpin option available from the pinned strip

---

### US-014 — Search Entries
**As a** user,  
**I want to** search my journal by keyword,  
**So that** I can find a specific entry without scrolling.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Search bar in the Search tab
- [ ] Keyword search returns matching entries instantly
- [ ] Semantic search (TF-IDF) returns thematically related results
- [ ] Results highlight the matching text
- [ ] Empty results state shown when no matches found

---

### US-015 — Calendar View
**As a** user,  
**I want to** see a calendar showing which days I journaled,  
**So that** I can visualize my consistency over time.

**Status:** Built  
**Acceptance Criteria:**
- [ ] 12-week activity heatmap displayed
- [ ] Full calendar month grid available
- [ ] Tapping a day shows all entries from that date
- [ ] Days with entries are visually distinct from empty days

---

### US-016 — On This Day
**As a** user,  
**I want to** see entries I wrote on this same date in previous years,  
**So that** I can reflect on how far I've come.

**Status:** Built  
**Acceptance Criteria:**
- [ ] On This Day section appears on the Timeline when past entries match today's date
- [ ] Entries are grouped by year
- [ ] Tapping opens the entry detail view

---

### US-017 — Trash & Soft Delete
**As a** user,  
**I want to** delete an entry without losing it immediately,  
**So that** I can recover it if I change my mind.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Deleted entries move to Trash, not permanently removed
- [ ] Trash holds entries for 30 days before auto-purging
- [ ] User can restore an entry from Trash
- [ ] User can permanently delete from Trash manually

---

## Privacy & Security

### US-018 — App-Level Biometric Lock
**As a** user,  
**I want to** require Face ID or a PIN to open the app,  
**So that** no one can read my journal if they pick up my phone.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Biometric lock prompt shown on every app launch
- [ ] PIN fallback available if Face ID fails
- [ ] App content not visible until authentication succeeds
- [ ] Lock respects system accessibility settings

---

### US-019 — Decoy PIN
**As a** user,  
**I want to** set a secondary PIN that shows an empty journal,  
**So that** I can open the app in front of others without revealing my real entries.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Secondary PIN configurable in Security settings
- [ ] Entering the decoy PIN loads a completely clean journal state
- [ ] Real data is not accessible until the correct PIN is entered
- [ ] Decoy mode is visually indistinguishable from a real empty journal

---

### US-020 — Per-Entry Lock
**As a** user,  
**I want to** lock individual entries behind biometrics,  
**So that** even if someone is using my unlocked phone, certain entries stay private.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Lock option available on any entry
- [ ] Locked entries show a lock icon in the Timeline
- [ ] Opening a locked entry requires a fresh Face ID prompt
- [ ] Locked entries remain locked even if the app is already unlocked

---

### US-021 — Panic Shake
**As a** user,  
**I want to** shake my phone to instantly lock the app,  
**So that** I can close it fast in an unexpected situation.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Shake gesture detected reliably on physical device
- [ ] App locks immediately on shake — no animation delay
- [ ] Shake sensitivity is not configurable (consistent behavior)

---

### US-022 — Screenshot Prevention
**As a** user,  
**I want to** prevent anyone from screenshotting or screen recording my journal,  
**So that** my private entries can't be captured and shared.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Screenshot results in a blank or blocked image on native iOS
- [ ] Screen recording shows a blurred or blank app content
- [ ] Feature is active by default, no toggle required

---

## Data & Export

### US-023 — Export Journal
**As a** user,  
**I want to** export my entire journal to Markdown,  
**So that** I have a backup that I own and can read anywhere.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Export option available in Settings
- [ ] Full journal exported as Markdown files
- [ ] Individual entries can also be exported
- [ ] Export includes entry text, date, tags, and mood

---

### US-024 — Local-Only Mode
**As a** user,  
**I want to** disable cloud sync entirely,  
**So that** my journal data never leaves my device.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Toggle available in Settings to disable cloud sync
- [ ] When disabled, no network requests are made for entry data
- [ ] User is informed that data will not be backed up in this mode

---

## Insights

### US-025 — Weekly Digest
**As a** user,  
**I want to** see a weekly summary of my journaling activity,  
**So that** I can track my consistency and growth over time.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Digest accessible from the main navigation
- [ ] Shows: entry count, total word count, 12-week heatmap, top words used, mood breakdown
- [ ] Covers the last 7 days
- [ ] Empty state shown when no entries exist in the period

---

### US-026 — Journaling Streak
**As a** user,  
**I want to** see how many consecutive days I've journaled,  
**So that** I feel motivated to keep my streak alive.

**Status:** Built  
**Acceptance Criteria:**
- [ ] Streak count displayed and updated daily
- [ ] Streak breaks if no entry is saved in a calendar day
- [ ] Milestone animations shown at key streak counts
- [ ] Streak is not the primary UI focus (privacy-first philosophy maintained)

---

## Planned Features

### US-027 — Android Support
**As an** Android user,  
**I want to** download Receipts from the Google Play Store,  
**So that** I can journal on my device.

**Status:** Planned

---

### US-028 — iCloud Sync
**As a** user with multiple Apple devices,  
**I want to** sync my journal via iCloud,  
**So that** my entries are accessible on my iPhone and iPad without a server.

**Status:** Planned

---

### US-029 — Apple Watch Quick Capture
**As a** user,  
**I want to** log a quick entry from my Apple Watch,  
**So that** I can capture a moment without taking out my phone.

**Status:** Planned

---

### US-030 — On-Device AI Query
**As a** user,  
**I want to** ask my journal a question in plain English,  
**So that** I can find patterns and insights without manual searching.

**Status:** Planned
