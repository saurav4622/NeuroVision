# NeuroVision Security Guide

This document explains the application security measures, why they exist, and how to operate or extend them.

## Threat Model (Quick)
- Credential theft and brute force
- Token/session abuse
- Injection/XSS from unsanitized input
- Sensitive data exposure in browser/network tools
- Misconfigured CORS/origins

## Controls Implemented

### 1) Credential Safety
- Passwords stored with bcrypt (10 rounds) in backend `controllers/authController.js`.
- JWT tokens (24h expiry) and Mongo-backed sessions (`models/Session.js`).
- Email OTP required before account becomes usable.

Why: Protect at rest, ensure short-lived access, ensure verified identities.

Operate: Rotate JWT secret via `JWT_SECRET`; invalidate sessions by marking `isValid=false` in Session collection.

---

### 2) Brute Force Mitigation
- Login rate limiter (`middleware/rateLimit.js` -> `loginLimiter`) caps attempts per IP.
- Applied in `routes/auth.js` POST /login.

Why: Slows automated guessing.

Tune: Adjust `windowMs` and `max` per environment.

---

### 3) Input Validation & Sanitization
- `express-validator` used in `routes/auth.js` and `routes/admin.js` for sensitive routes.
- Checks for presence, basic type, trimming, and escaping.

Why: Reduce malformed input and basic injection vectors.

Extend: Replace scattered checks with a schema validator (Joi/Zod) for consistency.

---

### 4) Client-side Payload Encryption (Defense-in-Depth)
- Frontend encrypts sensitive bodies with AES-256-CBC via Web Crypto (`src/utils/crypto.js`).
- Used in Login, Signup, and Admin Change-Password.
- Backend auto-decrypts when body contains `{ encryptedData, key, iv }`.

Why: Obfuscates credentials in browser DevTools/Network tab; complements TLS.

Note: Not a replacement for HTTPS—the key is sent alongside for server decryption, by design.

---

### 5) CORS Allowlist (Stricter)
- Dynamic allowlist (`app.js`) accepts only configured FRONTEND_URL variants: `FRONTEND_URL`, `FRONTEND_URL_DEV`, `FRONTEND_URL_PROD`, `FRONTEND_URL_PREVIEW`.
- In production, requests without an `Origin` header are blocked (mitigates CSRF for cookie-based setups). In non-prod, no-origin is allowed for tools like curl/Postman.

Why: Blocks cross-site calls from rogue origins and reduces attack surface.

Operate: Set the environment variables above to the exact frontend origins (including protocol and port).

---

### 6) Safer UX and Logging
- Password fields masked; show/hide toggle provided where necessary.
- Proper autocomplete attributes set for email/username/password fields.
- Console logs suppressed in production in sensitive components.

Why: Prevent shoulder surfing and console-based data leaks.

---

### 7) Email Verification Hardening (PendingUser Flow)
- Signups are stored in a `PendingUser` collection with a 15-minute TTL and an OTP; no real `User` record is created until OTP is verified.
- On successful verification, the pending record is promoted to a real `User` and the pending entry is deleted.
- If email sending fails during signup, the pending record is removed and the request fails.

Why: Prevents unverified accounts from persisting and minimizes data retained for non-verified users.

Operate:
- TTL: 15 minutes via MongoDB TTL index on `createdAt` (see `models/PendingUser.js`).
- Frontend handles expired/missing verification gracefully in `verifyOtp.jsx` with CTAs to re-sign up.

---

### 8) Minimal Sensitive Data Exposure
- Signup response no longer returns the full user object; only `{ success, message, userId, emailMasked }` is returned.
- Global model transforms strip secrets automatically:
  - `models/User.js` and `models/PendingUser.js` remove `password`, `emailVerificationOTP`, `otpExpiry`, `resetToken`, `resetTokenExpiry` from all `toJSON/toObject` outputs.

Why: Avoids accidental leakage through responses or logs.

---

### 9) Security Headers via Helmet (Applied)
- `app.js` enables Helmet with:
  - Content Security Policy (CSP) restricting `default-src` to self; `connect-src` includes only the allowed frontends; `img-src` allows `data:`; `style-src` allows `'unsafe-inline'` for current styles.
  - HSTS (production only).
  - Cross-origin policies set to safe defaults.

Why: Reduces XSS and clickjacking risk and enforces HTTPS.

Operate:
- If you add external CDNs, update CSP directives accordingly (prefer nonces/hashes for scripts).

## Recommended Next Steps

### A) Refine CSP further
- Replace `'unsafe-inline'` in `style-src` with style nonces/hashes when feasible.
- If you need third-party APIs (analytics, S3, etc.), explicitly add them to `connect-src`.

### B) CAPTCHA after N failures
- After 5 failed logins from same IP, require CAPTCHA token check.

### C) Centralize Validation
- Use Joi/Zod schemas for `/signup`, `/login`, `/change-password`.

### D) CSRF (if cookies used later)
- If auth session moves to cookies, add CSRF tokens (e.g., `csurf`).

### E) Secrets Hygiene
- Keep secrets in env files or secret stores; rotate periodically.

### F) Dependency/Container Scanning
- Enable `npm audit`/`yarn audit`, GitHub Dependabot, and container image scanning in CI.

## Operational Checklist
- [ ] HTTPS enabled everywhere (production)
- [ ] CORS origins set correctly
- [ ] JWT secret strong and rotated
- [ ] Admin accounts audited regularly
- [ ] Rate limits adjusted for traffic patterns
- [ ] Backups/restore tested

## Appendix: Files Touched
- Frontend: `src/utils/crypto.js`, `Login/userLogin.jsx`, `User/userSignUp.jsx`, `User/verifyOtp.jsx`, `StatelessComponents/AdminDashboard/AdminDashboard.jsx`
- Backend: `routes/auth.js`, `routes/admin.js`, `middleware/rateLimit.js`, `app.js`, `controllers/authController.js`, `models/User.js`, `models/PendingUser.js`

Questions? See the repository README for quick links or open an issue.
