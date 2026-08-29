# ByteLabs ↔ Studying Kube Integration Contract

This document defines the integration boundary between ByteLabs (the practice engine) and Studying Kube (the lecture platform). Both apps share the same Firebase project for authentication. Communication is REST, server-to-server, authenticated with a shared secret plus the learner's Firebase ID token.

## Architecture

```
Learner on Kube                    Learner on ByteLabs
      │                                   │
      │  "Practise this topic"            │
      │──── redirect ────────────────────►│  /handoff?code=xxx
      │                                   │
      │                     POST /api/bytelabs/exchange
      │◄──────────────────────────────────│  { code }
      │  { topicContext }                 │
      │──────────────────────────────────►│
      │                                   │  (learner practises)
      │                                   │
      │                     POST /api/bytelabs/verdict
      │◄──────────────────────────────────│  { verdict }
      │  { received: true }              │
```

## Shared Authentication

Both apps use the **same Firebase project**. A learner signs in once and the same `uid` identifies them on both sides.

**Server-side verification:** Both apps verify Firebase ID tokens directly against Google's JWKS endpoint using `jose`:
- JWKS URL: `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`
- Algorithm: RS256
- Issuer: `https://securetoken.google.com/<projectId>`
- Audience: `<projectId>`

**Server-to-server auth:** API calls between the two apps carry:
1. `Authorization: Bearer <firebase-id-token>` — the learner's identity
2. `X-ByteLabs-Secret: <shared-secret>` — proves the caller is ByteLabs (not a random client)

The shared secret is a 256-bit hex string set as `KUBE_SHARED_SECRET` on both sides.

---

## Endpoints Kube Must Expose

### 1. `POST /api/bytelabs/exchange`

Exchanges a handoff code for topic context. Called by ByteLabs server-side when a learner arrives via redirect.

**Request:**
```json
{
  "code": "abc123..."
}
```

**Headers:**
- `X-ByteLabs-Secret: <shared-secret>`

**Response (200):**
```json
{
  "courseId": "int42d",
  "courseCode": "INT42D",
  "courseTitle": "Internet and Web Technologies",
  "topicId": "u4-html-tables",
  "topicTitle": "HTML Tables",
  "unit": 4,
  "recap": [
    "Tables use <table>, <tr>, <th>, and <td> elements",
    "Use <thead>, <tbody>, <tfoot> for semantic grouping",
    "colspan and rowspan merge cells across columns or rows"
  ],
  "whyItMatters": "Tables structure tabular data — schedules, comparisons, results — in a way that's accessible and meaningful.",
  "deps": ["u4-semantic-html"],
  "practiceShape": "editor-gym",
  "uid": "firebase-uid-here"
}
```

**Error responses:**
- `400` — invalid or missing code
- `401` — invalid shared secret
- `410` — code already used or expired

**Kube's implementation:**
1. Generate codes with `crypto.randomUUID()`, store in Firestore with a 5-minute TTL
2. Code record: `{ code, uid, courseId, topicId, createdAt, usedAt: null }`
3. On exchange: verify secret, find the code, check not used and not expired, mark used, return topic context
4. Delete expired codes on a schedule or lazily

### 2. `GET /api/bytelabs/topic`

Fetches topic context directly (for when the learner navigates to a topic from within ByteLabs, not via handoff).

**Query params:**
- `courseId` — e.g. `int42d`
- `topicId` — e.g. `u4-html-tables`

**Headers:**
- `Authorization: Bearer <firebase-id-token>`
- `X-ByteLabs-Secret: <shared-secret>`

**Response:** Same shape as the exchange response above (TopicContext).

**Error responses:**
- `401` — invalid token or secret
- `404` — course or topic not found

### 3. `POST /api/bytelabs/verdict`

Receives a practice verdict from ByteLabs.

**Request:**
```json
{
  "courseId": "int42d",
  "topicId": "u4-html-tables",
  "uid": "firebase-uid",
  "result": "solid",
  "concepts": [
    {
      "conceptId": "html-table-structure",
      "label": "Table structure",
      "result": "solid"
    },
    {
      "conceptId": "html-colspan-rowspan",
      "label": "Cell spanning",
      "result": "shaky",
      "hint": "Try merging cells in a schedule layout"
    }
  ],
  "durationSeconds": 480,
  "attempts": 2,
  "timestamp": "2026-08-29T14:30:00.000Z"
}
```

**Headers:**
- `Authorization: Bearer <firebase-id-token>`
- `X-ByteLabs-Secret: <shared-secret>`

**Kube's implementation:**
1. Verify shared secret and Firebase token
2. Confirm `uid` in body matches the token's `sub`
3. Update `learnProgress` — if result is `solid`, consider marking the topic's practical requirement as satisfied
4. Store the verdict for analytics (new `practiceVerdicts` collection)
5. Return `{ received: true }`

**Result values:**
- `solid` — the learner demonstrated understanding; Kube can treat the topic's practical side as covered
- `shaky` — partial understanding; Kube should suggest revisiting
- `stuck` — the learner needs more instruction before more practice

