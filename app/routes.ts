import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // ── ACME SSL Challenge ────────────────────────────────────────────────
  route(".well-known/acme-challenge/:token", "routes/acme-challenge.ts"),

  // ── Builder Dashboard ──────────────────────────────────────────────────
  index("routes/builder.tsx"),
  route("builder",                        "routes/builder.tsx", { id: "builder-page" }),

  // ── Storefront SSR ────────────────────────────────────────────────────
  route("storefront",                     "routes/storefront._index.tsx"),
  route("storefront/products",            "routes/storefront.products.tsx"),
  route("storefront/product/:slug",       "routes/storefront.product.$slug.tsx"),
  route("storefront/checkout",            "routes/storefront.checkout.tsx"),
  route("storefront/order-confirmation/:orderId", "routes/storefront.order-confirmation.tsx"),
  route("storefront/account",             "routes/storefront.account._index.tsx"),
  route("storefront/account/orders",      "routes/storefront.account.orders.tsx"),
  route("storefront/about",               "routes/storefront.about.tsx"),
  route("storefront/contact",             "routes/storefront.contact.tsx"),
  route("storefront/bookings",            "routes/storefront.bookings.tsx"),

  // ── Builder REST APIs (Next.js Dashboard Integration) ──────────────────
  route("api/projects",                   "routes/api.projects.ts"),
  route("api/templates",                  "routes/api.templates.ts"),
  route("api/projects/create",            "routes/api.projects.create.ts"),
  route("api/projects/:projectId/update", "routes/api.projects.update.ts"),
  route("api/projects/:projectId/delete", "routes/api.projects.delete.ts"),
  route("api/projects/:projectId/domain", "routes/api.projects.domain.ts"),
  route("api/templates/clone",            "routes/api.templates.clone.ts"),
  route("api/popup-stores",               "routes/api.popup-stores.ts"),
  route("api/popup-stores/:id",           "routes/api.popup-stores.$id.ts"),
  route("api/popup-stores/:id/cancel",    "routes/api.popup-stores.$id.cancel.ts"),
  route("api/builder/chat",               "routes/api.builder.chat.ts"),
  route("api/builder/conversations",      "routes/api.builder.conversations.ts"),
  route("api/builder/store-profile",      "routes/api.builder.store-profile.ts"),
  route("api/builder/conversations/:id",  "routes/api.builder.conversations.detail.ts"),
  route("api/projects/:projectId/screenshot", "routes/api.projects.screenshot.ts"),

  // ── Direct / Legacy Client API Endpoints (called without /api prefix) ──
  route("projects/create",            "routes/projects.create.ts"),
  route("projects/:projectId/update", "routes/projects.update.ts"),
  route("projects/:projectId/delete", "routes/projects.delete.ts"),

  // ── Standalone Published Storefront Routes (tenant/project-isolated) ──
  route("pub/:projectId",                   "routes/pub.$projectId._index.tsx"),
  route("pub/:projectId/products",          "routes/pub.$projectId.products.tsx"),
  route("pub/:projectId/product/:slug",     "routes/pub.$projectId.product.$slug.tsx"),
  route("pub/:projectId/checkout",          "routes/pub.$projectId.checkout.tsx"),
  route("pub/:projectId/order-confirmation/:orderId", "routes/pub.$projectId.order-confirmation.tsx"),
  route("pub/:projectId/about",             "routes/pub.$projectId.about.tsx"),
  route("pub/:projectId/contact",           "routes/pub.$projectId.contact.tsx"),
  route("pub/:projectId/bookings",          "routes/pub.$projectId.bookings.tsx"),
  route("pub/:projectId/account",            "routes/pub.$projectId.account._index.tsx"),
  route("pub/:projectId/sitemap.xml",       "routes/pub.$projectId.sitemap[.]xml.ts"),

  // ── White-Label Custom Domain Storefront Routes (resolved via Host header) ──
  route("products",                         "routes/products.tsx"),
  route("product/:slug",                    "routes/product.$slug.tsx"),
  route("checkout",                         "routes/checkout.tsx"),
  route("order-confirmation/:orderId",      "routes/order-confirmation.tsx"),
  route("about",                            "routes/about.tsx"),
  route("contact",                          "routes/contact.tsx"),
  route("account",                          "routes/account._index.tsx"),
  route("sitemap.xml",                      "routes/sitemap[.]xml.ts"),

  // ── Catch-All Splat Route for Security & 404 Handling ──────────────────
  route("*",                                "routes/catchall.tsx"),
] satisfies RouteConfig;

