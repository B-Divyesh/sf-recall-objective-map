# Recall Objective Map — independent verification 2

## Verdict: PASS

- Implementation candidate reviewed: `63ac99d0ca1e0c5d97fcd74a0ded5c1c8796a020`
- Documentation baseline reviewed: `c68d445394a6f1d47a5879f7f73b949baf21058f`
- Live URL: <https://recall-objective-map.sociobot.in>
- Verified: 2026-09-05 UTC
- Findings: **0**
- Untested public claims: **0**

This is a PASS. The live shell, service worker, manifest, JavaScript, and CSS have the
same SHA-256 hashes as a clean build of implementation `63ac99d`. The later baseline
commit `c68d445` changes documentation only.

## Job, audience, and first action

Before scrolling, fresh desktop (1440×1000) and phone (390×844) sessions stated the
job: map recall checks to learning objectives; the audience: self-learners starting
broad topics who need to see objectives with little recent evidence; and the first
action: **Try it with sample data**, which opens a filled map that can be reset. The
action remained on the first screen on both viewports (bottom edge 614 px desktop,
514 px phone).

It opened four realistic orbital-mechanics and graph-reading objectives. The persistent
banner said “Demo — sample data, nothing is saved to your map.” Adding a temporary
sample objective, resetting, and starting for real removed the temporary sample item
and left the fresh real map empty. The demo's requests stayed on the product origin.

## Checks completed

| Check | Result | Evidence |
| --- | --- | --- |
| Clean install | PASS | Fresh clone at `63ac99d`; `npm ci` installed 60 packages and found 0 vulnerabilities. |
| Unit/type gate | PASS | `npm test`: 7 Vitest tests and strict TypeScript passed. |
| Production build | PASS | `npm run build` created `dist/`; JS 38.96 kB (12.31 kB gzip), CSS 16.49 kB (4.36 kB gzip), 21 SW precache entries. |
| Browser suite | PASS | `npm run test:e2e`: 16/16 Playwright tests passed. |
| Dependency audit | PASS | `npm audit`: 0 vulnerabilities. |
| Declared claims | PASS | All 12 exact commands in `.factory/claims.json` were each run separately and passed. |
| Live desktop and phone | PASS | Sample populated, label remained visible, reset worked, real data stayed separate, and no console/page errors occurred. |
| Normal, invalid, boundary, recovery paths | PASS | Completed real recall/evidence; whitespace fields and blank answer showed recovery messages; malformed and 10,001-objective imports were rejected without replacing the map. |
| Offline PWA | PASS | Fresh service-worker-controlled context reloaded `/demo` offline with the sample and visible offline state. |
| Privacy | PASS | Complete demo interaction and sample exercise made only same-origin product requests. |
| Accessibility | PASS | Worker URL verifier passed. Live Axe scans at 390 px and 1280 px on landing, demo, map, legal, and 404 routes found 0 serious/critical issues. Skip link, main-focus transfer, reduced motion, one H1, main, alt text, and no overflow passed. |
| Routes, titles, legal, 404 | PASS | `/demo`, `/map`, `/privacy`, and `/terms` returned 200 with route titles and one H1. Unknown route returned designed HTTP 404 with home link. All same-origin links resolved to valid product routes. |
| Policies and identity | PASS | CSP, Permissions-Policy, `X-Frame-Options: DENY`, immutable cache headers, and clean local/live hashes passed. |
| Lighthouse mobile | PASS | 100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO; LCP 1.02 s, TBT 19.5 ms, CLS 0. |

Static PWA scope means backend tenant isolation, SQLite restart persistence, health, and
429/Retry-After checks are not applicable.

## Declared-claim evidence

Every exact command below was run from the clean checkout and passed with its one
tagged Playwright test.

| Claim | Result |
| --- | --- |
| `demo-sandbox` | PASS |
| `nested-objectives` | PASS |
| `manual-evidence` | PASS |
| `weak-ranking` | PASS |
| `browser-persistence` | PASS |
| `offline-reload` | PASS |
| `json-export` | PASS |
| `csv-export` | PASS |
| `safe-import` | PASS |
| `evidence-windows` | PASS |
| `private-requests` | PASS |
| `free-no-account` | PASS |

Landing, README, privacy, and tools copy were checked against the registry. All
positive, user-reliance promises map to these 12 tests. Statements that the utility
does not grade mastery, generate lessons, or schedule cards are product boundaries,
not offered capabilities; the exercised UI records only user-selected evidence and
contains no grading, generation, or scheduler path.

## Earlier finding disposition

| Earlier finding | Disposition |
| --- | --- |
| Isolated one-click demo missing | Fixed and independently exercised. |
| Claim registry/tests missing | Fixed; 12/12 declared commands passed individually. |
| Dead paid checkout | Fixed for users by removal of the offer; workflow is free and needs no account. |
| Incomplete import could crash recall | Fixed; malformed records are rejected before replacement. |
| Whitespace-only fields could save | Fixed; live form announces an error and retains focus. |
| First screen lacked job/audience/action | Fixed; confirmed before scroll on phone and desktop. |
| Landing structure missing | Fixed; first screen, preview, steps, limits/privacy, and footer present. |
| Demo/map/legal/404 routes missing | Fixed; direct navigation, titles, and HTTP 404 checked live. |
| Footer touch targets too small | Fixed; regression test confirms 44 px minimum at 390 px. |
| Hashed assets lacked immutable caching | Fixed; live CSS and JS use `max-age=31536000, immutable`. |
| CSP/permissions/frame protections absent | Fixed; all are present in the live response. |

## Evidence

Browser and worker-verifier artifacts are in
`/work/.evidence/recall-objective-map/verification-2-live/` and
`/work/.evidence/recall-objective-map/verification-2-url/`. Lighthouse JSON is at
`/work/.evidence/recall-objective-map/verification-2-lighthouse/report.json`.

No product-code changes were made during verification.
