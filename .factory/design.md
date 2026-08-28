# Recall Objective Map — visual thesis

## Direction: a working field guide, printed in halftone

This product turns fuzzy confidence into inspectable evidence. Its interface therefore
borrows from a naturalist's field notebook and a two-ink screen print: warm paper,
decisive rules, compact annotations, registration marks, and a restrained halftone
texture. The map is the artifact—not a dashboard full of interchangeable cards.
Decoration appears only where it explains the objective → check → evidence loop.

The treatment is intentionally single-mode. A stable warm-paper canvas supports long
study sessions and is part of the print metaphor; it is explicitly painted at every
surface rather than inheriting the browser theme.

## Tokens

- Paper / background: `#F4F0E6`
- Lifted paper / surface: `#FFFDF7`
- Ink / primary text: `#18231F`
- Muted ink: `#58635D`
- Forest / primary action: `#175B47`; contrast text `#FFFFFF`
- Persimmon / attention: `#B8462A`; contrast text `#FFFFFF`
- Mustard / developing evidence: `#D5A72A`; paired with ink, never white text
- Success: `#267257`; warning: `#8A5B00`; danger: `#A52D25`
- Rule: `#A9A69B`; focus: `#075DCE`

All body combinations meet WCAG AA (4.5:1); color-coded evidence always has a text
label or shape companion.

## Type and spacing

No font files or third-party calls are needed. Headings use the locally available
editorial serif stack `Georgia, Cambria, "Times New Roman", serif`; controls and body
copy use the legible grotesque stack `"Arial Narrow", "Aptos Narrow", Arial, sans-serif`.
The narrow sans makes metadata feel tabular without compromising body legibility.
Body text never falls below 16px. The scale is 16, 18, 22, 30, and 48px with generous
1.45–1.6 leading. Spacing follows a 4px base rhythm: 4, 8, 12, 16, 24, 32, 48, 64.
Rules and proximity create groups before containers do.

## Interaction grammar

- Objectives read like expandable field-guide entries. A vertical ink line carries
  the hierarchy; indentation and numbered specimen marks show parentage.
- Evidence modes are large stamped toggles: **Explain**, **Solve**, **Recognize**.
- The single review question takes over a focused sheet; the learner reveals their
  own answer, records evidence, and sees the next weak objective immediately.
- Scoring language is deliberately evidence-based: “thin / building / supported,”
  never “mastered.” Percentages are not shown.
- Destructive actions name their target and require confirmation. Imports preview
  what will be replaced before committing.
- A persistent status line announces saves, errors, offline mode, and updates.

## Layout and responsive intent

Wide screens use a quiet two-column workbench: objective map on the left and the
selected objective/evidence ledger on the right. At 390px the ledger follows the map,
secondary annotations collapse, and the bottom review action stays reachable without
covering content. Targets are at least 44×44px and retain 8px separation. Long text
uses a 68-character measure.

## Texture and assets

CSS provides lightweight halftone fields using radial gradients and authored SVG icons
for interface symbols. The sole raster illustration is served responsively as AVIF,
WebP, and JPEG from `public/assets/`; it is an original editorial still-life: a
branching learning map printed on paper, with
three evidence stamps and no simulated UI/text. It explains the product's core loop
in the welcome/empty state. The manifest icons are authored SVG-derived PNGs.

### Generation prompt sheet

- Subject: an overhead arrangement of branching paper tabs converging on three simple
  stamped evidence shapes (speech loop, solved grid, recognition eye), with a pencil
  trace linking them.
- World/materials: recycled warm paper, coarse two-color screen-print ink, subtle
  registration offsets, tactile halftone dots.
- Light/lens: even overhead editorial light, orthographic/top-down framing, crisp edges.
- Palette words: warm bone paper, forest green ink, persimmon red, tiny mustard accents.
- Composition: landscape, visual weight to the right, calm open space, no fake app UI.
- Negative list: no text, letters, numbers, logos, watermark, gradients, people, hands,
  photorealistic screens, neon, purple, blue, generic corporate illustration.

Provenance: generated 2026-08-28 using the factory Azure image deployment via
`/opt/fleet/lib/gen-image.sh`, then inspected and converted locally to WebP. The output
is original to this product; generated imagery is disclosed in the footer.

## Motion

Motion is functional and paper-like: a 180ms opacity/translate reveal for newly opened
entries and a 220ms sheet transition for review. Nothing loops. Under
`prefers-reduced-motion: reduce`, transitions and smooth scrolling are removed and all
state changes are immediate. Depth remains through borders, overlap, and scale.
