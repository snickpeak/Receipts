# Product Requirements Document
## Receipts – Private Journal
**Version:** 1.0  
**Status:** Submitted to App Store  
**Last Updated:** May 2026

---

## 1. Product Overview

Receipts – Private Journal is a privacy-first iOS journaling app that lets users capture, organize, and retrieve personal moments, wins, memories, and promises. Unlike most journaling apps, Receipts has no social layer, no ads, and no analytics. It is built for intentional documenters who want a permanent, secure record of their own life.

The app is live on the Apple App Store (Build 31, version 1.0.0) under bundle ID `com.receiptsapp.journal`.

---

## 2. Problem Statement

Most journaling and note-taking apps are built around sharing, streaks, or social validation. They turn private reflection into performance. At the same time, people routinely forget their own wins, lose track of promises made to them, and have no structured place to keep personal proof of what happened and when.

There is no focused, private, secure tool designed specifically for capturing life receipts — moments that matter and that you may need to reference later.

---

## 3. Target Users

**Primary:** Adults 18–35 who document intentionally — people tracking goals, career wins, personal growth, or relationships. They are privacy-conscious and trust-skeptical of big-tech journaling apps.

**Secondary:** Anyone who has experienced a situation where they wish they had documentation — a toxic workplace, a broken promise, a personal milestone that faded.

**Accessibility:** Users who rely on reduced motion, dynamic font sizes, or dark mode are explicitly supported.

---

## 4. Goals

**Product Goals**
- Provide the most private, secure journaling experience available on iOS
- Make capturing a moment as fast as possible (< 30 seconds from launch to saved entry)
- Give users full ownership and portability of their data

**Business Goals**
- Successful App Store launch with positive initial reviews
- Establish a trusted brand around privacy and data ownership
- Build a foundation for a sustainable freemium model in v2

**Non-Goals (v1.0)**
- Social features, sharing, or public profiles
- Android release (planned for v1.1)
- Subscription or monetization layer (planned for v2)
- On-device AI or LLM integration (roadmap)
- iCloud or third-party sync integrations (roadmap)

---

## 5. Core Features

### 5.1 Entry Creation
- Write entries with a title and rich text notes
- Attach one or more photos from camera or gallery
- Record and attach a voice memo (native audio; Web Speech API on web)
- Add a mood via emoji picker
- Auto-tag location via GPS or search/manually add a place
- Apply one or more category tags (default: Win, Money, Memory, Promise, Proof; fully customizable)
- Link related entries together

### 5.2 Organization
- **Timeline view** — entries grouped by Today, Yesterday, This Week, Earlier; filterable by tag
- **Pinned Strip** — up to 5 entries pinned to a horizontal strip at the top of the timeline
- **Starred entries** — bookmark important memories
- **Calendar view** — 12-week activity heatmap plus full calendar drill-down by day
- **Search** — keyword search and semantic search (TF-IDF ranking) across all entries
- **On This Day** — surfaces entries from the same date in prior years
- **Memory Threads** — clusters related entries by tag and time proximity
- **Places** — browse all geo-tagged entries
- **Trash** — soft-delete with 30-day hold before permanent purge

### 5.3 Privacy & Security
- **Clerk authentication** — sign in with email; secure session management
- **Guest mode** — local-only use without an account
- **App-wide PIN + biometric lock** — Face ID / Touch ID on launch
- **Decoy PIN mode** — secondary PIN reveals a clean, empty journal state
- **Per-entry lock** — individual entries locked behind a fresh biometric prompt
- **Panic Shake** — shake device to instantly lock the app
- **Screenshot & screen recording prevention** — blocked on native platforms
- **Background blur overlay** — UI blurred when app is sent to background
- **Optional E2E encryption** — entries encrypted on-device with user's PIN before cloud sync
- **Tamper detection** — FNV-1a hash chain alerts user if data is modified outside the app

### 5.4 Data & Portability
- **Cloud sync** — background sync with offline-first queue
- **Local-only mode** — toggle to disable all cloud sync
- **Markdown export** — full journal or individual entries
- **On-device OCR** — extract text from photos directly into entry notes

### 5.5 Insights
- **Weekly Digest** — entry count, word count, 12-week heatmap, top words, mood overview
- **Streak system** — consecutive journaling days tracked with milestone animations

### 5.6 Experience
- **Animated intro** — 3D logo video (3.3s) with custom Blankit handwriting font reveal on every launch
- **Dark mode** — full system/light/dark theming
- **Reduced Motion support** — all animations respect system accessibility setting
- **Haptic feedback** — configurable
- **Dynamic font sizes** — respects system text size preferences
- **i18n** — English and Ethiopic string support

---

## 6. User Flows

### New User — First Launch
1. Splash screen with 3D intro video and handwriting title animation
2. Landing page — "Open Preview" or "Go to Sign In"
3. Sign up with email via Clerk
4. Onboarding screen explaining core concepts
5. Redirect to Timeline (empty state)

### Returning User — Write an Entry
1. Launch → intro video → Timeline
2. Tap "+" or compose button → Add Entry screen
3. Enter title, body, tags, mood, optional media
4. Save → entry appears at top of Timeline

### Security — Locked Entry
1. User taps a locked entry in Timeline
2. Face ID / Touch ID prompt
3. On success → entry detail view
4. On failure → entry remains locked

### Decoy Mode
1. User opens app in a sensitive situation
2. Enters secondary (decoy) PIN instead of real PIN
3. App loads with a completely empty journal state
4. Real data is hidden until correct PIN is entered

---

## 7. Privacy & Security Considerations

- No advertising SDKs or third-party analytics included
- All sensitive API permissions (camera, microphone, location, Face ID) include descriptive permission strings per Apple requirements
- `ITSAppUsesNonExemptEncryption: false` declared in App Store compliance
- Apple Privacy Manifest completed
- Data declared to Apple: email address, user ID, photos/videos, audio data, other user content, precise location, search history — all for App Functionality only, not tracking
- Privacy policy hosted publicly; contact: receipts.support@gmail.com

---

## 8. Success Metrics

| Metric | Target (30 days post-launch) |
|---|---|
| App Store rating | ≥ 4.5 stars |
| Crash-free sessions | ≥ 99% |
| Day-7 retention | ≥ 30% |
| Avg entries per active user/week | ≥ 3 |
| App Review approval | First submission |

---

## 9. Release Scope

**v1.0 (Current — Submitted)**
- Full iOS feature set as described above
- App Store distribution
- Clerk auth + guest mode
- Cloud sync + local-only mode

**v1.1 (Planned)**
- Android release via Google Play

**v2.0 (Planned)**
- Freemium subscription tier
- iCloud sync
- Apple Watch quick-capture companion
- On-device AI entry querying
