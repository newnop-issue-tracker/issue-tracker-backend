# ===== Stage 1: Build =====
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (separate layer for better caching)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Generate Prisma client and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

# ===== Stage 2: Production =====
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output and generated Prisma client from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Fix permissions so node user can write to prisma engines
RUN chown -R node:node /app

# Run as non-root for security
USER node

# App Runner / ECS / EB all use PORT env var
EXPOSE 8080

# On startup: apply pending migrations, then start the server.
# `prisma migrate deploy` is safe in production — it only runs already-committed migrations.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
