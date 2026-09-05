# Recall Objective Map — full review 1

## Verdict: FAIL

- Implementation reviewed: `36cc00e1de26e02e1ca549241196addb57144510`
- Documentation commit: `d65a6bb87c896933ab52e78c4dae5c4e9c5968e1`
- Live URL: <https://recall-objective-map.sociobot.in>
- Reviewed: 2026-09-05 UTC
- Findings: 11 (4 major, 4 moderate, 3 minor)
- Untested public claims: 12

This is not a PASS. The live shell and hashed assets match implementation candidate
`36cc00e`; `d65a6bb` changes only the earlier handoff and verification reports. The
failure is therefore not explained by a stale product image.

## Job, audience, and first action

Job: tie a self-learner's recall attempt to an objective, then show the objectives
with the thinnest recent evidence.

Audience: a self-learner starting a broad subject who wants to know what they can
actually explain without looking through a card browser.

First action seen before scrolling: **Add your first objective**. There was no
**Try it with sample data** action, sample state, or demo label on either fresh
desktop or phone session.

## Findings

### S2 — Major

1. **No one-click demo sandbox exists.** Fresh desktop and iPhone-13 contexts had
   zero controls mentioning sample data and zero persistent demo notices. `/demo`
   returned the ordinary empty map, not sample data; `?demo=1` is not handled.
   There is no demo storage namespace, reset/start-for-real control, or
   `.factory/demo.md`. A reviewer cannot exercise the product from a clean state
   without writing real local records, so the required isolated try-out and its
   assurance that real data is unchanged are missing.

2. **The required claims registry and claim tests are absent.**
   `.factory/claims.json` does not exist, so no declared claim commands could be
   run from the clean checkout. The public site and README make at least these 12
   testable promises with no `@claim:` test: nested objective mapping; manual
   explain/solve/recognize evidence; weekly weak-objective ranking; IndexedDB
   storage; offline use after first visit; JSON export; CSV export; import and
   replacement confirmation; paid print/longer-lens unlocking; records staying in
   the browser; no analytics/ads/CDN dependencies; and at-most-daily license
   verification. This is 12 untested claims, not a passing claim suite.

3. **The advertised $9 Field Kit checkout is still dead.** A fresh request on
   2026-09-05 to
   `https://api.sociobot.in/api/v1/products/recall-objective-map/checkout` returned
   HTTP 404 with `{"error":"enabled factory product","status":404}`. The UI still
   advertises and links to that purchase. A valid purchase, return token, restore,
   revocation, and paid unlock cannot be tested while checkout is unavailable.

4. **A malformed version-1 import is accepted and crashes recall.** In a fresh live
   context, an import containing an objective with only `id`, `title`, and `prompt`
   passed the confirmation and replaced the map. Entering an answer then choosing
   **Reveal evidence guide** raised the uncaught error
   `Cannot read properties of undefined (reading 'replace')`. The required
   `evidenceTarget` and other record relationships are not fully validated before
   persistence. This repeats the prior S2 finding.

### S3 — Moderate

5. **Whitespace-only required fields save a blank objective.** On the live app,
   title, prompt, and evidence target containing only spaces/tab/newline closed the
   dialog and showed `1 mapped`. Native `required` accepts whitespace and the app
   trims after that check; it must reject trim-empty values and announce recovery.
   This repeats the prior S3 finding.

6. **The first screen does not meet the plain-words landing contract.** Its sole
   h1 is the product name, not the job. It does not name the audience, lacks the
   required sample first action and three plain facts, and is the empty application
   rather than the specified header → first screen → preview → how-it-works →
   limits/privacy structure. The visible language also contains decorative field
   guide metaphors rather than the requested plain words.

7. **Required routes and the 404 experience are missing.** `/demo` is ordinary
   empty-map content. `/no-such-page` returned HTTP 200 with the normal landing h1
   and no not-found state or route-specific title; there is no `404.html` or static
   deploy configuration. An HTTP 404 itself would be acceptable, but silently
   presenting the wrong page is a broken required structure.

8. **The public metadata and legal-route structure are incomplete.** The landing,
   privacy, and terms pages have no canonical link or Open Graph/Twitter metadata;
   privacy and terms also lack meta descriptions. The app has only a PNG favicon
   (not the required SVG/favicon + apple touch pairing). Legal pages are standalone
   minimal documents rather than the required consistent header, skip link,
   navigation, footer, version/build identifier, and legal route skeleton.

