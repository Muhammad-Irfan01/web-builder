# ─────────────────────────────────────────────────────────────────────────────
# Orcayo Custom Builder — Production Dockerfile
# Multi-stage build: install → build → lean production image
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install ALL dependencies (dev + prod) ───────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Copy only package files first for layer caching
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install --no-audit --no-fund
RUN npx prisma generate

# ── Stage 2: Build the app ────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Copy source + installed deps from stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Inject build-time env variables (passed via --build-arg)
ARG VITE_API_BASE_URL
ARG VITE_STORE_ID
ARG VITE_STORE_NAME

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STORE_ID=$VITE_STORE_ID
ENV VITE_STORE_NAME=$VITE_STORE_NAME

# Build SSR bundle
RUN npm run build

# Lean production image
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Only install production dependencies
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
RUN npx prisma generate

# Copy compiled output from builder stage
COPY --from=builder /app/build ./build

# Non-root user for security
RUN addgroup -g 1001 -S orcayo && \
    adduser  -S orcayo -u 1001 -G orcayo
USER orcayo

# Runtime env vars (set these in docker-compose or your hosting platform)
ENV NODE_ENV=production
ENV PORT=3030

EXPOSE 3030

# Healthcheck — hits the root route
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3030/ || exit 1

CMD ["npm", "run", "start"]
