ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:latest
FROM ${BUILD_FROM} AS base

ENV LANG=C.UTF-8 \
    PORT=5000

RUN apk add --no-cache nodejs npm python3 make g++ sqlite-libs

WORKDIR /app

# Install ALL dependencies (including dev) for the build step.
# Use npm install instead of npm ci so optional platform-specific packages
# (e.g. @esbuild/linux-x64-musl) are resolved for Alpine even when the
# lock file was generated on a different OS.
COPY package.json package-lock.json ./
RUN NODE_ENV=development npm install --no-audit --no-fund

# Copy the rest of the source and build.
COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.js components.json drizzle.config.ts ./
COPY shared ./shared
COPY server ./server
COPY client ./client
COPY script ./script

RUN NODE_ENV=production npm run build

# Prune dev dependencies after the build to keep the runtime image smaller.
RUN npm prune --omit=dev

# Set production env for runtime.
ENV NODE_ENV=production

COPY run.sh /run.sh
RUN chmod a+x /run.sh

EXPOSE 5000
CMD ["/run.sh"]
