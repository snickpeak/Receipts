# Receipts | Private Journal

> *Keep receipts on the life you're building.*

[![Platform](https://img.shields.io/badge/platform-iOS-black?style=flat-square&logo=apple)](https://apps.apple.com)
[![Built with Expo](https://img.shields.io/badge/built%20with-Expo%2054-000020?style=flat-square&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Auth](https://img.shields.io/badge/auth-Clerk-6C47FF?style=flat-square)](https://clerk.com)
[![Release](https://img.shields.io/badge/release-App%20Store%20Review-0D96F6?style=flat-square&logo=apple)](https://apps.apple.com)

---

## Case Study

### The Problem

Most journaling apps are built around streaks, sharing, and gamification. They turn something deeply personal into a performance. At the same time, people routinely lose track of their own story — wins get forgotten, promises fade, the moments that actually shaped you disappear into your camera roll or the back of your mind.

There was no focused, private, secure place to keep receipts on what you did, what was said, and what you've built.

### The Approach

Receipts takes the opposite position from every mainstream journaling app. No social layer. No ads. No analytics. Instead: the fastest possible path from moment to saved entry, layered with the most comprehensive privacy controls available on iOS.

The product is built for intentional documenters — people who know the value of having proof.

### Key Product Decisions

**Privacy as the core product, not a feature.** Every design decision is filtered through one question: does this protect or compromise the user's data? This led to building decoy PIN mode, per-entry biometric locking, screenshot prevention, background blur, panic shake, and optional E2E encryption — not as premium upsells, but as defaults.

**Speed of capture over richness of features.** The entry composer is the heart of the app. Every element — tags, mood, location, voice, OCR — is accessible from a single screen with no required fields. A moment can be captured in under 30 seconds.

**Offline-first architecture.** Cloud sync is opt-in. Local-only mode is a first-class option. Entries created offline queue and sync automatically when connectivity returns. Data portability (Markdown export) is always available regardless of sync state.

**A deliberate visual identity.** The animated intro — a 3D logo video followed by a handwritten title reveal using the custom Blankit font — communicates tone before the user writes a single word. This is a private, considered tool, not another utility app.

### What Was Built

A full-featured iOS journaling app submitted to the Apple App Store in one development cycle, including:

- Rich entry creation with photo, voice, OCR, location, mood, and custom tags
- Multi-layered privacy: app lock, decoy mode, per-entry lock, panic shake, screenshot prevention
- Timeline, calendar, semantic search, On This Day, Memory Threads, Places
- Weekly Digest, journaling streaks, and Trash with soft delete
- Cloud sync with offline-first queue and local-only mode
- Markdown export and full data portability
- Custom animated intro with Blankit handwriting font
- Full dark mode, Reduce Motion support, dynamic font sizes, haptic feedback

### Technical Highlights

- **React Native + Expo SDK 54** with New Architecture and React Compiler enabled
- **File-based routing** via Expo Router 6 for clean, maintainable navigation
- **Clerk** for authentication — no custom session management
- **TanStack Query v5** for server state with optimistic updates
- **React Native Reanimated 4** for all animations
- **Tamper detection** via FNV-1a hash chain — entries form a verifiable chain; any external modification is detected
- **On-device OCR** via expo-text-extractor — no image data leaves the device
- **EAS Build + EAS Submit** — production iOS build auto-submitted to TestFlight

---

## Product & SDLC Documentation

| Document | Description |
|---|---|
| [PRD](./docs/PRD.md) | Product requirements, problem statement, goals, user flows, success metrics |
| [User Stories](./docs/USER_STORIES.md) | Feature-area user stories with acceptance criteria |
| [Roadmap](./docs/ROADMAP.md) | Current release, near-term improvements, future enhancements, technical debt |
| [QA Test Plan](./docs/QA_TEST_PLAN.md) | Manual QA checklist for all major feature areas |
| [Release Checklist](./docs/RELEASE_CHECKLIST.md) | App Store Connect, TestFlight, privacy, and pre-submission checklist |
| [Backlog](./docs/BACKLOG.md) | Prioritized MoSCoW backlog with feature, rationale, and status |

---

## Screenshots

> App Store screenshots coming post-approval.

---

## Features

**Core Journal**
- Write entries with rich media — attach photos, voice memos, and auto-tagged GPS locations
- OCR scanning — extract text directly from physical receipts, notes, or screenshots via camera
- Mood tracking — emoji-based emotional context per entry
- Entry templates — structured prompts for quick, consistent logging
- Pin important entries to the top of your timeline
- Per-entry biometric lock — hide individual entries behind Face ID

**Organization**
- Tags — Win, Money, Memory, Promise, Proof (fully customizable)
- Search — keyword and semantic (TF-IDF ranking) across all entries
- Calendar view — year heatmap, month grid, and day drill-down
- Memory Threads — automatically clusters related entries by tag and time proximity
- Places — browse all geo-tagged entries with map integration
- On This Day — surfaces entries from the same date in past years

**Security & Privacy**
- App-level PIN and biometric lock (Face ID)
- Decoy PIN mode — shows a sanitized version of your journal under a secondary PIN
- Per-entry biometric lock
- Panic Shake — shake to lock instantly
- Screenshot and screen recording prevention
- Background blur overlay in app switcher
- Optional end-to-end encryption for cloud sync
- Tamper detection via hash chain
- No ads, no analytics, no data sold

**Data & Portability**
- Full Markdown export
- Trash bin with 30-day soft delete before permanent removal
- Guest mode for local-only use without an account
- Local-only mode — disable cloud sync entirely
- Offline-first sync queue

**Experience**
- 3D animated intro video on every launch
- Handwritten "Receipts" title reveal with custom Blankit font
- Weekly Digest — 7-day summary of entries, streaks, word counts, and mood overview
- Reduce Motion support throughout
- Full dark mode
- Dynamic font size support
- i18n support (English + Ethiopic)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.9 |
| Framework | React Native 0.81.5 |
| SDK | Expo 54 |
| Navigation | Expo Router 6 (file-based) |
| Auth | Clerk (`@clerk/expo` v3) |
| Data Fetching | TanStack Query v5 |
| Animations | React Native Reanimated 4 |
| Local Storage | AsyncStorage + SecureStore |
| Build & Deploy | EAS Build + EAS Submit |
| Package Manager | pnpm |
| React Compiler | Enabled (experimental) |
| New Architecture | Enabled |

---

## Project Structure

```
├── app/                        # File-based routes (Expo Router)
│   ├── (auth)/                 # Sign in / Sign up
│   ├── (tabs)/                 # Main tab navigator
│   │   ├── index.tsx           # Timeline (home feed)
│   │   ├── search.tsx          # Semantic + keyword search
│   │   ├── calendar.tsx        # Calendar heatmap view
│   │   └── settings.tsx        # Settings and preferences
│   ├── add.tsx                 # New entry composer
│   ├── entry/[id].tsx          # Entry detail + edit
│   ├── digest.tsx              # Weekly digest
│   ├── threads.tsx             # Memory threads
│   ├── places.tsx              # Geo-tagged entries map
│   ├── trash.tsx               # Deleted entries
│   ├── onboarding.tsx          # First-run onboarding
│   ├── _layout.tsx             # Root layout + providers
│   └── index.tsx               # Landing page + intro overlay
├── assets/
│   ├── fonts/                  # Custom fonts (Blankit)
│   ├── images/                 # App icon + images
│   └── videos/                 # 3D intro video
├── components/                 # Shared UI components
├── context/                    # React context providers (settings, auth)
├── hooks/                      # Custom hooks
├── constants/                  # Colors, theme, config
├── lib/                        # Utility functions, search logic
├── types/                      # TypeScript type definitions
├── i18n/                       # Internationalization strings
├── docs/                       # Product & SDLC documentation
├── app.json                    # Expo configuration
└── eas.json                    # EAS build + submit profiles
```

---

## SDLC Process

**1. Discovery & Scoping**
Defined the core problem — existing journaling apps are too social, too gamified, or too simple. Scoped MVP features around private capture, organization, and retrieval of personal entries.

**2. Architecture**
Chose React Native + Expo for cross-platform reach and fast iteration. File-based routing via Expo Router for maintainable navigation. Clerk for auth to avoid building custom session management. TanStack Query for server state with optimistic updates.

**3. Development**
Built in vertical slices — auth flow first, then core entry CRUD, then search/calendar, then advanced features (OCR, voice memos, geolocation, biometric lock). TypeScript throughout with strict mode enabled.

**4. Quality**
TypeScript compiler (`tsc --noEmit`) as primary static analysis. React Compiler enabled for automatic memoization. Tested on physical iPhone hardware via Expo Go and development builds. Full manual QA checklist documented in [docs/QA_TEST_PLAN.md](./docs/QA_TEST_PLAN.md).

**5. Build & Release**
EAS Build configured with `development`, `preview`, and `production` profiles. Production iOS builds auto-submitted to TestFlight via `eas build --auto-submit`. Build 31 submitted to Apple App Store Review on May 22, 2026.

**6. Privacy & Compliance**
Apple Privacy Manifest completed. Permission strings written for all sensitive APIs (Face ID, camera, microphone, location). `ITSAppUsesNonExemptEncryption: false` declared. No third-party analytics or ad SDKs included. Full release checklist in [docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md).

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Expo CLI (`npm install -g expo-cli`)
- iOS device or Simulator

### Install

```bash
git clone https://github.com/snickpeak/Receipts.git
cd Receipts
pnpm install
```

### Environment Variables

Create a `.env` file in the root:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### Run

```bash
pnpm dev
```

Press `i` to open in iOS Simulator or scan the QR code with Expo Go.

### Production Build

```bash
eas build --platform ios --profile production --auto-submit
```

---

## Roadmap

See the full roadmap in [docs/ROADMAP.md](./docs/ROADMAP.md).

- [ ] Android release via Google Play
- [ ] iCloud sync for cross-device access
- [ ] Apple Watch companion — quick capture from wrist
- [ ] On-device AI — query your entries locally with no internet
- [ ] NFC trigger points — tap a sticker to instantly open a new entry
- [ ] Widgets — lock screen and home screen receipt display
- [ ] Scan tab — point camera at anything to capture it as a receipt
- [ ] StandBy mode — ambient display while charging

---

## License

MIT — see [LICENSE](./LICENSE) for details.
