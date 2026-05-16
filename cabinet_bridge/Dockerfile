ARG BUILD_FROM
FROM ${BUILD_FROM}

ENV LANG=C.UTF-8 \
    PORT=5000 \
    NODE_ENV=production

# Install Node 22+, build tools for native modules, and SQLite runtime libs.
RUN apk add --no-cache \
      --repository=https://dl-cdn.alpinelinux.org/alpine/edge/main \
      nodejs npm && \
    apk add --no-cache python3 make g++ sqlite-libs libstdc++ && \
    node --version && npm --version

WORKDIR /app

COPY package.json package-lock.json ./

# Install all deps WITH scripts enabled so better-sqlite3 compiles its native
# binary in a single pass. No separate rebuild step needed.
RUN NODE_ENV=development npm install --no-audit --no-fund

ARG CACHE_BUST=65
RUN echo "cache-bust=$CACHE_BUST"

# Hard-verify the native module actually loaded before wasting time on the build.
RUN node -e "require('better-sqlite3'); console.log('better-sqlite3 OK');"

COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.js components.json drizzle.config.ts ./
COPY shared ./shared
COPY server ./server
COPY client ./client
COPY script ./script

RUN NODE_ENV=production npm run build
RUN npm prune --omit=dev

COPY run.sh /run.sh
RUN chmod a+x /run.sh

EXPOSE 5000
CMD ["/run.sh"]
