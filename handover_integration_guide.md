# Orcayo Custom Builder — Handover & Integration Guide
> A complete architectural blueprint, API specification, and embedding handbook for incoming AI coding assistants.

---

## 1. Executive Summary & Purpose

The **Orcayo Custom Builder** (`/orcayo-custom-builder`) is an isolated, high-performance sandbox designed to replace the legacy `webstudio-builder` engine. It provides:
1. **Customizer Dashboard**: A premium, section-based drag-and-drop landing page editor featuring live typography, spacing, border, and color token controls.
2. **Storefront SSR Engine**: A high-speed Server-Side Rendering (SSR) engine built with React Router v7 and Vite, enabling fast product rendering and interactive checkout features.
3. **Multi-Tenant REST APIs**: A fully secure, isolated backend suite supporting project CRUD actions, templating, and cloning, completely isolated under the PostgreSQL `builder` schema.
4. **Embedded Framing Integration**: Securely mounted inside the main Next.js developer portal (`orcayo-frontend` on `orcayoui.wattlesol.com`) via a secure, cross-origin communication bridge.

---

## 2. Workspace & Port Layout

The project resides inside a dedicated folder to prevent dependency conflicts with the rest of the microservices:

```
/Users/xain/Documents/Orcayo/web app Orcayo/
├── orcayo-frontend/          # Next.js customer panel (framing parent: orcayoui.wattlesol.com)
├── orcayo-backend/           # Core API microservices (authentication gateway on port 3000)
└── orcayo-custom-builder/    # React Router v7 sandbox (customizer preview + SSR on port 3030)
```

### Port Allocation Reference

* **`3000`**: Gateway (`authentication-service`) — Routes all core API queries.
* **`3030`**: Customizer & Storefront SSR — Runs the production container.
* **`5173`**: Dev Server — Hot-reloads local assets.

---

## 3. Database & Prisma Schema

To protect tenant isolation, all project and template customizer state data resides under an independent PostgreSQL schema named `builder`.

### Database URL Variables

* **`DATABASE_URL`**: `postgresql://USER:PASSWORD@HOST:5432/DB?schema=webstudio`
* **`DIRECT_URL`**: `postgresql://USER:PASSWORD@HOST:5432/DB?schema=builder`

### Prisma Models (`prisma/schema.prisma`)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Project {
  id          String   @id @default(uuid())
  title       String
  description String?
  storeId     String   // Tenant isolated store mapping
  userId      String?  // Owner mapping
  themeData   String   // Stringified JSON storing customizer settings & sections
  apiKey      String?  @unique // Generated key for backend-to-backend calls
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("projects")
}

