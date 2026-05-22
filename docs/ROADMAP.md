# Product Roadmap
## Receipts – Private Journal
**Last Updated:** May 2026

---

## Current Release — v1.0 (Submitted to App Store)

The v1.0 release establishes the full core product on iOS. All features below are built and included in Build 31, submitted to App Store Connect on May 22, 2026.

| Feature | Status |
|---|---|
| Entry creation (text, photos, voice, mood, tags, location) | Shipped |
| On-device OCR (photo → text extraction) | Shipped |
| Timeline with grouping, pinning, and tag filtering | Shipped |
| Semantic + keyword search | Shipped |
| Calendar view with 12-week heatmap | Shipped |
| On This Day memory surfacing | Shipped |
| Memory Threads (tag + time clustering) | Shipped |
| Places view (geo-tagged entries) | Shipped |
| Trash with 30-day soft delete | Shipped |
| Clerk authentication + guest mode | Shipped |
| App-wide biometric lock (Face ID + PIN) | Shipped |
| Decoy PIN mode | Shipped |
| Per-entry biometric lock | Shipped |
| Panic Shake instant lock | Shipped |
| Screenshot and screen recording prevention | Shipped |
| Background blur overlay | Shipped |
| Optional E2E encryption for cloud sync | Shipped |
| Tamper detection (hash chain) | Shipped |
| Cloud sync with offline-first queue | Shipped |
| Local-only mode | Shipped |
| Markdown export (full journal + individual entries) | Shipped |
| Weekly Digest | Shipped |
| Journaling streak with milestone animations | Shipped |
| Custom tags (color + icon) | Shipped |
| 3D intro animation + Blankit font reveal | Shipped |
| Full dark mode | Shipped |
| Reduced Motion support | Shipped |
| Haptic feedback (configurable) | Shipped |
| Dynamic font size support | Shipped |
| i18n — English + Ethiopic | Shipped |

---

## Near-Term — v1.1 (Q3 2026)

Focus: Android parity and initial polish pass based on App Store user feedback.

| Feature | Priority | Notes |
|---|---|---|
| Android release — Google Play Store | High | EAS Submit configured; build profiles ready |
| App Store rating prompt (post-engagement) | High | Trigger after 5+ entries or 7-day streak |
| Bug fixes from v1.0 App Review feedback | High | Addressed as received |
| Entry templates (structured prompts) | Medium | Scaffolded; needs UI polish |
| iPad layout optimization | Medium | Current layout functional; not optimized |
| Linked entries UI improvements | Medium | Core logic built; discovery surface weak |
| Improved onboarding flow | Medium | Based on user feedback |
| Export to PDF | Low | Markdown export currently available |

---

## Future Enhancements — v2.0 (Q4 2026 – Q1 2027)

Focus: Monetization foundation, ecosystem integrations, and AI-native features.

| Feature | Priority | Notes |
|---|---|---|
| Freemium subscription tier | High | Premium: unlimited cloud sync, advanced privacy features |
| iCloud sync | High | Cross-device without a custom server |
| Apple Watch companion — quick capture from wrist | Medium | Dictation or quick tag entry |
| Widgets — lock screen and home screen | Medium | Today's entry count, streak, or pinned receipt |
| StandBy mode display | Medium | Ambient display while charging |
| On-device AI — natural language entry querying | Medium | Local model, no internet required |
| Scan tab — point camera to capture anything | Medium | Extends existing OCR capability |
| Audio journal mode — full voice entry with transcription | Low | Voice memo extended into primary input method |
| NFC trigger points — tap sticker to open new entry | Low | Physical → digital journaling bridge |
| Handwriting input support | Low | Apple Pencil / stylus entry |

---

## Technical Debt & Backlog

| Item | Priority | Notes |
|---|---|---|
| Upgrade to Expo SDK 55 when stable | High | Track Expo release notes |
| Expand TypeScript strict coverage | Medium | Some legacy files have `any` types |
| Add automated test coverage (unit + integration) | Medium | Currently manual QA only |
| Migrate semantic search to vector embeddings | Medium | Current TF-IDF is functional but limited |
| Performance audit — Timeline with 500+ entries | Medium | Virtualization behavior under large datasets |
| Background sync retry logic improvements | Low | Current queue is functional; edge cases exist |
| Replace AsyncStorage with SQLite for large datasets | Low | AsyncStorage has known limits at scale |
| Android-specific UI pass | Low | Awaiting Android beta feedback |

---

## Principles

These principles guide prioritization across all versions:

1. **Privacy is not a feature — it is the product.** Nothing ships that compromises user data ownership.
2. **Speed of capture matters.** The path from launch to saved entry must stay under 30 seconds.
3. **No social layer.** Receipts is a private tool. Sharing, comments, and followers are permanently out of scope.
4. **Own your data.** Export and local-only mode will always exist, regardless of business model.
