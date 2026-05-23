# Security Policy
## Receipts – Private Journal

Security and privacy are the core promise of this product. If you find a vulnerability, please report it responsibly.

---

## Supported Versions

| Version | Supported |
|---|---|
| 1.0.x (current) | Yes |
| < 1.0 | No |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report security issues privately by emailing:

**receipts.support@gmail.com**

Include in your report:
- A clear description of the vulnerability
- Steps to reproduce
- Potential impact
- Your suggested fix (optional but appreciated)

**Response time:** I aim to acknowledge reports within 48 hours and provide a resolution timeline within 7 days.

---

## Security Architecture

For transparency, here is how user data is protected at each layer:

**Authentication**  
Session tokens are stored in iOS SecureStore (hardware-backed encrypted storage) via Clerk. Tokens are never written to AsyncStorage or any unencrypted location.

**Local Data**  
Journal entry data is stored in AsyncStorage. Sensitive configuration (PIN hash, decoy PIN hash) is stored in SecureStore.

**In Transit**  
All network communication uses HTTPS/TLS. No plain HTTP endpoints are used.

**At Rest (Optional E2E Encryption)**  
When E2E encryption is enabled, entries are encrypted on-device using key material derived from the user's PIN before being transmitted to the server. The server stores only ciphertext.

**Biometric Lock**  
Face ID / Touch ID authentication uses iOS LocalAuthentication APIs. Biometric data never leaves the device and is never accessible to the app directly.

**Tamper Detection**  
A FNV-1a hash chain across all entries detects any modification to entry data made outside the app.

**No Third-Party Data Collection**  
No advertising SDKs, analytics SDKs, or crash reporting services that transmit user data to third parties are included in the app.

---

## Known Limitations

- **Decoy mode** hides data visually and functionally but is not a cryptographic separation — it relies on the app's access control logic. A compromised device at the OS level could bypass this.
- **Local-only mode** protects against server-side data exposure but not against device-level compromise.
- **AsyncStorage** is not encrypted by default. Users who require encryption of locally stored entry text should enable the E2E encryption setting.

---

## Scope

The following are in scope for responsible disclosure:

- Authentication bypass or session hijacking
- Data leakage from the sync API
- Bypass of the biometric lock or decoy PIN mode
- Unencrypted transmission of user data
- Any vulnerability that allows access to another user's data

The following are out of scope:

- Physical device access (assumes the attacker has unlocked the device)
- Issues in third-party services (Clerk, Expo) — report those to the respective vendor
- Social engineering attacks
