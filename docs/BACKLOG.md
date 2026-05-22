# Product Backlog
## Receipts – Private Journal
**Last Updated:** May 2026  
**Format:** MoSCoW Prioritization

---

## Must Have — Critical for v1.1

These items are either blocking the next release or are high-impact fixes expected from v1.0 user feedback.

| # | Feature | Rationale | Status |
|---|---|---|---|
| B-001 | Android release — Google Play Store | Significant addressable market; EAS profiles already configured | Planned |
| B-002 | 6.9" iPhone Display screenshots uploaded to App Store Connect | Required for App Store submission completeness | In Progress |
| B-003 | Privacy policy page live on Carrd with public URL | Required before app goes live publicly | In Progress |
| B-004 | App Store rating prompt (post-engagement trigger) | Drives initial reviews; trigger after 5+ entries or 7-day streak | Planned |
| B-005 | v1.0 crash and rejection fixes (if any from App Review) | Must be addressed as received | Planned |

---

## Should Have — High Value, Near-Term

Important improvements that significantly enhance the product but are not blocking launch.

| # | Feature | Rationale | Status |
|---|---|---|---|
| B-006 | Entry templates with structured prompts | Reduces friction for new users; scaffolded in codebase | In Progress |
| B-007 | iPad layout optimization | Current layout functional but not optimized for larger screen | Planned |
| B-008 | Linked entries — improved discovery UI | Logic built; surface for finding linked entries is weak | In Progress |
| B-009 | Onboarding flow revision | Improve based on v1.0 user drop-off data | Planned |
| B-010 | Markdown + PDF export | PDF export adds to existing Markdown export | Planned |
| B-011 | Automated unit + integration test coverage | Currently manual QA only; needed for sustainable iteration | Planned |
| B-012 | TypeScript strict coverage expansion | Legacy files contain `any` types; increases reliability | Planned |
| B-013 | Performance audit — Timeline with 500+ entries | Ensure smooth scroll and render at scale | Planned |

---

## Could Have — Meaningful but Deferrable

Features that add clear value but can wait until after core product is stable.

| # | Feature | Rationale | Status |
|---|---|---|---|
| B-014 | iCloud sync | Native sync without a custom server; highly requested privacy-conscious option | Planned |
| B-015 | Widgets — lock screen and home screen | Increases daily engagement; shows streak and entry count | Planned |
| B-016 | StandBy mode display | Ambient journaling prompt while charging; low effort, good UX | Planned |
| B-017 | Apple Watch companion — quick capture | Fast capture without phone; extends value of existing app | Planned |
| B-018 | Freemium subscription tier | Unlocks revenue; gate premium privacy features (E2E, advanced export) | Planned |
| B-019 | Improved semantic search (vector embeddings) | Current TF-IDF works; embeddings would dramatically improve relevance | Planned |
| B-020 | Background sync retry edge case improvements | Current offline queue functional; resilience can be improved | Planned |
| B-021 | SQLite migration for large datasets | AsyncStorage has limits at scale; SQLite is more robust | Planned |

---

## Later — Future Vision

Longer-horizon features that require significant R&D or depend on platform maturity.

| # | Feature | Rationale | Status |
|---|---|---|---|
| B-022 | On-device AI — natural language entry querying | Ask your journal questions; requires local model integration | Planned |
| B-023 | Scan tab — point camera to capture anything | Extends OCR into a dedicated capture mode | Planned |
| B-024 | Audio journal mode — full voice entry with transcription | Voice as primary input, not just attachment | Planned |
| B-025 | NFC trigger points — tap sticker to open new entry | Physical → digital journaling bridge; niche but on-brand | Planned |
| B-026 | Handwriting input (Apple Pencil) | Natural handwriting entry on iPad | Planned |
| B-027 | Memory Map — visual map of all geo-tagged entries | Geographic storytelling; builds on existing location infrastructure | Planned |
| B-028 | Receipts Web — browser companion for review and export | Read-only browser view; no mobile dependency for export | Planned |
| B-029 | Recurring entry prompts | Daily/weekly scheduled prompts for consistent reflection | Planned |
| B-030 | Shared receipts (opt-in, private link) | Single entry shared via private link — no public feed | Planned |

---

## Permanently Out of Scope

The following will not be built in any version. These decisions are deliberate and define the product.

| Feature | Reason |
|---|---|
| Social feed or public profiles | Contradicts core privacy-first positioning |
| Third-party advertising | Contradicts "no ads, no tracking" guarantee |
| Third-party analytics SDKs | User data sold or shared — hard no |
| Selling or sharing user data | Core product promise |
| Gamification as primary UX | Streaks exist as a secondary metric, not the point of the app |
