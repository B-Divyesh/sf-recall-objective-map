# Recall Objective Map — strict review 2

## Verdict: PASS

- Findings: **0**
- Untested public claims: **0**
- Implementation candidate reviewed: `63ac99d0ca1e0c5d97fcd74a0ded5c1c8796a020`
- Documentation baseline reviewed: `a4de2841f66d11d10900d255015d74d4f4a58f26`
- Live URL: <https://recall-objective-map.sociobot.in>
- Reviewed: 2026-09-05 UTC

The implementation and documentation commits differ because `a4de284` records the
previous verification only. `git diff 63ac99d..a4de284` contains only documentation.
The clean local build matched deployed `index.html`, service worker, manifest,
JavaScript, and CSS by SHA-256.

## Job, audience, and first action

Before scrolling in fresh 1440 px desktop and 390 px phone contexts, the page says
the job is to **map recall checks to learning objectives**. It identifies the audience
as self-learners starting broad topics who need to see objectives lacking recent
evidence. The first action is **Try it with sample data**; it was visible before the
viewport edge (bottom at 614 px desktop and 514 px phone) and says it opens a filled
map that can be reset.

The action opened four realistic orbital-mechanics and graph-reading objectives. The
persistent label read “Demo — sample data, nothing is saved to your map.” Adding a
temporary sample objective, resetting it, and choosing **Start for real** removed the
temporary sample and left the fresh real map empty. Requests used only the product
origin.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Clean install and audit | PASS | `npm ci` installed 60 packages; `npm audit` found 0 vulnerabilities. |
| Unit/type gate | PASS | `npm test` passed 7 Vitest tests and strict TypeScript. |
| Production build | PASS | `npm run build` produced `dist/`; JS 38.96 kB (12.31 kB gzip), CSS 16.49 kB (4.36 kB gzip), and 21 SW precache entries. |
| Browser regression suite | PASS | `npm run test:e2e` passed 16/16 Playwright tests. |
| All declared claims | PASS | Each of the 12 exact commands in `.factory/claims.json` passed separately. |
| Fresh desktop and phone demo | PASS | Populated output, persistent label, reset, and real-data isolation passed with no browser errors. |
| Normal, invalid, boundary, recovery | PASS | Live recall evidence saved; whitespace-only fields announced recovery and kept focus; a 10,001-objective import was rejected without replacement; a corrected objective then saved. |
| Offline PWA | PASS | Fresh service-worker-controlled `/demo` reloaded offline with the sample and visible offline status. |
| Privacy requests | PASS | Complete live demo interaction used the product origin only. |
| Accessibility | PASS | `/opt/fleet/lib/verify-url.sh` passed; live Axe Playwright scans at 390 px and 1280 px on landing, demo, map, and legal routes found 0 serious/critical issues. Keyboard skip/main focus, 44 px footer links, no overflow, and reduced motion passed. |
| Routes and links | PASS | `/`, `/demo`, `/map`, `/privacy`, `/terms`, robots, sitemap, and normal same-origin links returned 200 with distinct titles and one H1. An unknown route returned the expected designed HTTP 404. |
| Security/cache headers | PASS | Live responses send CSP, Permissions-Policy, X-Frame-Options, nosniff, and Referrer-Policy; hashed JS is immutable for one year. |
| Lighthouse mobile | PASS | 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.19 s, TBT 50 ms, CLS 0. |

Evidence: URL verifier in `/work/.evidence/recall-objective-map/review-2-url/`,
desktop/phone demo in `/work/.evidence/recall-objective-map/review-2-live-20260905/`,
and Lighthouse JSON in `/work/.evidence/recall-objective-map/review-2-lighthouse.json`.

## Public-claim commands

All commands below were run individually from the clean checkout and passed:

| Claim id | Result |
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

Landing, README, privacy, data-tools, and demo copy were cross-checked against
`.factory/claims.json`. Every positive, user-reliance promise maps to one of these
tests. Statements that the app does not grade mastery, generate lessons, or schedule
cards are scope limits rather than capability claims.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| No isolated one-click demo | Fixed; fresh desktop and phone sample/reset/real-data separation passed. |
| Claims registry and tests missing | Fixed; 12 declared commands passed individually. |
| Dead paid checkout | Fixed for users by removing the offer; the full workflow is free and needs no account. |
| Incomplete import could crash recall | Fixed; malformed and oversized live imports were rejected before replacement. |
| Whitespace-only required fields saved | Fixed; live form announces an error and focuses the first invalid field. |
| First screen lacked the job, audience, and sample action | Fixed; independently confirmed before scrolling on both viewports. |
| Landing/site structure, legal routes, and 404 missing | Fixed; direct route, title, H1, and designed 404 checks passed. |
| Footer touch targets too small | Fixed; live 390 px inspection and regression test passed. |
| Hashed assets not immutable | Fixed; live JS header is immutable for one year. |
| CSP, permissions, and frame protections absent | Fixed; live headers contain all three protections. |

This is a static, local-first PWA. Backend tenant isolation, SQLite restart persistence,
health probes, and 429/Retry-After checks do not apply.
