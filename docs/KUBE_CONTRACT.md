# ByteLabs ↔ Studying Kube Integration Contract

This document defines the integration boundary between ByteLabs (the practice engine) and Studying Kube (the lecture platform). Both apps share the same Firebase project for authentication. Communication is REST, server-to-server, authenticated with the learner's Firebase ID token — no shared secret.

## Architecture

```
Learner on Kube                       Learner on ByteLabs
      │                                      │
      │  "Practise this topic"               │
      │──── redirect ───────────────────────►│  /handoff?code=xxx
      │                                      │
      │                   POST /api/handoff/exchange
      │◄─────────────────────────────────────│  { code }
      │  { idToken, courseId, topicId, ... } │
      │─────────────────────────────────────►│
      │                                      │
      │                   GET /api/bytelabs/topic?course=&topic=
      │◄─────────────────────────────────────│  Bearer idToken
      │  { topic, signals, conceptTells }    │
      │─────────────────────────────────────►│
      │                                      │  (learner practises)
      │                                      │
      │                   POST /api/bytelabs/verdict
      │◄─────────────────────────────────────│  { course, topic, verdict }
      │  { acknowledged, kubeAction, redirectUrl }
```

## Shared Authentication

Both apps use the **same Firebase project**. A learner signs in once and the same `uid` identifies them on both sides.

**Server-side verification:** Both apps verify Firebase ID tokens directly against Google's JWKS endpoint using `jose`:
- JWKS URL: `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`
- Algorithm: RS256
- Issuer: `https://securetoken.google.com/<projectId>`
- Audience: `<projectId>`

**API authentication:** All API calls carry `Authorization: Bearer <firebase-id-token>`. No shared secret is needed — the handoff code exchange itself returns an idToken that ByteLabs uses for subsequent calls.

---

## Endpoints Kube Exposes

### 1. `POST /api/handoff/exchange`

Exchanges a single-use handoff code for an ID token and course/topic IDs. Called by ByteLabs server-side when a learner arrives via redirect. The code has a 60-second TTL.

**Request:**
```json
{
  "code": "abc123..."
}
```

**Response (200):**
```json
{
  "idToken": "firebase-id-token-string",
  "uid": "firebase-uid",
  "email": "learner@example.com",
  "courseId": "int42d",
  "topicId": "u4-html-tables",
  "mode": "practice"
}
```

**Error responses:**
- `400` — invalid or missing code
- `410` — code already used or expired

### 2. `GET /api/bytelabs/topic`

Fetches the full topic context for the practice session. Called after the exchange, using the idToken from step 1.

**Query params:**
- `course` — e.g. `int42d`
- `topic` — e.g. `u4-html-tables`

**Headers:**
- `Authorization: Bearer <idToken>`

**Response (200):**
```json
{
  "topic": {
    "id": "u4-html-tables",
    "title": "HTML Tables",
    "unit": 4,
    "weight": "medium",
    "whyItMatters": "Tables structure tabular data — schedules, comparisons, results.",
    "recap": [
      "Tables use <table>, <tr>, <th>, and <td> elements",
      "Use <thead>, <tbody>, <tfoot> for semantic grouping"
    ],
    "deps": ["u4-semantic-html"]
  },
  "signals": {
    "reviewMisses": 2,
    "mistakes": 1,
    "flags": ["table-structure"]
  },
  "mode": "practice",
  "conceptTells": [
    {
      "term": "table structure",
      "tell": "Use <table> with <tr>, <th>, and <td> to build accessible tabular data"
    }
  ],
  "returnUrl": "https://studying-kube.vercel.app/course/int42d"
}
```

**Error responses:**
- `401` — invalid token
- `404` — course or topic not found

### 3. `POST /api/bytelabs/verdict`

Receives a practice verdict from ByteLabs after the learner completes (or leaves) a session.

**Headers:**
- `Authorization: Bearer <idToken>`

**Request:**
```json
{
  "course": "int42d",
  "topic": "u4-html-tables",
  "verdict": "solid",
  "evidence": "5/5 requirements met",
  "concepts": {},
  "artifact": {}
}
```

**Required fields:** `course`, `topic`, `verdict`
**Optional fields:** `evidence`, `concepts`, `artifact`, `outOfBand`, `windowId`, `attemptId`

**Verdict values:**
- `solid` — the learner demonstrated understanding
- `shaky` — partial understanding; suggest revisiting
- `stuck` — the learner needs more instruction

