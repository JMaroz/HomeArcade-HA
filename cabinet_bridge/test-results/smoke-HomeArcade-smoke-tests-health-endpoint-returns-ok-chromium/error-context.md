# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> HomeArcade smoke tests >> health endpoint returns ok
- Location: e2e\smoke.spec.ts:13:3

# Error details

```
Error: apiRequestContext.get: connect ECONNREFUSED ::1:5000
Call log:
  - → GET http://localhost:5000/api/health
    - user-agent: Playwright/1.60.0 (x64; windows 10.0) node/24.11
    - accept: */*
    - accept-encoding: gzip,deflate,br

```