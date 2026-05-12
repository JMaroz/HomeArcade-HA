# Stage 1: build
FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++ sqlite-libs

WORKDIR /app

COPY package.json package-lock.json ./
RUN NODE_ENV=development npm install --no-audit --no-fund --ignore-scripts
RUN npm rebuild better-sqlite3

# CACHE_BUST: 56
ARG CACHE_BUST=56

COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.js components.json drizzle.config.ts ./
COPY shared ./shared
COPY server ./server
COPY client ./client
COPY script ./script

RUN NODE_ENV=production npm run build
RUN npm prune --omit=dev

# Stage 2: runtime — use HA base for s6/bashio, copy Node + app from builder
ARG BUILD_FROM=ghcr.io/home-assistant/${BUILD_ARCH}-base:latest
FROM ${BUILD_FROM} AS runtime

ENV LANG=C.UTF-8 \
    PORT=5000 \
    NODE_ENV=production

# Copy Node 22 binary from builder stage
COPY --from=builder /usr/local/bin/node /usr/local/bin/node
COPY --from=builder /usr/local/lib /usr/local/lib

# Runtime shared libs needed by better-sqlite3
RUN apk add --no-cache libstdc++ sqlite-libs

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

COPY run.sh /run.sh
RUN chmod a+x /run.sh

EXPOSE 5000
CMD ["/run.sh"]
