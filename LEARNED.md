# Lessons Learned

## 1. Esbuild CJS Bundle — Import Chains Break

esbuild bundles the server into a single CJS file (`dist/index.cjs`). This means **file boundaries disappear** — you cannot rely on ESM re-export patterns to resolve imports.

### What happened
We tried to move `getAbsoluteFilePath` from `routes/utils.ts` into a shared `server/utils.ts`, expecting the existing chain `storage.ts → routes/utils.ts → server/utils.ts` to resolve. But CJS bundling collapses everything — the re-export is not a live binding, and the intermediate `routes/utils.ts` ends up importing from the same bundle where the function may not be defined at the right point.

### Fix
**Duplicate the function** where it's needed rather than sharing it across layers. The function lives in both `routes/utils.ts` (for route files) and as an inlined module-level function in `storage.ts` (for storage layer). Duplication is preferred over fragile import chains in CJS bundles.

```typescript
// storage.ts — inlined copy
function getAbsoluteFilePath(...) { ... }
```

### Key takeaway
> In a CJS bundle, treat every module as if it will be inlined. If two files need a utility, either duplicate it or put it in a leaf module that nothing else imports from.

---

## 2. Docker Layer Caching Bites Hard

The Docker build uses layered `COPY` commands. If a layer is cached from a previous build, **source changes in that layer are ignored**.

### What happened
The HA supervisor pulled `v2.50.0` and built it. On subsequent releases (`v2.50.1`, `v2.50.2`) the Dockerfile's `COPY server ./server` layer was pulled from cache — the runtime code was still `v2.50.0`. We bumped the version (changing `config.yaml` and `package.json`) which busted the layer cache because those files sit in the WORKDIR layer, forcing a full re-copy of all source.

### The real fix
Bumping the version is a sledgehammer. A targeted approach:

```dockerfile
# Dockerfile — increment this arg to force fresh source copy
ARG CACHE_BUST=1
```

But that requires the maintainer to remember. **Version bumps are the reliable mechanism** in HA supervisor context because the supervisor checks the add-on version tag.

### Key takeaway
> Docker layer caching is invisible in CI — the build "succeeds" with stale code. Always verify the build output hash, or use version bumps to force a clean build in HA supervisor.

---

## 3. Missing Import → Silent 500 → Client Crash Cascade

A `ReferenceError` from a missing import in a server route handler produces a **500 response with the error message as JSON body**. The client's TanStack Query default `queryFn` catches the 500, calls `throwIfResNotOk()` which throws, and the query is marked as error.

But the **error response body** (`{ message: "..." }`) can be misinterpreted. If the response body is even partially truthy, the component might try to render it as data.

### The chain of failure
```
storage.ts:845 — SAVE_BACKUP_DIR is not defined
  → ReferenceError
    → Express route catch → res.status(500).json({ message: "SAVE_BACKUP_DIR is not defined" })
      → TanStack Query default queryFn throws
        → data = undefined, component returns null (safe path)
```

But if the code path allows `data` to be truthy without expected fields (e.g., cached stale data), the crash manifest as:

```
TypeError: Cannot read properties of undefined (reading 'toLocaleString')
```

### Prevention
1. **Always import what you use** — TypeScript doesn't always catch missing imports at the bundler level (esbuild strips types).
2. **Use `??` / `?.` guards** at every data access point in React components. Never assume API response fields are present.
3. **Log the full error** in route catch blocks, not just `err.message`.

```typescript
// Bad — loses stack trace
catch (err: any) {
  log(`Failed: ${err.message}`, "vault");
}

// Good — captures full context
catch (err: any) {
  log(`Failed: ${err.stack ?? err.message}`, "vault");
}
```

### Key takeaway
> A missing Node.js `import` doesn't fail at build time (esbuild doesn't type-check). It only fails at runtime as a `ReferenceError`. Add defensive guards on the client and log full stack traces on the server.

---

## 4. Express Route Order — Static Routes Before Param Routes

Express matches routes in **registration order**. A parameterized route like `GET /api/roms/:id` will match **any** single-segment path under `/api/roms/`, including `/api/roms/move-stats`. If the `:id` route is registered before the `move-stats` route, the `:id` handler runs instead.

### What happened
```typescript
// Registered first (line 465) — catches everything
app.get("/api/roms/:id", async (req, res) => { ... });

// Registered later (line 1006) — never reached for GET
app.get("/api/roms/move-stats", async (req, res) => { ... });
```

`GET /api/roms/move-stats` matched `:id` with `id = "move-stats"`. `Number("move-stats")` → `NaN`, `storage.getUploadedRom(NaN)` → `undefined`, handler returned **404**.

### Fix
**Register concrete static paths before parameterized routes:**

```typescript
// Static paths first
app.get("/api/roms/move-stats", ...);
app.get("/api/roms/warp-qr", ...);

// Then parameterized
app.get("/api/roms/:id", ...);
app.get("/api/roms/:id/video", ...);
```

### Key takeaway
> Express route ordering matters. Never place a `:param` route before a static path that could match the same position. Add a comment at the `:id` route to warn future developers.

---

## 5. TanStack Query `staleTime: Infinity` and Error Boundaries

The app uses `staleTime: Infinity` globally, meaning **queries never refetch automatically** once they have data. Combined with `retry: false`, a failed query stays failed until explicitly invalidated or the page is refreshed.

### What happened
- First visit: API returns 500 → `data` is `undefined` → component returns `null` (safe).
- Second visit (same session with component unmounted/remounted): TanStack Query checks cache — no cached data (the error didn't cache data) → refetches → API still 500 → same safe fallback.
- **But**: If the API succeeded on a previous visit (cached data with `totalRoms`), then broke later, the cached data is used indefinitely. Only a manual `refetch()` or page refresh triggers a new request.

### Prevention
- Always guard data access with `??` and `?.`:
  ```typescript
  <StatCard value={(data.totalRoms ?? 0).toLocaleString()} />
  ```
- Consider using `placeholderData` or `keepPreviousData` to avoid blank states.
- Use an **Error Boundary** around each major widget so one crash doesn't take down the whole page.

### Key takeaway
> `staleTime: Infinity` is convenient but hides failures. Always add null guards to rendered values — cached data may have a different shape than expected.

---

## 6. Browser Cache vs Server Cache — Check the Bundle Hash

When debugging client-side errors, always verify that the browser is **actually running the deployed code**. The Vite build creates hashed filenames (`assets/index-<hash>.js`). Compare the hash in the server's HTML response with the hash the browser requests.

### How to check
```bash
# On the server
cat /app/dist/public/index.html | grep -o 'assets/index-[^"]*'

# In the browser console
document.querySelector('script[src*="index-"]')?.getAttribute('src')
```

If the hashes differ, **the browser is serving a cached old bundle**. Hard refresh (`Cmd+Shift+R`) or clear the Service Worker cache.

### Key takeaway
> A persistent client-side error after deployment is often a stale cache, not a bug in the new code. Always verify the bundle hash before debugging.
