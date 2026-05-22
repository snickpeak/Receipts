# Release Checklist
## Receipts – Private Journal — v1.0
**Last Updated:** May 2026

Legend: ✅ Done | ☐ Pending | N/A Not Applicable

---

## 1. Code & Build Readiness

| # | Item | Status |
|---|---|---|
| 1.1 | TypeScript compiles with no errors (`tsc --noEmit`) | ✅ |
| 1.2 | No console.error or unhandled promise rejections in production build | ✅ |
| 1.3 | All feature flags and debug toggles disabled for production | ✅ |
| 1.4 | `app.json` version set correctly (1.0.0) and buildNumber incremented (31) | ✅ |
| 1.5 | Bundle ID set to `com.receiptsapp.journal` | ✅ |
| 1.6 | EAS production profile used for build | ✅ |
| 1.7 | `ITSAppUsesNonExemptEncryption` set to `false` in app.json | ✅ |
| 1.8 | All permission usage description strings present in app.json | ✅ |
| 1.9 | Production build tested on physical iPhone (not just Simulator) | ✅ |
| 1.10 | Expo New Architecture enabled | ✅ |
| 1.11 | React Compiler enabled | ✅ |

---

## 2. Environment Variables

| # | Item | Status |
|---|---|---|
| 2.1 | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` set in Replit Secrets | ✅ |
| 2.2 | Production Clerk key used (not development/test key) | ✅ |
| 2.3 | No secrets or API keys hardcoded in source files | ✅ |
| 2.4 | `.env` file excluded from git via `.gitignore` | ✅ |

---

## 3. EAS Build & TestFlight

| # | Item | Status |
|---|---|---|
| 3.1 | EAS project linked (`projectId: 335eab2c-45dd-492e-b143-bfa03556835e`) | ✅ |
| 3.2 | EAS owner set to `astrohaile` | ✅ |
| 3.3 | `ascAppId` set to `6768203620` in eas.json | ✅ |
| 3.4 | Production build submitted via `eas build --auto-submit` | ✅ |
| 3.5 | Build 31 visible in App Store Connect → TestFlight | ✅ |
| 3.6 | Binary State shows "Validated" in TestFlight | ✅ |
| 3.7 | Build tested internally via TestFlight on physical device | ☐ |
| 3.8 | No crashes reported in TestFlight crash log | ☐ |

---

## 4. App Store Connect — Metadata

| # | Item | Status |
|---|---|---|
| 4.1 | App name: "Receipts – Private Journal" | ✅ |
| 4.2 | Subtitle: "Keep receipts on your life" | ✅ |
| 4.3 | Bundle ID: `com.receiptsapp.journal` | ✅ |
| 4.4 | Primary category: Lifestyle | ✅ |
| 4.5 | Secondary category: Productivity | ✅ |
| 4.6 | Age rating: 4+ | ✅ |
| 4.7 | Keywords set (journal, diary, notes, private, daily, memories, wins, log, personal, mindfulness) | ✅ |
| 4.8 | App description written and pasted | ✅ |
| 4.9 | Support email: receipts.support@gmail.com | ✅ |
| 4.10 | Privacy policy URL set | ✅ |
| 4.11 | Pricing set to Free | ✅ |
| 4.12 | Build 31 selected on submission page | ✅ |

---

## 5. App Store Connect — Screenshots & Media

| # | Item | Status |
|---|---|---|
| 5.1 | 6.9" iPhone Display screenshots uploaded (required) | ☐ |
| 5.2 | 6.5" iPhone Display screenshots uploaded | ✅ |
| 5.3 | At least 1 screenshot, up to 10 per device size | ✅ |
| 5.4 | Screenshots accurately represent app UI | ✅ |
| 5.5 | App Previews (video clips) — optional, not required | N/A |
| 5.6 | No placeholder or mock screenshots | ✅ |

---

## 6. Privacy & Legal

| # | Item | Status |
|---|---|---|
| 6.1 | Privacy policy written and hosted (Carrd) | ✅ |
| 6.2 | Privacy policy URL live and accessible | ☐ |
| 6.3 | App Privacy section completed in App Store Connect | ✅ |
| 6.4 | Data types declared: Email Address, User ID, Photos/Videos, Audio Data, Other User Content, Precise Location, Search History | ✅ |
| 6.5 | All data declared as "App Functionality" — not tracking | ✅ |
| 6.6 | Content Rights section completed | ✅ |
| 6.7 | App does not use third-party analytics SDKs | ✅ |
| 6.8 | App does not serve ads | ✅ |
| 6.9 | Apple Privacy Manifest present | ✅ |

---

## 7. Final Pre-Submission QA

| # | Item | Status |
|---|---|---|
| 7.1 | Intro video plays on cold launch with no flash | ✅ |
| 7.2 | Handwriting animation completes correctly | ✅ |
| 7.3 | Auth flow (sign up, sign in, sign out) works | ✅ |
| 7.4 | Guest mode works | ✅ |
| 7.5 | Create, edit, delete entry — all work | ✅ |
| 7.6 | Face ID lock and decoy PIN tested | ✅ |
| 7.7 | Screenshot prevention active | ✅ |
| 7.8 | Dark mode renders correctly | ✅ |
| 7.9 | Reduce Motion setting respected | ✅ |
| 7.10 | No crash on any main user flow | ✅ |

---

## 8. Post-Submission

| # | Item | Status |
|---|---|---|
| 8.1 | Submission sent to Apple App Review | ✅ |
| 8.2 | Monitoring Apple Developer account email for review status | ☐ |
| 8.3 | Monitoring receipts.support@gmail.com for user inquiries | ☐ |
| 8.4 | Prepared response plan for metadata rejection | ☐ |
| 8.5 | Prepared response plan for binary rejection | ☐ |
| 8.6 | GitHub repo published with README | ✅ |
| 8.7 | Privacy policy page live before app goes public | ☐ |
