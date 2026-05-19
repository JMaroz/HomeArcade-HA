# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: art-coverage.spec.ts >> HomeArcade Art Coverage >> API: flag games missing cover art (artUrl)
- Location: e2e\art-coverage.spec.ts:104:3

# Error details

```
Error: apiRequestContext.get: connect ECONNREFUSED ::1:5000
Call log:
  - → GET http://localhost:5000/api/roms
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br

```