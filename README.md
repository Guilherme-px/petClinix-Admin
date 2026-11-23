[🇧🇷 Português](README.pt-br.md) | [🇺🇸 English](README.md)

# PetClinix Admin

**🔗 Live Demo:** [https://petclinix-admin.vercel.app](https://petclinix-admin.vercel.app)
_(Note: The app talks to the public API hosted on Render's free tier — the first request after an idle period may take ~50 seconds to complete)_

## 🔑 Demo Account

A shared demo account is available so recruiters, reviewers, and anyone evaluating this project can log in as a clinic admin and explore the entire platform without setting anything up:

| Field        | Value                 |
| ------------ | --------------------- |
| **Email**    | `user.test@email.com` |
| **Password** | `Senha@Teste123`      |

> Please use this account responsibly — avoid large destructive changes so the demo experience stays intact for the next visitor.

PetClinix Admin is the web front end of **PetClinix**, a multi-tenant SaaS MVP for veterinary clinics, designed and implemented as a public portfolio project to demonstrate frontend engineering practices: layered architecture on the client, component-driven UI, strict TypeScript, and a testing culture that mirrors the entire source tree.

This repository represents the **public MVP stage** of the product's front end.
Its purpose is to showcase the client-side foundation of the platform, including the layered design, the integration with the PetClinix API, and the first core business workflows.

The backend API, its domain modeling, and the overall product strategy are documented in the API repository. You can explore the live API through its Swagger UI: [https://petclinix.onrender.com/swagger/index.html](https://petclinix.onrender.com/swagger/index.html).

---

## Purpose

This front end was built to demonstrate how the architectural thinking of the backend translates to the client side, with a strong focus on:

- Clean Architecture-inspired layering (domain, application, infrastructure)
- component-driven UI design
- strict TypeScript across the whole codebase
- centralized dependency injection (singleton container)
- global HTTP error handling mapped to API error codes
- reactive composition patterns (Vue composables, Pinia stores)
- testability as a first-class concern

Rather than a quick prototype, the goal is a maintainable client foundation that can support the future growth of the product.

---

## Product Vision

PetClinix aims to provide veterinary clinics with a centralized platform to manage their daily operations, staff, pets, tutors, scheduling, subscriptions, and clinical workflows.

The Admin web app is where the clinic team lives day to day: it is the surface where staff manage the agenda, register tutors and pets, maintain the services catalog, and control the subscription plan.

At the MVP stage, the front end focuses on validating the core operational workflows of the platform on top of the public API.

---

## Public MVP Scope

The public MVP front end covers the essential workflows of the platform, including:

- authentication (login, forgot password, reset password)
- JWT session handling with refresh token and automatic logout
- appointments calendar and scheduling
- staff management with plan limits
- tutor registration
- pet registration
- services catalog management
- profile management (user and clinic data)
- Stripe subscription flow (checkout redirect and billing portal)

This scope is intentionally broad enough to represent a realistic vertical slice of the product, while still being limited to an MVP that is suitable for public demonstration.

---

## Architecture

The front end applies Clean Architecture-inspired layering to the client side, keeping the UI decoupled from HTTP details and making every layer independently testable.

- **`domain/`** — pure business models and repository contracts. No framework or HTTP knowledge.
- **`application/`** — services that orchestrate use cases on top of the repository contracts.
- **`infrastructure/`** — HTTP client (axios), repository implementations, DTOs, and a singleton dependency injection container.
- **UI layer** — pages, layouts, components, and composables that consume the application services.
- **`stores/`** — Pinia store for authentication and session state.

### Current project structure

```text
src/
├── application/
│   └── services/              # Use case orchestration (auth, staff, tutors, pets, appointments...)
├── assets/                    # Styles, icons, and static illustrations
├── components/
│   ├── appointments/          # Appointment detail dialog, status legend
│   ├── auth/                  # Login form
│   ├── common/                # DataTable, ConfirmDialog, EmptyState, ListPageLayout
│   ├── forms/                 # Staff, Tutor, Pet, Service, and Appointment form dialogs
│   ├── profile/               # User and clinic profile forms
│   └── AppLogo.vue
├── composables/               # Reusable reactive logic (data tables, calendar, billing portal, staff limit...)
├── domain/
│   ├── models/                # Business models as the UI sees them
│   └── repositories/          # Repository contracts (interfaces)
├── infrastructure/
│   ├── dtos/                  # API request/response shapes
│   ├── http/                  # Axios HttpClient, token refresh, error handler
│   ├── repositories/          # Repository implementations over HTTP
│   └── container.ts           # Singleton DI container
├── layouts/
│   └── AdminLayout.vue        # Authenticated app shell (navigation, subscription menu)
├── pages/
│   ├── auth/                  # Login, Forgot Password, Reset Password
│   ├── AppointmentsPage.vue
│   ├── PetPage.vue
│   ├── ProfilePage.vue
│   ├── ServicesPage.vue
│   ├── StaffPage.vue
│   └── TutorPage.vue
├── router/                    # Routes and navigation guards (auth, admin-only, guest-only)
├── stores/                    # Pinia store (auth/session)
├── utils/                     # Formatters and helpers
└── __tests__/                 # Unit tests mirroring the src/ tree (50+ spec files)
```

---

## Tech Stack

- **Framework:** Vue 3 (Composition API, `<script setup>`)
- **UI Library:** Quasar 2 (Material components, notifications, dialogs)
- **State Management:** Pinia
- **Routing:** Vue Router (navigation guards, lazy-loaded routes)
- **Language:** TypeScript (strict)
- **Build Tool:** Vite
- **HTTP Client:** Axios (interceptors for JWT injection and token refresh)
- **Calendar:** FullCalendar
- **Payments:** Stripe (checkout redirect and billing portal)
- **Unit Testing:** Vitest, @vue/test-utils, happy-dom, coverage v8
- **E2E Testing:** Cypress
- **Linting & Formatting:** ESLint, oxlint, oxfmt
- **Package Manager:** Bun
- **Deployment:** Vercel (SPA rewrites)

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

1. **Node.js 22.18.0**
    - The exact version is pinned in the `engines` field of `package.json`.
    - Download: [https://nodejs.org](https://nodejs.org)

2. **Bun**
    - Used as the package manager and script runner.
    - Download: [https://bun.sh](https://bun.sh)

3. **A running PetClinix API**
    - Either a local instance (see the API repository README: Docker Compose for PostgreSQL plus `dotnet run`), or
    - The public demo API at [https://petclinix.onrender.com](https://petclinix.onrender.com).

---

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Clone the repository

```bash
git clone https://github.com/your-username/petclinix-admin.git
cd petclinix-admin
```

### 2. Install dependencies

```bash
bun install
```

### 3. Configure the API URL

The app reads the API base URL from the `VITE_API_URL` environment variable and falls back to `http://localhost:5180` when it is not set.

Create a `.env.local` file in the project root and point it to the API you want to use:

```bash
# Local API (Docker Compose + dotnet run, see the API repository README)
VITE_API_URL=http://localhost:5180

# Or the public demo API
# VITE_API_URL=https://petclinix.onrender.com
```

### 4. Run the Application

```bash
bun dev
```

Once running, open your browser and navigate to `http://localhost:5173`, then log in with the [demo account](#-demo-account) (when pointing to the public API) or with your own locally registered clinic.

### 5. Production Build

```bash
bun run build
```

The project is ready to deploy on Vercel: the `vercel.json` file already contains the SPA rewrites, and the `VITE_API_URL` environment variable should be configured in the project settings on Vercel.

---

## Testing

The project contains a comprehensive unit test suite that mirrors the entire `src/` tree, plus Cypress tooling for end-to-end tests. Unit tests are fast, fully isolated, and do not require the API, a database, or Docker.

### Run Unit Tests

```bash
bun test:unit
```

### Run Unit Tests with Coverage

```bash
bun test:coverage
```

### Run E2E Tests

Cypress runs against the Vite development server:

```bash
bun test:e2e:dev
```

It is also possible to test the production build before deploying:

```bash
bun run build
bun test:e2e
```

---

## Roadmap

- [x] Authentication screens (Login, Forgot Password, Reset Password)
- [x] JWT session with refresh token, automatic renewal, and global logout on expiry
- [x] Route guards (protected, guest-only, and admin-only routes)
- [x] Admin layout with navigation and billing portal access
- [x] Appointments management (FullCalendar, form dialog, status lifecycle, detail dialog)
- [x] Staff management (CRUD, plan usage counter, soft delete, plan-limit error actions)
- [x] Tutors management (CRUD, search, pagination)
- [x] Pets management (CRUD, linked to tutors)
- [x] Services catalog management (CRUD)
- [x] Profile management (user and clinic data)
- [x] Stripe integration (subscription checkout redirect and billing portal)
- [x] Centralized HTTP error handling mapped to API error codes
- [x] Unit test suite mirroring the entire source tree (Vitest + coverage)
- [x] Cypress E2E tooling configured
- [ ] Expand end-to-end test coverage (Cypress)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
