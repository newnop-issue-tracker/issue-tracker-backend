# ===== Stage 1: Build =====
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

# ===== Stage 2: Production =====
FROM node:20-alpine AS production

WORKDIR /app

# Install OpenSSL required by Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma

# Copy node_modules and built output from builder (avoids slow npm ci on EC2)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Fix permissions so node user can write to prisma engines
RUN chown -R node:node /app

USER node

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