**Response (200):**
```json
{
  "acknowledged": true,
  "kubeAction": "advance-topic",
  "redirectUrl": "https://studying-kube.vercel.app/course/int42d"
}
```

**`kubeAction` values:**
- `advance-topic` — Kube marks the topic as complete and moves forward
- `flag-topic` — Kube flags the topic for review
- `re-open-topic` — Kube re-opens the topic for re-study

### 4. `POST /api/entitlement/introspect`

ByteLabs checks whether the learner has an active Kube subscription.

**Headers:**
- `Authorization: Bearer <idToken>`

**Response (200):**
```json
{
  "entitled": true,
  "tier": "summit"
}
```

**Tier values:** `climb`, `summit`, `crew`, or `null` (no subscription)

---

## Endpoints ByteLabs Exposes

### `POST /api/handoff/exchange`

ByteLabs' own endpoint that the handoff landing page calls. This is a two-step server-side flow:
1. Calls Kube's `/api/handoff/exchange` with the code → gets `idToken` + IDs
2. Calls Kube's `/api/bytelabs/topic` with the idToken → gets full topic context

Returns the combined `HandoffSession`:
```json
{
  "exchange": { "idToken": "...", "uid": "...", "courseId": "...", "topicId": "...", "mode": "practice" },
  "context": { "topic": { ... }, "signals": { ... }, "conceptTells": [ ... ], "returnUrl": "..." }
}
```

### `POST /api/verdict`

Authenticated endpoint that accepts a verdict from the ByteLabs client (with the learner's Bearer token) and forwards it to Kube's `/api/bytelabs/verdict`.

---

## Handoff Flow (Step by Step)

1. Learner is on Kube, viewing topic "HTML Tables" in INT42D
2. Learner clicks "Practise on ByteLabs"
3. Kube generates a handoff code (single-use, 60-second TTL)
4. Kube redirects the browser to `https://bytelabs.app/handoff?code=<code>`
5. ByteLabs' `/handoff` page calls `/api/handoff/exchange` with the code
6. ByteLabs server calls Kube's `/api/handoff/exchange` → gets idToken + IDs
7. ByteLabs server calls Kube's `/api/bytelabs/topic` with the idToken → gets context
8. ByteLabs returns the combined session to the client
9. Client stores session in `sessionStorage` as `bytelabs.handoff`
10. Client routes to `/practical/<courseId>/<topicId>`
11. Learner practises — live requirement checks, editor + preview
12. Learner submits a verdict (solid / shaky / stuck)
13. ByteLabs calls `/api/verdict` → forwards to Kube's `/api/bytelabs/verdict`
14. Kube records the verdict, returns `kubeAction` + `redirectUrl`
15. ByteLabs redirects the learner back to Kube at `redirectUrl`

---

## Environment Variables

### On ByteLabs (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_PROJECT_ID=...
KUBE_API_URL=https://studying-kube.vercel.app
```

### On Kube (.env.local)
```
BYTELABS_URL=https://bytelabs.app
```

No shared secret on either side — auth uses Firebase ID tokens.

---

## What ByteLabs Has Built

- `src/lib/firebase/client.ts` — Firebase client SDK, same project
- `src/lib/auth/verify.ts` — Server-side jose JWT verification (mirrors Kube's `api-helpers.ts`)
- `src/lib/auth/useUser.ts` — Client-side auth state hook
- `src/lib/auth/authed-fetch.ts` — Authenticated fetch wrapper
- `src/lib/kube/types.ts` — All integration type definitions
- `src/lib/kube/client.ts` — Server-side Kube API client (exchange, topic, verdict, entitlement)
- `src/app/api/handoff/exchange/route.ts` — Two-step handoff exchange
- `src/app/api/verdict/route.ts` — Verdict sender (authenticated, forwards to Kube)
- `src/app/handoff/page.tsx` — Landing page for Kube redirects
- `src/app/practical/[courseId]/[topicId]/page.tsx` — Practice workspace route
- `src/components/practical/PracticalRunner.tsx` — Practice workspace driven by Kube's TopicContext
- `src/components/auth/AuthGate.tsx` — Sign-in/sign-up UI (shared Firebase Auth)

## Coordination

ByteLabs needs to tell Kube its `labCourseId` for CSE74D so Kube can set `pairedLab` on the course and surface the "Practise on ByteLabs" button.
