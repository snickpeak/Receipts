# Changelog
## Receipts – Private Journal

All notable changes to this project are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2026-05-22

### Submitted to Apple App Store Review

First public release. Built and shipped solo from concept to App Store submission.

### Added

**Core Journaling**
- Entry creation with title and rich text body
- Photo attachments from camera or gallery with optional metadata stripping
- On-device OCR — extract text from any photo directly into the entry body
- Voice memo recording and playback attached to entries
- Emoji mood picker per entry
- GPS auto-tagging with human-readable place name resolution
- Manual place search and tagging
- Link related entries together

**Organization**
- Timeline view grouped by Today, Yesterday, This Week, Earlier
- Tag-based filtering on the timeline
- Pinned strip — up to 5 entries pinned to a horizontal strip above the timeline
- Starred entries for quick bookmarking
- Semantic + keyword search using TF-IDF ranking across all entries
- Calendar view with 12-week activity heatmap and full month grid
- On This Day — surfaces entries from the same date in prior years
- Memory Threads — clusters related entries by tag and time proximity
- Places view — all geo-tagged entries in one screen
- Trash with 30-day soft delete before permanent purge

**Tags**
- Default tags: Win, Money, Memory, Promise, Proof
- Custom tags with name, color, and icon
- Tag chips displayed in entry list and detail views

**Privacy & Security**
- Clerk authentication with encrypted SecureStore token storage
- Guest mode — full local-only usage without an account
- App-wide biometric lock (Face ID + PIN fallback)
- Decoy PIN mode — secondary PIN loads a clean empty journal state
- Per-entry biometric lock requiring a fresh Face ID prompt
- Panic Shake — accelerometer-detected shake instantly locks the app
- Screenshot and screen recording prevention
- Background blur overlay when app is sent to background
- Optional end-to-end encryption for cloud sync entries
- Tamper detection via FNV-1a hash chain across all entries
- Local-only mode — disables all cloud sync

**Data & Portability**
- Offline-first sync queue — durable across app restarts
- Cloud sync with background retry
- Markdown export for full journal and individual entries
- Full data ownership — no lock-in

**Insights**
- Weekly Digest — entry count, word count, 12-week heatmap, top words, mood breakdown
- Journaling streak tracker with milestone animations

**Experience**
- 3D intro animation video on every launch
- Blankit handwriting font reveal — left-to-right letter animation (150ms stagger, 450ms per letter)
- No white flash before intro video renders
- Full dark mode, light mode, and system-matched theming
- Reduced Motion support throughout all animations
- Configurable haptic feedback
- Dynamic font size support
- i18n strings for English and Ethiopic

**Technical**
- Expo SDK 54 with New Architecture enabled
- React Compiler enabled (experimental)
- File-based routing via Expo Router 6
- TanStack Query v5 for server state
- React Native Reanimated 4 for all animations
- EAS Build + EAS Submit for App Store distribution
- TypeScript 5.9 in strict mode throughout
- GitHub Actions CI — TypeScript check on every push

---

## [Unreleased]

Tracking planned work. See [ROADMAP.md](./docs/ROADMAP.md) and [BACKLOG.md](./docs/BACKLOG.md) for details.

- Android release via Google Play
- App Store rating prompt (post-engagement trigger)
- Entry templates UI polish
- iPad layout optimization
- iCloud sync
- Apple Watch quick-capture companion
- Freemium subscription tier
- On-device AI entry querying
- Widgets (lock screen + home screen)
