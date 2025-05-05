# Viskify

**Viskify** is a trust-layer for hiring that merges blockchain-signed credentials with AI-graded skill proofs.
Candidates create a **single verifiable profile for free**, recruiters instantly filter talent by proof instead of promises, and issuers sign credentials in minutes rather than weeks.

---

## ✨ Key Features

| Domain                     | Highlights                                                     |
| -------------------------- | -------------------------------------------------------------- |
| **Verifiable Credentials** | cheqd-issued VCs for diplomas, certificates & references       |
| **AI Skill-Pass**          | GPT-4o grades open-text quizzes → instant SkillPass VC         |
| **Talent Search**          | Recruiters query by skills, verified creds & scores            |
| **Recruiter Pipelines**    | Kanban workflow with custom stages                             |
| **Issuer Dashboard**       | Organisations review & sign credential requests                |
| **Freemium Pricing**       | Unlimited personal usage — pay only for advanced team features |
| **Activity Logs**          | Every critical action is auditable                             |
| **Stripe Billing**         | Subscription & metered verification charges                    |

---

## 🗺️ High-Level Workflow

1. **Account & Team Setup** – email sign-up, auto-team creation, optional invites.
2. **Profile & Credential Vault** – candidates upload credentials (default **Unverified**).
3. **Verification Request** – select issuer from directory → issuer notified.
4. **Issuer Review** – approve → VC signed on cheqd, reject → status updated.
5. **AI Skill-Check** – pass quiz ≥ 70 % → SkillPass VC minted.
6. **Talent Discovery** – recruiters filter/search, add to pipelines, invite.

---

## 🏗️ Architecture

| Layer        | Tech / Responsibility                                                                  |
| ------------ | -------------------------------------------------------------------------------------- |
| **Frontend** | Next.js 14 • React Server / Client Components • TailwindCSS + shadcn/ui • lucide-react |
| **Backend**  | Next.js Server Actions, Route Handlers                                                 |
| **Database** | PostgreSQL via **drizzle-orm**; typed schema generation                                |
| **Auth**     | Signed HttpOnly cookie sessions; bcrypt hashes                                         |
| **VC Layer** | cheqd Studio API for DID & VC issuance / verification                                  |
| **Payments** | Stripe SDK & Webhooks                                                                  |
| **CI / CD**  | (omitted – DevOps out-of-scope for this doc)                                           |

> **Stateless server actions** + **typed drizzle queries** keep business logic close to the data while preserving React’s streaming benefits.

---

## 🚀 Permit.io Authorization Challenge

This repository is an entry for the **Permit.io "Permissions Redefined” challenge** showcasing fine-grained externalised authorization in a real-world hiring platform.

### Quick local setup

1. Ensure **Permit CLI** is installed and you have a project API token.
2. Copy environment template and fill Permit keys:

~~~bash
cp .env.example .env
echo "PERMIT_API_KEY=pk_live_your_token" >> .env
echo "PERMIT_PROJECT_ID=prj_your_id"     >> .env
~~~

3. Apply the predefined RBAC policy:

~~~bash
pnpm permit:cli
~~~

4. Start the stack:

~~~bash
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
~~~

### Test the authorization flow

Login as **admin / 2025DEVChallenge** then hit the secret endpoint:

~~~bash
curl -b cookie.txt -c cookie.txt http://localhost:3000/api/admin/stats
# → { "users": 42, "credentials": 128 }
~~~

Logout or switch to the **newuser / 2025DEVChallenge** account and retry – you should receive `401 unauthorized`.

### Explore and tweak policies

~~~bash
permit ui --open
~~~

Use the Permit dashboard to edit roles, actions or resources and watch the app respond in real time.

---

## 🚀 Getting Started

### 1 · Install dependencies

~~~bash
pnpm install
~~~

### 2 · Copy & fill env vars

~~~bash
cp .env.example .env
~~~

### 3 · Run DB migrations & seed data

~~~bash
pnpm db:push     # drizzle-kit push
pnpm db:seed     # seeds users, quizzes, stripe products
~~~

### 4 · Dev server

~~~bash
pnpm dev
~~~

Navigate to **http://localhost:3000** – sign up and explore for free.

---

### 🛠️ Engineering Notes

* **Type Safety** – end-to-end zod validation on every mutation, plus drizzle-orm type inference.
* **UI Guidelines** – Tailwind, shadcn/ui, 2xl rounded corners, XL headings, soft shadows.
* **Accessibility** – focus rings, semantic HTML tags, aria-hidden handled where necessary.
* **Caching** – `revalidate` directives keep the landing static while dynamic sections re-render hourly.
* **Security** – VC issuance keys & Stripe secrets never leak to the client; server actions enforce role-based guards.

---

### 📜 License

MIT © 2025 Viskify