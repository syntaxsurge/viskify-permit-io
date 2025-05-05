# Viskify 🚀

**Viskify** is a trust-layer for hiring that fuses **blockchain-signed credentials**, **AI-verified skills**, and **externally-managed authorization** into a single Next.js stack.

*Candidates prove, recruiters verify, issuers endorse — all in minutes, not weeks.*

---

## 🏆 Why This Matters

| Problem | Traditional Flow | **Viskify** Flow |
|---------|-----------------|------------------|
| Diploma / reference forgery | Manual PDF review ☠️ | cheqd DID-signed VC ✅ |
| Skill inflation | White-board or take-home tests 💤 | GPT-4o auto-graded **SkillPass** ✅ |
| Internal ACL sprawl | In-code role checks 😱 | **Permit.io** central RBAC ✅ |

---

## 🔐 Permit.io Authorization Layer

Viskify delegates _all_ permission decisions to a **Permit.io PDP** so code stays free of `if (role === …)` branches.

| Concept | Viskify Mapping |
|---------|-----------------|
| **Roles** | `admin`, `candidate`, `recruiter`, `issuer` |
| **Resources** | `dashboard`, `admin_stats`, plus feature-specific resources |
| **Actions** | `view`, `read`, `create`, etc. |
| **Policy** | `permit/policies/base.yml` (seeded via `pnpm permit:cli`) |

### Runtime flow

1. **Middleware** extracts `session` cookie ✉️.
2. `lib/permit/check()` calls **Permit PDP** → decision.
3. UI or API handler continues **only if `true`**.
4. Roles & resources can be tweaked live in the Permit UI — no redeploy needed.

See **`lib/permit/index.ts`** for the Edge/Node-safe helper and **`middleware.ts`** for request-time guards.

---

## 🗺️ System Architecture

| Layer | Stack |
|-------|-------|
| **Frontend** | Next.js 15 App Router · RSC / Client Components · TailwindCSS + shadcn/ui |
| **Backend** | Next.js Route Handlers & Server Actions |
| **DB** | PostgreSQL + **drizzle-orm** typed schema & migrations |
| **Auth** | JWT in Http-Only cookie, bcrypt password hash |
| **Authorization** | **Permit.io PDP v2** container (or Cloud PDP) |
| **Verifiable Credentials** | **cheqd** DID & VC APIs |
| **Payments** | Stripe SDK + Webhooks |
| **AI** | OpenAI (gpt-4o) for skill-quiz grading |

> Business logic lives beside data through Server Actions while **Permit.io** enforces security completely outside your codebase.

---

## 👥 Roles & Real-World Flows

| Role | Capabilities (via Permit.io) | Real-world analogy |
|------|------------------------------|--------------------|
| **Admin** | View global dashboard, stats, user management. | Platform operator |
| **Candidate** | Manage profile, request credential verification, take AI quizzes. | Job seeker |
| **Recruiter** | Search talent, build pipelines, invite candidates. | Hiring manager |
| **Issuer** | Approve / reject verification requests, sign VCs. | University or former employer |

### Example interaction

1. **Candidate** uploads certificate → status `unverified`.
2. **Issuer** (permission: `credential:verify`) reviews & signs → cheqd VC minted.
3. **Recruiter** (permission: `talent:view`) filters candidates where `credential.status == verified`.
4. **Admin** monitors metrics via `/api/admin/stats` (needs `admin_stats:read`).

---

## 🌐 Web3 & DID Integration

* **DID creation** – Candidates & issuers generate W3C-compliant identifiers through cheqd.
* **VC issuance** – Issuers sign JSON-LD credentials; proof stored on cheqd ledger.
* **Verification** – Recruiters / third-parties can independently resolve & verify proofs.

The VC payload is never stored client-side; only the hash & URI are referenced to keep PII off-chain.

---

## 🧪 Test Accounts (auto-seeded)

| Email | Role | Password |
|-------|------|----------|
| `admin@test.com` | admin | **myPassword** |
| `candidate@test.com` | candidate | **myPassword** |
| `recruiter@test.com` | recruiter | **myPassword** |
| `issuer@test.com` | issuer | **myPassword** |

*(Credentials come from **`lib/db/seed/userTeam.ts`**)*
You may of course register fresh accounts — they will be synced to Permit automatically.

---

## ⚙️ Local Setup

~~~bash
# 0 · Prereqs: Node ≥20, Docker (for local PDP), pnpm
git clone https://github.com/your-org/viskify.git
cd viskify-permit-io
pnpm install
~~~

### 1 · Environment

~~~bash
cp .env.example .env
# -- Fill PERMIT_API_KEY + optional PERMIT_PDP_URL if running locally
~~~

### 2 · Permit.io bootstrap (roles, resources, demo users)

~~~bash
pnpm permit:cli
# ➜ seeds roles/resources via scripts/sync-permit.ts
~~~

### 3 · Database

~~~bash
pnpm db:push   # run migrations
pnpm db:seed   # quizzes, Stripe products, demo teams
~~~

### 4 · (Option-al) run a local PDP

~~~bash
docker run -it -p 7766:7000 \
  -e PDP_API_KEY=$PERMIT_API_KEY \
  -e PDP_DEBUG=true \
  permitio/pdp-v2:latest
~~~

### 5 · Launch dev server

~~~bash
pnpm dev
~~~

Visit **http://localhost:3000** and sign in with the test credentials above.

---

## 🔍 Verify Authorization in Action

~~~bash
# Login as admin to fetch aggregate stats
curl -X GET -L --cookie "session=<your cookie>" http://localhost:3000/api/admin/stats
# → JSON payload

# Switch to candidate session — should yield 401
~~~

Tail the terminal to see `[permit.check]` logs confirming PDP decisions.

---

## 🛠️ Useful Commands

| Script | Purpose |
|--------|---------|
| `pnpm permit:cli` | Idempotent seeding of Permit roles/resources/demo users |
| `pnpm db:push` | Apply latest migrations via drizzle-kit |
| `pnpm db:seed` | Seed quizzes, Stripe products, teams |
| `pnpm db:reset` | Drop & recreate the entire database |
| `pnpm dev` | Start Next.js + Hot Reload |
| `pnpm build && pnpm start` | Production build & run |

---

## 📝 Engineering Highlights

* **Edge-safe SDK** – dynamic `require()` fallback keeps middleware working in Vercel Edge.
* **Type-safe mutations** – server actions validated end-to-end with zod.
* **Declarative UI** – functional Tailwind + shadcn components, zero global CSS overrides.
* **Auditability** – every risky action writes to `activityLogs`, visible in the settings tab.
* **Zero-trust authz** – fail-close: if the PDP is unreachable the request is denied.

---

### 🤝 Credits

* **Permit.io** for the elegant PDP & CLI.
* **cheqd** for developer-friendly DID & VC APIs.
* **OpenAI** for GPT-4o scoring magic.
* Icons by **lucide-react**; charts by **Recharts**.

---

Happy hacking, and may the best auth win! ✨