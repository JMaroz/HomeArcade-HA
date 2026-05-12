ARG BUILD_FROM=ghcr.io/home-assistant/${BUILD_ARCH}-base:latest
FROM ${BUILD_FROM} AS base

ENV LANG=C.UTF-8 \
    PORT=5000 \
    NODE_VERSION=22.15.0

# Install build deps + Node 22 LTS from the official binary tarball.
# apk's nodejs is too old for Vite 7 / esbuild 0.25.
RUN apk add --no-cache python3 make g++ sqlite-libs libstdc++ curl tar && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then NODE_ARCH="x64"; \
    elif [ "$ARCH" = "aarch64" ]; then NODE_ARCH="arm64"; \
    else NODE_ARCH="$ARCH"; fi && \
    curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" \
      | tar -xJ -C /usr/local --strip-components=1 && \
    node --version && npm --version

WORKDIR /app

# Install dependencies without running postinstall scripts.
COPY package.json package-lock.json ./
RUN NODE_ENV=development npm install --no-audit --no-fund --ignore-scripts

# Compile better-sqlite3 natively — required at runtime.
RUN npm rebuild better-sqlite3

# CACHE_BUST: increment to force Docker to re-copy source and rebuild.
# Current: 55
ARG CACHE_BUST=55

# Copy source and build.
COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.js components.json drizzle.config.ts ./
COPY shared ./shared
COPY server ./server
COPY client ./client
COPY script ./script

RUN NODE_ENV=production npm run build

# Prune dev dependencies to slim the runtime image.
RUN npm prune --omit=dev

ENV NODE_ENV=production

COPY run.sh /run.sh
RUN chmod a+x /run.sh

EXPOSE 5000
CMD ["/run.sh"]