### 4. `GET /api/entitlement/introspect`

ByteLabs checks whether the learner has an active Kube subscription.

**Headers:**
- `Authorization: Bearer <firebase-id-token>`
- `X-ByteLabs-Secret: <shared-secret>`

**Response (200):**
```json
{
  "tier": "summit",
  "source": "stripe",
  "expiresAt": null
}
```

**Kube's implementation:** Same as the existing `/api/entitlement` GET route, but additionally verifies the `X-ByteLabs-Secret` header to confirm the caller is ByteLabs.

---

## Endpoints ByteLabs Exposes

### `POST /api/handoff/exchange`

ByteLabs' own endpoint that the handoff landing page calls. This is a passthrough — it calls Kube's `/api/bytelabs/exchange` server-side and returns the topic context to the browser.

### `POST /api/verdict`

Authenticated endpoint that accepts a verdict from the ByteLabs client and forwards it to Kube.

---

## Handoff Flow (Step by Step)

1. Learner is on Kube, viewing topic "HTML Tables" in INT42D
2. Learner clicks "Practise on ByteLabs"
3. Kube generates a handoff code, stores it in Firestore
4. Kube redirects the browser to `https://bytelabs.app/handoff?code=<code>`
5. ByteLabs' `/handoff` page loads, calls `/api/handoff/exchange` with the code
6. ByteLabs server calls Kube's `/api/bytelabs/exchange` with the code + shared secret
7. Kube verifies the code, returns the topic context
8. ByteLabs stores the topic context in sessionStorage
9. ByteLabs routes to `/practice/<courseId>/<topicId>`
10. Learner practises
11. On completion, ByteLabs calls `/api/verdict` with the result
12. ByteLabs server forwards the verdict to Kube's `/api/bytelabs/verdict`
13. Kube records the verdict and updates learner progress

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
KUBE_SHARED_SECRET=<same-on-both-sides>
```

### On Kube (.env.local)
```
KUBE_SHARED_SECRET=<same-on-both-sides>
BYTELABS_URL=https://bytelabs.app
```

---

## Practice Shapes

ByteLabs supports three practice shapes, determined by the topic's nature:

| Shape | Description | Best for |
|---|---|---|
| `editor-gym` | CodeMirror workspace + live preview + requirement checks | HTML/CSS/JS coding topics |
| `runnable-code` | Code editor + execution output (stdout/stderr) | Python, C, Prolog coding |
| `numerical-workbench` | Structured input fields + step-by-step checking | Math, logic, numerical topics |

Kube decides the shape when generating the handoff code (or it's derived from the course's nature). For INT42D (web tech), it's always `editor-gym`.

---

## Topic → Concepts Mapping

Kube's topics contain a `recap[]` of key facts. ByteLabs maps these to its own concept registry for mastery tracking. The concept IDs are derived from the topic ID + a slug of the recap line, e.g.:
- Topic `u4-html-tables` + recap "Tables use <table>..." → concept `u4-html-tables:table-structure`

This way mastery data stays meaningful on both sides without requiring a shared concept dictionary — Kube owns the topic, ByteLabs owns the concept-level granularity.

---

## What ByteLabs Has Built (Ready Now)

- `src/lib/firebase/client.ts` — Firebase client SDK, same project
- `src/lib/auth/verify.ts` — Server-side jose JWT verification (mirrors Kube's `api-helpers.ts`)
- `src/lib/auth/useUser.ts` — Client-side auth state hook
- `src/lib/auth/authed-fetch.ts` — Authenticated fetch wrapper
- `src/lib/kube/types.ts` — All integration type definitions
- `src/lib/kube/client.ts` — Server-side Kube API client (exchange, topic, verdict, entitlement)
- `src/app/api/handoff/exchange/route.ts` — Handoff exchange passthrough
- `src/app/api/verdict/route.ts` — Verdict sender (authenticated, forwards to Kube)
- `src/app/handoff/page.tsx` — Landing page for Kube redirects
- `src/components/auth/AuthGate.tsx` — Sign-in/sign-up UI (shared Firebase Auth)

## What Kube Needs to Build

1. **`POST /api/bytelabs/exchange`** — handoff code exchange endpoint
2. **`GET /api/bytelabs/topic`** — topic context fetch endpoint
3. **`POST /api/bytelabs/verdict`** — verdict receiver endpoint
4. **`GET /api/entitlement/introspect`** — entitlement check (extend existing `/api/entitlement`)
5. **Handoff code generation** — `crypto.randomUUID()`, Firestore collection `handoffCodes`
6. **"Practise on ByteLabs" button** — on topic pages, generates code and redirects
7. **`X-ByteLabs-Secret` verification middleware** — check the shared secret on all ByteLabs-facing endpoints
8. **Verdict storage** — new `practiceVerdicts` Firestore collection
9. **Progress integration** — update `learnProgress` when a "solid" verdict arrives
