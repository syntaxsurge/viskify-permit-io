# Permit.io Authorization Challenge – Viskify Submission

## 🚀 Overview

Viskify integrates **Permit.io** to externalise authorization, replacing brittle in-code checks with declarative policies that can be evolved without redeploys.
The demo proves how a hiring platform can gate sensitive dashboards and APIs through a single cloud-based RBAC engine.

## 🛠️ Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Front-end | Next.js 14, React Server/Client Components, TailwindCSS, shadcn/ui |
| AuthZ | Permit.io SDK 1.x, YAML policy synced via **permit apply** |
| Back-end | Next.js Route Handlers & Server Actions |
| Database | PostgreSQL + drizzle-orm |
| Dev Ops | PNPM scripts, Vercel preview deployment |

## 🔧 Local Installation

1. Clone and install:

~~~bash
git clone https://github.com/yourname/viskify-permit-io.git
cd viskify-permit-io
pnpm install
~~~

2. Configure environment:

~~~bash
cp .env.example .env
# add PERMIT_API_KEY & PERMIT_PROJECT_ID obtained from the Permit dashboard
~~~

3. Sync policy & bootstrap DB:

~~~bash
pnpm permit:cli          # login & apply ./permit/policies/base.yml
pnpm db:push
pnpm db:seed
~~~

4. Launch dev server:

~~~bash
pnpm dev
~~~

## 🔑 Test Accounts

| Role  | Email / Username | Password          |
| ----- | ---------------- | ----------------- |
| Admin | **admin**        | 2025DEVChallenge  |
| User  | **newuser**      | 2025DEVChallenge  |

## ✅ Verification Steps

1. Sign in as **admin** and open **Dashboard → View Admin Stats** – the API returns totals.
2. Sign out, sign in as **newuser**, repeat – a "Permission required” toast appears and the endpoint returns **401**.
3. In a second terminal, run:

~~~bash
curl -b cookie.txt -c cookie.txt http://localhost:3000/api/admin/stats
~~~

Observe success for admin cookies and failure for user cookies.

## 📝 Policy Highlights (`./permit/policies/base.yml`)

```yaml
roles:
  admin: { }
  candidate: { }
  recruiter: { }
  issuer: { }

resources:
  admin_stats:
    actions:
      read: { }

grants:
  - role: admin
    resource: admin_stats
    actions: ["read"]


```

📸 Screenshots
-------------

1. Permit dashboard showing **admin\_stats** resource and grants.
2. Viskify dashboard with "Access Denied 403” page rendered for non-admins.
3. Terminal output of the successful vs failed `curl` requests.

🌟 Why Externalized Authorization?
---------------------------------

* **Security** – single source-of-truth policies reduce missed edge cases.
* **Velocity** – roles/actions adapted in Permit UI propagate instantly without redeploy.
* **Clarity** – business logic stays readable; permissions are declarative YAML.

🏁 Live Demo
-----------

https://viskify-permit-io.vercel.app
*(demo auto-seeds credentials above on first launch)*

📜 License
---------

MIT © 2025 Viskify
==================

```