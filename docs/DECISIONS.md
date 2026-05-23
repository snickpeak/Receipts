# Architecture Decision Records
## Receipts – Private Journal
**Last Updated:** May 2026

Architecture Decision Records (ADRs) document significant technical choices made during development — the context, the options considered, and the reasoning behind the decision. This log exists so future contributors (and future me) understand not just *what* was built, but *why*.

---

## ADR-001 — Use Expo Managed Workflow over Bare React Native

**Status:** Accepted  
**Date:** Project start

**Context**  
The choice between Expo's managed workflow and bare React Native determines how much of the native layer is hand-managed versus abstracted.

**Options Considered**
- Bare React Native — full control over native code, `ios/` and `android/` directories in the repo
- Expo Managed Workflow — native layer managed by Expo; EAS Build compiles in the cloud

**Decision**  
Expo Managed Workflow with EAS Build.

**Rationale**  
The native permissions required by this app (Face ID, camera, microphone, location) are all covered by Expo's SDK. Managing the native layer manually would add significant overhead (Xcode project maintenance, CocoaPods, native module conflicts) for no gain in this use case. EAS Build provides a reproducible cloud build environment and direct integration with EAS Submit for App Store distribution. The tradeoff is reduced flexibility in the native layer — accepted, because no custom native modules are needed.

---

## ADR-002 — Use Clerk for Authentication over Custom Auth

**Status:** Accepted  
**Date:** Project start

**Context**  
Every app with user accounts needs session management, token storage, refresh logic, and secure credential handling. This can be built from scratch or delegated to an auth provider.

**Options Considered**
- Custom auth — JWT issuance, refresh token rotation, secure storage, session management built in-house
- Supabase Auth — open-source, self-hostable
- Firebase Auth — Google-managed, widely used
- Clerk — purpose-built for React/React Native, first-class Expo support

**Decision**  
Clerk via `@clerk/expo`.

**Rationale**  
Clerk's `@clerk/expo` package handles token storage in SecureStore, session refresh, and the full auth UI out of the box. Building this correctly — particularly around token refresh edge cases and secure storage — is a known source of security vulnerabilities when done by non-specialists. Delegating auth to Clerk eliminates an entire class of security risk while letting development focus on the actual product. Supabase and Firebase were considered but Clerk's React Native ergonomics and SecureStore integration were significantly better at the time of selection.

---

## ADR-003 — Offline-First Architecture with a Sync Queue

**Status:** Accepted  
**Date:** Early development

**Context**  
Journal entries are created in moments — on a run, in a meeting, in a location with poor connectivity. If the app requires internet connectivity to save an entry, it fails users at exactly the moments they need it most.

**Options Considered**
- Online-only — entries require a successful server write before being considered saved
- Optimistic updates only — write locally, sync in background, surface errors after the fact
- Offline-first with durable queue — local storage is the source of truth; a queue syncs changes when connectivity is available, survives app restarts

**Decision**  
Offline-first with a durable sync queue (`lib/syncQueue.ts`).

**Rationale**  
Local storage (AsyncStorage) is always the source of truth. The sync queue persists across app restarts so that an entry created offline is guaranteed to sync the next time the app has connectivity, even if the user killed the app in between. This also makes the local-only mode feature a natural consequence of the architecture rather than a special case — disabling sync simply means the queue never drains.

---

## ADR-004 — On-Device OCR over Cloud OCR

**Status:** Accepted  
**Date:** Mid development

**Context**  
OCR (extracting text from photos) can be done on-device using device ML frameworks or by sending the image to a cloud service (Google Vision, AWS Textract, etc.).

**Options Considered**
- Cloud OCR — higher accuracy, requires sending images to a third-party server
- On-device OCR via `expo-text-extractor` — runs locally, lower accuracy on complex documents, no network dependency

**Decision**  
On-device OCR only.