model Template {
  id          String   @id @default(uuid())
  title       String
  description String?
  themeData   String   // Seeding defaults (Minimalist, Rose Plum, Cyber Neon)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 4. Customizer Architecture (Control Room)

The customizer is loaded at `/` (root route of port 3030). It consists of a 3-panel dynamic workspace:

```
┌─────────────────┬──────────────────────────────────────┬─────────────────┐
│                 │                                      │                 │
│  SectionsPanel  │            BuilderCanvas             │  SettingsPanel  │
│  (Add/Remove/   │   (Desktop / Tablet / Mobile View)   │   (Color, Font  │
│   Reorder List) │   ── iframe src: /storefront ──      │   & Global CSS) │
│                 │                                      │                 │
└─────────────────┴──────────────────────────────────────┴─────────────────┘
```

### The `postMessage` Real-Time Bridge
Changes made in the control panel (such as toggling section visibility, custom titles, or modifying color tokens) do **not** reload the canvas. Instead, updates are dispatched instantly via an iframe window bridge:

* **Sender** ([BuilderPage.tsx](file:///Users/xain/Documents/Orcayo/web%20app%20Orcayo/orcayo-custom-builder/app/builder/BuilderPage.tsx)):
  ```typescript
  const iframe = canvasRef.current;
  iframe.contentWindow?.postMessage({
    type: 'THEME_UPDATE',
    theme: updatedTheme
  }, '*');
  ```

* **Receiver** ([StorefrontLayout.tsx](file:///Users/xain/Documents/Orcayo/web%20app%20Orcayo/orcayo-custom-builder/app/storefront/StorefrontLayout.tsx)):
  Listens for `THEME_UPDATE` events, repaints the storefront components, and dynamically injects modified styling attributes as global CSS variables:
  ```css
  :root {
    --color-primary: #6366f1;
    --font-heading: 'Outfit';
    --border-radius: 12px;
  }
  ```

---

## 5. Storefront SSR Engine & Hoisting Architecture

The storefront pages run inside `/storefront` paths. They serve both as the live canvas preview and as the final high-performance client landing pages.

### Navigation Hierarchy
* `/storefront`: Dynamic SSR Home page compiling sections (Hero, Categories, Products, Calendar, Testimonials, CTA) based on active customizer configurations.
* `/storefront/products`: Dynamic listings supporting pagination and filters.
* `/storefront/product/:slug`: Product detailed specifications supporting Dual-Resolution (resolving by both slug or internal product UUIDs).

### ⚠️ React Context Hoisting Rules
> [!IMPORTANT]
> To prevent runtime hoisting crashes, any component invoking customer hook states (like `useCart()` or `useAuth()`) **must be enclosed inside child wrappers** underneath `<StorefrontLayout>`.
> Do not call `useCart` directly in the page loader/root file. Always isolate it into a child component (e.g. `ProductsListingContent` or `ProductDetailContent`) so that the wrapping `<CartProvider>` can initialize safely first.

---

## 6. Secure Backend REST APIs

All REST endpoints verify incoming headers to prevent cross-origin abuse and maintain absolute tenant isolation:

1. **Origin Restrictor**: Asserts that requests only originate from trusted subdomains (e.g. `orcayoui.wattlesol.com`, `localhost`).
2. **Identity Validator**: Intercepts server requests, parses and validates JWT authorization headers, extracts tenant information (`storeId`), and limits operations strictly to that store context.

### Endpoint Specifications
All API responses use global standard JSON payloads (`Response.json`):

* `GET /api/templates`: Fetches templates. If database templates count is empty, it automatically seeds 3 gorgeous premium layouts (Minimalist, Rose Plum, Cyber Neon).
* `GET /api/projects`: Paginated lists limited strictly to the caller’s `storeId`.
* `POST /api/projects/create` & `POST /projects/create` (legacy wrapper): Initial page instantiation.
* `POST /templates/clone`: Clones a template design into a new project record.
* `PUT /projects/:projectId/update`: Full state updates (theme data payload saves and renaming).
* `DELETE /projects/:projectId/delete`: isolated removal bound to tenant ownership scope.

---

## 7. Frontend Embedding (Next.js Side)

The Next.js customer panel embeds the customizer within an `iframe`. The following configurations in `orcayo-frontend` are mandatory to allow seamless framing and CORS capabilities:

### CORS & Content Security Policies ([next.config.js](file:///Users/xain/Documents/Orcayo/web%20app%20Orcayo/orcayo-frontend/next.config.js))

```javascript
module.exports = {
  async headers() {
    const corsHeaders = [
      { key: 'Access-Control-Allow-Origin', value: 'https://sandbox.wattlesol.com' },
      { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
      { key: 'Access-Control-Allow-Credentials', value: 'true' }
    ];
    return [
      { source: '/dashboard/:path*', headers: corsHeaders },
      {
        source: '/dashboard/landing-pages/:path*',
        headers: [
          ...corsHeaders,
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://sandbox.wattlesol.com https://*.wattlesol.com; frame-ancestors 'self' https://sandbox.wattlesol.com; object-src 'none';"
          }
        ]
      }
    ];
  }
};
```

### Environment Declarations
The landing page iframe component ([LandingPages.tsx](file:///Users/xain/Documents/Orcayo/web%20app%20Orcayo/orcayo-frontend/components/my-store/landing-pages/LandingPages.tsx)) accesses the customizer using:

* **`.env`** and **`.env.local`**:
  ```bash
  NEXT_PUBLIC_BUILDER_URL=https://sandbox.wattlesol.com
  ```

---

## 8. Deployment Runbook (Dokploy / Compose)

### Docker Build Strategy
> [!WARNING]
> Do **not** use `npm ci` inside your production Docker image layers! Local development locks are specialized for macOS architectures and cause failures on Alpine/Linux systems due to platform-specific binding omissions (e.g. `@emnapi/core`).
> Always use `npm install` with `--no-audit` and `--omit=dev` flags inside the Dockerfile.

### Dokploy Build Arguments
Ensure the following settings are configured as **both** Build Arguments (used during `npm run build`) AND runtime Environment Variables:

```bash
VITE_API_BASE_URL=https://orcayo.wattlesol.com/api    # Core Gateway API
VITE_STORE_ID=your-tenant-store-id-uuid
VITE_STORE_NAME=My Store Title
PORT=3030
NODE_ENV=production
```

---

## 9. Run & Verify Commands

```bash
# ── Local Development ──────────────────────────────────
cd orcayo-custom-builder
npm run dev                 # Starts local hot-reloader on 5173

# ── Verification Check ─────────────────────────────────
npx tsc --noEmit           # Verifies type safety (Must compile with 0 errors)
npm run build               # Builds SSR production bundle on Vite

# ── Docker testing ─────────────────────────────────────
docker compose up --build   # Tests container compilation on port 3030
```

---

## 10. Direct URL Opening Gated Security
To enforce security, direct loading of the builder via browser URL hits (`https://sandbox.wattlesol.com/`) is restricted by a security wall in `BuilderPage.tsx`.

* **The Security Hook**:
  ```typescript
  useEffect(() => {
    const isLocalhost = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      setIsAuthorized(true); // Allow direct access in local dev
      return;
    }

    const isInIframe = window.self !== window.top;
    const referrer = document.referrer || '';
    const isAuthorizedOrigin = referrer.includes('orcayoui.wattlesol.com');

    if (!isInIframe || !isAuthorizedOrigin) {
      setIsAuthorized(false); // Display security wall
    } else {
      setIsAuthorized(true);
    }
  }, []);
  ```
* **Effect**: If unauthorized hits occur, a styled access card is shown, blocking interaction and directing the user back to the developer console.

---

## 11. Multi-Stage Docker Prisma Generation Pattern
When packaging Prisma inside Alpine-based multi-stage Docker environments, the client must be generated inside the respective workspace layer:

```dockerfile
# Stage 1: Install Dependencies
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install --no-audit --no-fund
RUN npx prisma generate

# Stage 3: Lean Production Image
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install --omit=dev --no-audit --no-fund
RUN npx prisma generate
```
This guarantees `@prisma/client` compiles and places the WASM binary mappings correctly in `.prisma/client` at container bootstrap time, preventing runtime boot exceptions!

---

## 12. Global CORS and OPTIONS Preflight Handling for Resource Routes
Because React Router v7 API endpoints act as raw HTTP resource routes, they completely bypass the document-level routing middleware in `entry.server.tsx`. Browsers execute preflight `OPTIONS` requests for complex header fetches (like JWT `Authorization`). Failing to handle `OPTIONS` inside a resource route causes immediate preflight failures and silent client-side load crashes.

### Standard CORS Interceptor Utility (`app/lib/cors.server.ts`)
We created a centralized module to orchestrate preflight and headers mapping:
```typescript
const ALLOWED_ORIGINS = [
  "https://orcayoui.wattlesol.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

export function getCorsHeaders(request: Request): Headers {
  const origin = request.headers.get("Origin") || request.headers.get("origin");
  const headers = new Headers();

  const isAllowed = origin && (
    ALLOWED_ORIGINS.includes(origin) || 
    origin.endsWith(".wattlesol.com")
  );

  if (isAllowed) {
    headers.set("Access-Control-Allow-Origin", origin!);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-store-id");
    headers.set("Vary", "Origin");
  } else if (!origin) {
    headers.set("Access-Control-Allow-Origin", "*");
  }
  return headers;
}

export function handlePreflight(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  }
  return null;
}
```

### Route Injection Pattern
Every API endpoint file (e.g. `/api/templates`, `/api/projects`, etc.) must intercept `OPTIONS` at the top of **both** `loader` and `action` methods:
```typescript
import { handlePreflight, jsonWithCors } from '../lib/cors.server';

export async function loader({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  // Actual business logic here...
  return jsonWithCors({ success: true, data }, request);
}

export async function action({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  // Actual mutation logic here...
  return jsonWithCors({ success: true }, request);
}

---

## 13. Phase 5 Architectural Additions

### Template Preview & Save-To-Account Workspace
* Merged exploration and active workspace workflows. When a template card is loaded via `?templateId=xxx` query parameter, the loader retrieves the template layout, rendering it in **Template Preview Mode**.
* A floating glassmorphic alert overlay notifies the merchant of their preview status.
* The normal "Publish" action is swapped with a glowing **Customize & Save** button which opens a sleek modal, prompts for a custom title, creates the project database schema, and triggers a dynamic reload into the newly initialized project customizer context.

### Empty Canvas Canvas Slate Initializer
* Prevents fresh projects from pre-populating with heavy, hardcoded demo elements.
* When executing `prisma.project.create(...)`, the `sections` property inside the stringified `themeData` JSON is initialized to `[]` (blank canvas), leaving merchants free to compose their storefront layouts from a clean slate.

### Dynamic API Key propagation in Multi-Tenant Storefronts
* Storefront operations (product lists, cart updates, checkouts) require JWT permissions (`x-api-key`) to contact core microservices.
* **Server-Side Loader Lookup**: The storefront server loader (`storefront._index.tsx`) parses `projectId` or `templateId` parameter entries from the page query, looks up the corresponding PostgreSQL record, and retrieves its generated long-lived `apiKey`.
* **Client-Side Storage**: In `StorefrontLayout.tsx`, the layout initializes with the dynamic `themeData` CSS variables and writes the dynamically retrieved API key to `localStorage` (`setBuilderApiKey(apiKey)`) for subsequent client-side browser API operations.

### Referrer Go Back Dynamic Backlinks
* Ensures users hitting error pages or security blocks have active escape routes.
* Inspects the browser's `document.referrer`. If it maps back to a valid `wattlesol.com` portal page, it routes the browser back to the calling page. If the referrer is empty, it securely routes them back to the active list view: `https://orcayoui.wattlesol.com/dashboard/landing-pages/all`.
