# QA Test Plan
## Receipts – Private Journal — v1.0
**Last Updated:** May 2026  
**Test Environment:** Physical iPhone (iOS 15.1+), Expo Development Build

Legend: ✅ Pass | ❌ Fail | ⏭ Skipped | 🔄 In Progress

---

## 1. App Launch & Intro

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| L-01 | Cold launch from home screen | 3D intro video plays (≈3.3s), no white/black flash before video | |
| L-02 | Intro video completes | Handwriting title animation reveals "RECEIPTS" left to right | |
| L-03 | Animation timing | Full reveal completes in ≈1.5s (150ms stagger, 450ms per letter) | |
| L-04 | Landing page visible after animation | "Open Preview" and "Go to Sign In" buttons visible | |
| L-05 | Reduced Motion — intro | Animation respects system Reduce Motion setting; video still plays | |
| L-06 | Warm launch (app already in memory) | Intro sequence plays again on every launch | |

---

## 2. Authentication

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| A-01 | Sign up with valid email + password | Account created; user redirected to onboarding | |
| A-02 | Sign up with invalid email format | Clear error message; form not submitted | |
| A-03 | Sign up with weak password | Clear error message shown | |
| A-04 | Sign in with correct credentials | User lands on Timeline | |
| A-05 | Sign in with wrong password | Clear error message; no crash | |
| A-06 | Session persistence | Kill and reopen app — user stays signed in | |
| A-07 | Guest mode — continue without account | All features accessible; cloud sync hidden | |
| A-08 | Sign out | User returned to landing page; session cleared | |

---

## 3. Entry Creation

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| E-01 | Create entry with title + body | Entry saved and appears at top of Timeline | |
| E-02 | Create entry — title only | Entry saved without body | |
| E-03 | Create empty entry (no title, no body) | Entry not saved; no crash | |
| E-04 | Attach photo from gallery | Photo attached; thumbnail visible in entry detail | |
| E-05 | Attach photo from camera | Camera opens; captured photo attached | |
| E-06 | Multiple photos on one entry | All photos display as thumbnails | |
| E-07 | Pinch-to-zoom photo | Full-screen viewer opens; zoom gesture works | |
| E-08 | Record voice memo | Recording starts and stops cleanly; memo attached | |
| E-09 | Play voice memo in entry detail | Audio plays back correctly | |
| E-10 | Add mood emoji | Emoji displayed in entry list and detail | |
| E-11 | Apply default tag | Tag chip visible in entry | |
| E-12 | Apply multiple tags | All tags displayed correctly | |
| E-13 | Location tagging (permission granted) | Location attached and shown as place name | |
| E-14 | Location tagging (permission denied) | Entry saves without location; no crash | |
| E-15 | OCR — photo with text | Extracted text inserted into entry body | |
| E-16 | Link two entries | Both entries show the link reference | |

---

## 4. Timeline & Organization

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| T-01 | Timeline displays all entries | Entries grouped: Today, Yesterday, This Week, Earlier | |
| T-02 | Filter by tag | Only entries with selected tag visible | |
| T-03 | Clear tag filter | All entries restored | |
| T-04 | Pin an entry | Appears in horizontal pinned strip at top | |
| T-05 | Pin 5 entries | All 5 shown in strip | |
| T-06 | Attempt to pin 6th entry | Blocked with appropriate feedback | |
| T-07 | Unpin an entry | Entry removed from strip; remains in main timeline | |
| T-08 | Star an entry | Entry marked as starred | |
| T-09 | On This Day | Entries from same date in prior years shown (when applicable) | |

---

## 5. Search

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| S-01 | Keyword search — exact match | Matching entries returned | |
| S-02 | Keyword search — partial match | Entries containing the partial word returned | |
| S-03 | Keyword search — no results | Empty state displayed | |
| S-04 | Semantic search — related concept | Thematically related entries returned | |
| S-05 | Search with no entries in journal | Empty state; no crash | |
| S-06 | Clear search query | All entries restored | |

---

## 6. Calendar

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| C-01 | Calendar view loads | 12-week heatmap and month grid visible | |
| C-02 | Days with entries highlighted | Visually distinct from empty days | |
| C-03 | Tap a day with entries | Entry list for that day shown | |
| C-04 | Tap an empty day | Empty state shown; no crash | |

---