**Rationale**  
Sending user photos to a cloud service would directly contradict the app's core privacy promise. A user photographing a personal receipt, a handwritten note, or a sensitive document should have absolute confidence that image data does not leave their device. The accuracy tradeoff is acceptable — the primary use case is clear text (receipts, printed notes, typed documents), not handwriting or complex layouts. Privacy won.

---

## ADR-005 — TF-IDF Semantic Search over External Search Service

**Status:** Accepted  
**Date:** Mid development

**Context**  
"Search" in a journal app needs to be more than exact string matching. A user searching for "argument with my manager" should find entries about workplace conflict even if those exact words don't appear.

**Options Considered**
- Exact keyword search only — simple, fast, incomplete
- External search service (Algolia, Typesense) — high quality, requires sending entry content to a third-party server
- On-device TF-IDF ranking — moderate quality, runs entirely locally
- On-device vector embeddings — highest quality, requires running a local ML model

**Decision**  
On-device TF-IDF ranking (`lib/semanticSearch.ts`).

**Rationale**  
Sending entry content to an external search service is the same privacy violation as cloud OCR — it contradicts the product's core promise. On-device vector embeddings would require bundling a model, adding significant app size and memory pressure, and were not mature enough in the Expo ecosystem at the time. TF-IDF provides meaningfully better results than exact matching while running entirely on-device. Vector embeddings are tracked on the roadmap for a future release as the tooling matures.

---

## ADR-006 — Tamper Detection via FNV-1a Hash Chain

**Status:** Accepted  
**Date:** Mid development

**Context**  
Some users keep entries as personal documentation or proof — records of conversations, promises made, events that occurred. If these entries can be silently modified by a sync process, a data migration, or a bad actor with access to the storage backend, the entry loses its value as proof.

**Options Considered**
- No tamper detection — trust that the storage backend is reliable
- Per-entry checksum — hash each entry individually; detects modification but not insertion or deletion
- Blockchain-style hash chain — each entry's hash includes the previous entry's hash; detects modification, insertion, and reordering

**Decision**  
FNV-1a hash chain across all entries.

**Rationale**  
A simple per-entry checksum would miss an attacker who deletes an entry, inserts a fake one, or reorders entries. The hash chain ensures that any modification to any entry — or to the order of entries — breaks the chain at that point and alerts the user. FNV-1a was chosen for its speed and simplicity relative to cryptographic hash functions; this is an integrity check, not a cryptographic security guarantee.

---

## ADR-007 — Decoy PIN Mode over Simple Password Protection

**Status:** Accepted  
**Date:** Mid development

**Context**  
A simple PIN lock protects against casual access but fails against coercion — a situation where someone forces the user to unlock the app in front of them.

**Options Considered**
- PIN lock only — stops casual access, fails under coercion
- Biometric lock only — same failure mode under coercion
- Decoy PIN — a secondary PIN that presents a clean, empty journal state

**Decision**  
Decoy PIN mode as an optional security feature.

**Rationale**  
Decoy mode is specifically designed for the coercion threat model — a domestic abuse situation, a border crossing, a hostile workplace. When the decoy PIN is entered, the app is visually and functionally indistinguishable from a real empty journal. The real data is hidden until the correct PIN is entered. This feature exists because the people who need it most are exactly the people for whom a standard lock is insufficient. It is optional and off by default to avoid confusing users who don't need it.

---

## ADR-008 — pnpm over npm or yarn

**Status:** Accepted  
**Date:** Project start

**Context**  
JavaScript package management has three main options with meaningfully different behaviors around performance and dependency resolution strictness.

**Options Considered**
- npm — default, ubiquitous, slower installs, permissive hoisting
- yarn — faster than npm, workspaces support, two incompatible major versions
- pnpm — fastest installs, strict dependency resolution, content-addressable store

**Decision**  
pnpm.

**Rationale**  
pnpm's strict dependency resolution prevents phantom dependencies — packages that are accessible in code but not declared in `package.json`. This makes dependency issues surface at install time rather than at runtime in production. The content-addressable store also significantly reduces install times in CI. For a project using EAS Build, install speed directly affects build time and cost.
