# Recall Objective Map

Recall Objective Map is for self-learners starting a broad topic. It ties each recall
question to a stated objective, then shows the two objectives with the thinnest recent
evidence. The labels describe self-recorded attempts; they do not measure mastery.

Live: <https://recall-objective-map.sociobot.in>

Demo: <https://recall-objective-map.sociobot.in/demo>

## What it does

- Nests objectives and keeps one recall question and evidence target with each one.
- Records Explain, Solve, or Recognize evidence as Thin, Building, or Supported.
- Compares the last 7, 14, or 30 days and shows the two thinnest objectives.
- Keeps real and demo records in separate browser storage.
- Works offline after the first online load.
- Exports complete JSON backups and one CSV report row per objective.
- Rejects malformed imports and asks before replacing a map.
- Sends no learning records or tracking requests to another origin during normal use.

The complete objective, recall, report, import, and export workflow is free. It needs
no account. This app does not generate course content, grade mastery, or schedule cards.

## Run and verify

Requires Node.js 20 or newer.

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm audit
```

`npm run build` writes the deployable site to `dist/`. To run one registered public
claim from a clean checkout, use its exact command in `.factory/claims.json`, for
example:

```sh
npm run test:claims -- --grep '@claim:offline-reload'
```

## Data and privacy

Real records use IndexedDB database `recall-objective-map`. Demo records use
`recall-objective-map-demo`. Separate localStorage keys provide a browser fallback.
JSON export keeps a full backup; CSV export contains the weak-objective report.

There are no analytics, ads, external fonts, third-party scripts, accounts, or runtime
CDN dependencies. See `/privacy` and `/terms`.

## Deploy

Deploy only the contents of `dist/`. `staticwebapp.config.json` declares the known SPA
routes, designed 404 response, immutable hashed-asset caching, MIME types, and security
headers. The factory manages DNS and deployment infrastructure.

Scope is recorded in `.factory/brief.json`, the visual system and asset provenance in
`.factory/design.md`, the demo in `.factory/demo.md`, and verification in
`.factory/handoff.md`.

## License

MIT © 2026 Sociobot (Param Factory). See `LICENSE`.
