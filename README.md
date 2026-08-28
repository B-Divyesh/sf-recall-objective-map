# Recall Objective Map

Recall Objective Map is an offline-first field guide for self-learners beginning a
broad subject. It keeps learning objectives, one-question recall checks, and manually
recorded evidence together so the next weak sub-skill is visible without browsing a
card deck. It is deliberately not a scheduler, course generator, or mastery score.

Live: <https://recall-objective-map.sociobot.in>

## What it does

- Maps nested objectives with one recall question and an explicit evidence target.
- Records explain, solve, or recognize evidence as thin, building, or supported.
- Surfaces the two objectives with the thinnest evidence in a rolling weekly map.
- Stores everything locally in IndexedDB and works after the network disappears.
- Exports full JSON backups and portable weak-skill CSV reports; imports with preview.
- Optionally unlocks printable reports and longer evidence lenses with a one-time license.

Evidence labels reflect the learner's own recorded attempts; they do not measure
mastery or ability.

## Develop and verify

Requires Node.js 20+.

```sh
npm install
npm run dev
npm test
npm run build       # exact production command; writes dist/index.html
npm run test:e2e    # production build + Chromium accessibility/offline flows
```

Preview the production build with `npm run preview`. The custom build step injects all
generated assets into the service worker’s versioned precache.

## Data and privacy

Learning records never leave the browser. There are no analytics, ads, external fonts,
or runtime CDN dependencies. When a user supplies a paid license, the app contacts only
the Sociobot verification endpoint at most once per day. See `/privacy/` and `/terms/`.

## Deploy

Deploy the contents of `dist/` as a static site with history fallback to `index.html`.
Do not deploy from the repository root. The factory manages DNS, billing product
registration, and release-time billing configuration.

The researched scope is in `.factory/brief.json`, visual system and asset provenance in
`.factory/design.md`, and verification notes in `.factory/handoff.md`.

## License

MIT © 2026 Sociobot (Param Factory). See `LICENSE`.
