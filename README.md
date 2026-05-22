# Receipts — Private Journal

> *Keep receipts on the life you're building.*

Receipts is a private journaling app for iOS built with React Native and Expo. It's designed for people who want to document moments, wins, and memories without the noise of social features, feeds, or algorithms. Your entries stay on your terms.

---

## Screenshots

> Coming soon — TestFlight build in progress.

---

## Features

- **Private by default** — No social features, no feeds, no followers. Everything you write belongs only to you.
- **Biometric lock** — Face ID protection on all journal entries via `expo-local-authentication`.
- **Rich entries** — Attach photos from your camera or library, record voice memos, and tag your location automatically.
- **Search** — Full-text search across all entries.
- **Calendar view** — Browse your entries by date.
- **Timeline** — A chronological feed of everything you've saved.
- **Settings** — Dark mode, reduce motion, language support (English + Ethiopic), and notification preferences.
- **Animated intro** — Custom 3D logo intro video on every launch with a handwritten title reveal.
- **Offline-first** — Works without an internet connection.
- **Secure auth** — Sign up and sign in via Clerk with encrypted token storage.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Framework | React Native 0.81.5 |
| SDK | Expo 54 |
| Navigation | Expo Router 6 (file-based) |
| Auth | Clerk (`@clerk/expo`) |
| Data fetching | TanStack Query v5 |
| Animations | React Native Reanimated 4 |
| Styling | StyleSheet (no CSS-in-JS) |
| Build & Deploy | EAS Build + EAS Submit |
| Package manager | pnpm |

---

## Project Structure

```
├── app/                    # File-based routes (Expo Router)
│   ├── (auth)/             # Sign in / Sign up screens
│   ├── (tabs)/             # Main tab navigator
│   ├── _layout.tsx         # Root layout, font loading, providers
│   └── index.tsx           # Landing page with intro overlay
├── assets/
│   ├── fonts/              # Custom fonts (Blankit)
│   ├── images/             # App icons and images
│   └── videos/             # Intro video
├── components/             # Shared UI components
├── context/                # React context providers
├── hooks/                  # Custom hooks
├── constants/              # Colors, config
├── lib/                    # Utility functions
├── types/                  # TypeScript type definitions
├── app.json                # Expo config
└── eas.json                # EAS build profiles
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Expo CLI
- iOS device or simulator (iPhone only — tablet not supported)

### Install

```bash
git clone https://github.com/snickpeak/Receipts.git
cd Receipts
pnpm install
```

### Environment Variables

Create a `.env` file in the root:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### Run

```bash
pnpm dev
```

Scan the QR code with the Expo Go app or press `i` to open in iOS Simulator.

---

## Building for Production

This project uses EAS Build for production builds submitted to the Apple App Store.

```bash
# iOS production build + auto-submit to TestFlight
eas build --platform ios --profile production --auto-submit
```

Build profiles are configured in `eas.json`.

---

## Permissions

The app requests the following device permissions:

| Permission | Reason |
|---|---|
| Face ID | Biometric lock for journal entries |
| Camera | Attach photos to entries |
| Photo Library | Attach images from camera roll |
| Microphone | Record voice memos |
| Location | Auto-tag where an entry was written |
| Notifications | Journaling reminders |

---

## License

MIT
