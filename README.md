# Receipts | Private Journal

> *Keep receipts on the life you're building.*

[![Platform](https://img.shields.io/badge/platform-iOS-black?style=flat-square&logo=apple)](https://apps.apple.com)
[![Built with Expo](https://img.shields.io/badge/built%20with-Expo%2054-000020?style=flat-square&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Auth](https://img.shields.io/badge/auth-Clerk-6C47FF?style=flat-square)](https://clerk.com)
[![Release](https://img.shields.io/badge/release-TestFlight-0D96F6?style=flat-square&logo=apple)](https://testflight.apple.com)

---

## Screenshots

> Build in progress — TestFlight screenshots coming soon.

---

## Problem Statement

Most journaling apps are built around streaks, sharing, and gamification. They turn something deeply personal into a performance. Receipts takes the opposite position.

People lose track of their own story. Wins get forgotten. Promises fade. The moments that actually shaped you disappear into your camera roll or the back of your mind. There's no private, focused place to keep receipts on what you did, what was said, and what you've built — until now.

Receipts is a private, offline-first journal with no social layer. It's built for people who document intentionally.

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
- Encrypted token storage via Expo SecureStore
- Screen capture prevention
- No ads, no analytics, no data sold

**Data & Portability**
- Full JSON and Markdown export
- Automatic backup support
- Trash bin with soft delete before permanent removal
- Guest mode for local-only use without an account

**Experience**
- 3D animated intro video on every launch
- Handwritten "Receipts" title reveal with custom Blankit font
- Weekly Digest — 7-day summary of entries, streaks, word counts, and mood overview
- Reduce Motion support throughout
- Full dark mode
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
├── app.json                    # Expo configuration
└── eas.json                    # EAS build + submit profiles
```

---

## SDLC Process

This project followed a full software development lifecycle from concept to App Store submission.

**1. Discovery & Scoping**
Defined the core problem — existing journaling apps are too social, too gamified, or too simple. Scoped MVP features around private capture, organization, and retrieval of personal entries.

**2. Architecture**
Chose React Native + Expo for cross-platform reach and fast iteration. File-based routing via Expo Router for maintainable navigation. Clerk for auth to avoid building custom session management. TanStack Query for server state with optimistic updates.

**3. Development**
Built in vertical slices — auth flow first, then core entry CRUD, then search/calendar, then advanced features (OCR, voice memos, geolocation, biometric lock). TypeScript throughout with strict mode enabled.

**4. Quality**
TypeScript compiler (`tsc --noEmit`) as primary static analysis. React Compiler enabled for automatic memoization. Tested on physical iPhone hardware via Expo Go and development builds.

**5. Build & Release**
EAS Build configured with `development`, `preview`, and `production` profiles. Production iOS builds auto-submitted to TestFlight via `eas build --auto-submit`. Android EAS Submit configured for Google Play internal track.

**6. Privacy & Compliance**
Apple Privacy Manifest completed. Permission strings written for all sensitive APIs (Face ID, camera, microphone, location). `ITSAppUsesNonExemptEncryption: false` declared. No third-party analytics or ad SDKs included.

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

- [ ] Android release via Google Play
- [ ] iCloud sync for cross-device access
- [ ] Apple Watch companion — quick capture from wrist
- [ ] On-device AI — query your entries locally with no internet
- [ ] NFC trigger points — tap a sticker to instantly open a new entry
- [ ] Widgets — lock screen and home screen receipt display
- [ ] Scan tab — point camera at anything to capture it as a receipt
- [ ] StandBy mode — ambient display while charging
- [ ] Audio journal — full voice entry mode with transcription

---

## License

MIT — see [LICENSE](./LICENSE) for details.
