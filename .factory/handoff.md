# Recall Objective Map — review handoff

## Current independent verdict: FAIL

Review 1 on 2026-09-05 confirmed the live product still serves implementation
`36cc00e1de26e02e1ca549241196addb57144510`; current repository commit
`d65a6bb87c896933ab52e78c4dae5c4e9c5968e1` is documentation-only. The complete
report is [review-1.md](review-1.md). It records 11 findings and 12 untested public
claims. Do not treat a successful build or worker exit as release acceptance.

Most important open work: add the required isolated sample demo and claims suite,
enable the Field Kit checkout, reject malformed/whitespace imports, and repair the
missing plain-word landing and route structure. Earlier verification details below
remain useful historical evidence; every earlier defect was retested and remains
open except the stale-deployment concern, which is resolved.

## How review 1 was verified

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm audit --omit=dev
```

Fresh desktop and 390 px phone browsers exercised the live core path, invalid and
boundary imports, persistence, offline reload, links, legal pages, metadata, and
response headers. The repository's Playwright axe integration reported no
serious/critical defects in the tested states. The command-line axe launcher could
not locate a Chrome binary in this worker; this was not substituted for the completed
Playwright accessibility scan.

## Previous verification handoff

## Independent verdict: FAIL

- Tested candidate: `36cc00e1de26e02e1ca549241196addb57144510`
- Tested live URL: <https://recall-objective-map.sociobot.in>
- Verification time: 2026-08-28 06:23–06:43 UTC
- Full evidence: [verification-1.md](verification-1.md)

The live shell, service worker, manifest, JS, CSS, privacy page, and terms page match
the candidate's production build byte for byte. This is not a stale-deployment result.
The candidate nevertheless fails acceptance for two major reasons:

1. Production Field Kit checkout returns HTTP 404 with
   `{"error":"enabled factory product","status":404}`, so the advertised one-time
   purchase cannot be completed.
2. Incomplete version-1 JSON imports can pass validation and persist; revealing the
   evidence guide then throws `Cannot read properties of undefined (reading 'replace')`.

A moderate validation defect also accepts whitespace-only objective, prompt, and
evidence fields and saves a blank mapped objective. Minor gaps are 21 px-high footer
link targets on mobile, 30-second revalidation on hashed assets instead of immutable
caching, and missing CSP/Permissions-Policy/framing headers.

## What passed

- Clean `npm ci`; no product code changed.
- `npm test`: 4/4 unit tests and strict TypeScript check passed.
- `npm run build`: exact production build passed; `dist/` generated; 18 SW precache
  entries.
- `npm run test:e2e`: 3/3 Playwright tests passed.
- `npm audit --omit=dev`: 0 shipped vulnerabilities. Full dev audit reports Vite high
  and Vitest critical advisories.
- Core nested-objective → recall → manual evidence → persisted weak-map flow passed.
- JSON and CSV exports passed; known invalid-format rejection preserved current data.
- Normal and empty flows made no outbound request; license verification was the only
  observed optional third-party request.
- Offline reload restored shell and IndexedDB records. A controlled SW-update probe
  displayed the update-ready announcement.
- Axe: 0 serious/critical findings in empty, populated, dialog, privacy, and terms
  states. Keyboard skip/focus, reduced motion, 390 px layout, and 200% text probe passed,
  aside from the footer touch targets.
- Lighthouse mobile live: 100 Performance / 100 Accessibility / 100 Best Practices /
  100 SEO; LCP 0.9 s, TBT 70 ms, CLS 0.
- Initial JS 26,803 bytes and CSS 11,674 bytes; image budgets passed; no normal-flow
  console/page errors.

## Reproduce

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm audit --omit=dev
curl -i https://api.sociobot.in/api/v1/products/recall-objective-map/checkout
```

## Required next steps

1. Enable/register production checkout, then test hosted purchase, return token,
   restore, cached verification, revocation, and offline optimistic unlock with a valid
   production license.
2. Fully validate every imported objective/check field and relationships before
   replacement; add malformed v1 regression cases.
3. Reject trim-empty required fields with an announced inline error.
4. Expand mobile footer link hit areas and configure immutable caching for hashed
   assets; add CSP, Permissions-Policy, and frame protection where the host supports it.
5. Rerun all gates and independent live identity/offline/update checks before release.

No product source, dependencies, generated assets, or deployment configuration were
modified by verification. Only this handoff and `.factory/verification-1.md` were added
or updated.