## 7. Privacy & Security

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| P-01 | Set PIN | PIN saved; required on next launch | |
| P-02 | Enter correct PIN | App unlocks | |
| P-03 | Enter wrong PIN 3x | Lockout behavior triggered | |
| P-04 | Face ID unlock | App unlocks on successful Face ID | |
| P-05 | Face ID fails — PIN fallback | PIN input shown as fallback | |
| P-06 | Decoy PIN setup | Secondary PIN configured | |
| P-07 | Enter decoy PIN | Clean empty journal state shown; real data hidden | |
| P-08 | Switch from decoy to real PIN | Real journal restored | |
| P-09 | Per-entry lock — lock an entry | Lock icon shown in Timeline | |
| P-10 | Open a locked entry | Face ID prompt shown | |
| P-11 | Locked entry — Face ID passes | Entry detail visible | |
| P-12 | Locked entry — Face ID fails | Entry remains locked | |
| P-13 | Panic Shake | App locks immediately on shake | |
| P-14 | Screenshot attempt | Screenshot shows blank or blocked content | |
| P-15 | Background app — app switcher | UI blurred in app switcher | |
| P-16 | Background blur removed on foreground | Normal UI restored on return | |
| P-17 | Local-only mode toggle | No network requests made for entry data when enabled | |
| P-18 | E2E encryption toggle | Entries encrypted before sync when enabled | |

---

## 8. Data & Export

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| D-01 | Delete entry | Entry moves to Trash | |
| D-02 | Restore from Trash | Entry restored to Timeline | |
| D-03 | Trash auto-purge (simulated) | Entries older than 30 days removed from Trash | |
| D-04 | Manually delete from Trash | Entry permanently removed | |
| D-05 | Export journal to Markdown | File generated with all entries | |
| D-06 | Export single entry | Single Markdown file generated | |
| D-07 | Offline entry creation | Entry created without internet connection | |
| D-08 | Sync after reconnect | Offline entry syncs when connection restored | |

---

## 9. Insights

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| I-01 | Weekly Digest loads | Entry count, words, heatmap, top words, mood shown | |
| I-02 | Digest — no entries this week | Empty state shown gracefully | |
| I-03 | Streak counter shown | Day count visible and accurate | |
| I-04 | Streak milestone animation | Animation plays at milestone count | |
| I-05 | Streak breaks after missed day | Count resets to 1 | |

---

## 10. Accessibility

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| AC-01 | Dark mode | Full app renders correctly in dark mode | |
| AC-02 | Light mode | Full app renders correctly in light mode | |
| AC-03 | System-matched theme | Theme follows device system setting | |
| AC-04 | Reduce Motion ON | All animations disabled or simplified | |
| AC-05 | Large text size | UI scales correctly; no clipped text | |
| AC-06 | Haptic feedback — configurable | Haptics toggle in settings works | |

---

## 11. Navigation & Error Handling

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| N-01 | Tab navigation | All four tabs load without crash | |
| N-02 | Back navigation | All back buttons / swipe-back gestures work | |
| N-03 | Deep link to entry | Entry detail opens from a direct link | |
| N-04 | No internet connection — app launch | App loads in offline mode; no crash | |
| N-05 | No internet — sync fails | Graceful error; offline queue populated | |
| N-06 | Permissions denied (camera) | App handles denial gracefully; no crash | |
| N-07 | Permissions denied (microphone) | App handles denial gracefully; no crash | |
| N-08 | Permissions denied (location) | App handles denial gracefully; no crash | |
| N-09 | Large journal (100+ entries) | Timeline scrolls smoothly; no jank | |

---

## 12. Release Readiness

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| R-01 | Production build installs cleanly | IPA installs on physical device without error | |
| R-02 | No DEBUG logs in production build | Console is clean | |
| R-03 | App icon renders correctly | Icon visible on home screen at all sizes | |
| R-04 | Splash screen matches design | No flicker or incorrect splash shown | |
| R-05 | Bundle ID correct | `com.receiptsapp.journal` confirmed in build | |
| R-06 | Version string correct | 1.0.0 (31) confirmed | |
| R-07 | Encryption declaration correct | `ITSAppUsesNonExemptEncryption: false` in plist | |
| R-08 | All permission strings present | NSCameraUsageDescription, NSMicrophoneUsageDescription, NSLocationWhenInUseUsageDescription, NSFaceIDUsageDescription all set | |