### S4 — Minor

9. **Mobile footer links remain too small.** In a fresh 390 px phone context,
   Privacy, Terms, and Source were 21.1 CSS px high (widths 46.2, 38.3, and 44.6
   px), below the 44 px touch-target baseline. This repeats the earlier minor
   finding.

10. **Hashed assets still use short revalidation rather than immutable caching.**
    The live hashed JS and CSS responses return
    `cache-control: public, must-revalidate, max-age=30`; they should be long-lived
    immutable assets. This repeats the earlier minor finding.

11. **Response hardening is still incomplete.** Live responses include HSTS,
    Referrer-Policy, and X-Content-Type-Options, but no Content-Security-Policy,
    Permissions-Policy, or framing restriction. This repeats the earlier minor
    finding.

## Evidence and checks

The checkout began clean at `d65a6bb`; `git diff 36cc00e..d65a6bb` contains only
the prior documentation reports. `npm ci` installed the documented Node
dependencies. Results:

| Check | Result | Evidence |
| --- | --- | --- |
| `npm test` | PASS | 4/4 Vitest tests and `tsc --noEmit` passed. |
| `npm run build` | PASS | Created `dist/`; JS 26,803 bytes (9.12 KB gzip), CSS 11,674 bytes (3.39 KB gzip), 18 SW precache entries. |
| `npm run test:e2e` | PASS | 3/3 Chromium tests passed. |
| `npm audit --omit=dev` | PASS | 0 shipped vulnerabilities. |
| Declared claim commands | NOT RUNNABLE | No `.factory/claims.json`, hence no declared commands or tagged claim coverage. |
| Live desktop and phone exercise | PASS with findings | Fresh 1440 px and 390 px sessions exercised empty, create, recall, evidence, persistence, offline, invalid, and boundary paths. |
| Live core path | PASS | Created an objective, answered its recall question, attached evidence, and verified persistence after reload with no console/page errors. |
| Offline reload | PASS | After online first load and service-worker control, an offline reload retained a saved objective and showed the offline notice. |
| Normal-flow privacy | PASS for observed flow | Network recording during create → recall → evidence used only `recall-objective-map.sociobot.in`. |
| Keyboard/accessibility smoke | PASS | Skip link, labels, focusable controls, dialogs, and normal keyboard flow worked in the exercised paths. |
| Axe serious/critical | PASS | Fresh desktop and phone scans using the repository's `@axe-core/playwright` found none. `@axe-core/cli` was also attempted but its Selenium launcher could not find a Chrome binary; the Playwright axe integration is the applicable completed scan. |
| Live smoke script | PASS | `verify-url.sh` reported title, `lang=en`, one h1, main, image alt, labeled buttons, and no console errors. |
| Links and legal routes | PASS with findings | Home, Privacy, Terms, sitemap, robots, and Source returned 200; route/metadata defects are listed above. |

The normal product path is useful: objective → recall answer → manual evidence →
weekly weak-skill map survives reload, and it does not claim to grade mastery.
There is no backend in scope, so tenant isolation, health, restart persistence, and
429/Retry-After checks do not apply. Manifest, service-worker control, and offline
reload were checked; the update behavior is unchanged from the prior verified
candidate and is not the source of this failure.

## Earlier-review disposition

| Earlier finding | Current disposition |
| --- | --- |
| Production checkout 404 | Open; reproduced HTTP 404. |
| Incomplete import crashes evidence guide | Open; reproduced uncaught error. |
| Whitespace-only required fields save | Open; reproduced blank mapped objective. |
| Hashed assets lack immutable caching | Open; reproduced 30-second must-revalidate header. |
| Footer touch targets too small | Open; reproduced 21.1 px height at 390 px. |
| Missing CSP, Permissions-Policy, frame protection | Open; reproduced missing headers. |
| Live/candidate identity concern | Resolved; live asset names/content are the implementation candidate, while `d65a6bb` is documentation-only. |

## Required next work

Add an isolated `/demo` sample namespace and documentation; create a complete claims
registry with one clean-demo observable test per public promise; enable the billing
product; reject malformed and trim-empty records before they replace local data; and
add the required landing, routes, metadata, 404, caching, headers, and touch-target
work. Re-run every claim command and the full live review after those repairs.
