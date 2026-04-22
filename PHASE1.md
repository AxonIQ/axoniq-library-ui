# Phase 1 — Docs restyle with Genesis tokens + Untitled UI look

A CSS-first restyle of the AxonIQ Antora UI bundle. Zero framework changes,
same Handlebars/Gulp/SCSS pipeline. Drops in Genesis design tokens, swaps
the brand look to the Untitled UI docs aesthetic, adds full light/dark mode,
and mocks a ⌘K command palette.

## What changed

### Design tokens (`src/css/custom_vars.css` — rewritten)
- Full Tailwind v4 neutral/red/green/blue/yellow/orange color ramps ported
  as CSS custom properties.
- Brand ramp = neutral (dark gray), matching Genesis default.
- 80+ semantic tokens: `--color-text-*`, `--color-bg-*`, `--color-border-*`,
  `--color-fg-*`, admonition accents, focus ring.
- Radii, shadows (Genesis scale), typography scale (text-xs → display-lg
  with per-size line-height and letter-spacing).
- All of Antora's existing variables (`--body-font-color`, `--nav-background`,
  `--toc-border-color`, etc.) are remapped to the new semantic tokens so the
  remaining 7k+ lines of built-in CSS adopt the palette automatically.
- Legacy AxonIQ color aliases (`--color-ox`, `--color-rhino`, `--color-dove`,
  `--color-primary`, etc.) remapped; they also flip in dark mode for any
  inherited rule that still uses them.

### Light / dark mode
- System preference by default via `@media (prefers-color-scheme: dark)`.
- Explicit toggle via `html[data-theme="light"|"dark"]`. Stored in
  `localStorage` under `axoniq-theme`.
- Inline pre-body script in `default.hbs` prevents FOUC.
- Dark-mode overrides include a tuned highlight.js palette (GitHub dark-
  inspired tokens) so code blocks stay legible.

### Typography (`src/css/base.css`)
- `@font-face` Geist (400/500/600/700) and Geist Mono (400/500/600) self-
  hosted from `src/font/`. Latin subset, ~13KB per weight.
- Body: Geist, 16px, line-height 1.6, letter-spacing −0.003em.
- OpenType features enabled globally: `kern`, `liga`, `calt`, `ss01`, `ss03`,
  `cv11`. Monospace adds `tnum` + `zero` (tabular, slashed zero). Numeric
  cells/opt-in `.tnum` class use `font-variant-numeric: tabular-nums
  slashed-zero`.
- Heading tracking: −0.015em. Display sizes carry explicit letter-spacing
  per the Genesis scale.

### Layout + components (`src/css/custom.css` — rewritten)
- Header: 64px, 1px bottom border, no decorative bg image, logo + left-
  aligned nav (Basics / Guides / Reference dropdowns) + right toolbar
  (⌘K search trigger + theme toggle + AxonIQ Platform CTA).
- Left nav: clean tree, uppercase section titles, subtle hover/active
  states, nested levels hang from a 1px guide line. Removed the old dark
  overlay that dimmed the nav when inactive.
- Content: max-width 768px, 16px body, heading scale from Genesis tokens,
  H2 with a subtle bottom rule.
- Code blocks: `--color-bg-secondary` panel, 1px border, radius-lg.
- Inline code: soft bg + 1px border, Geist Mono, slightly smaller.
- Admonitions: 1px-outer + 3px-colored-left-border. Backgrounds neutral
  (not the old color-tinted panels).
- Tables: 1px outer border, radius-lg, light header row.
- Blockquote: 2px brand-border left rule, no fill.
- Right TOC: sticky, border-left active indicator, uppercase heading.
- Pagination: card-style prev/next with border + hover.

### Command palette mock (`src/partials/cmdk.hbs`, `src/js/vendor/app.js`)
- ⌘K / Ctrl+K opens the modal. Click the header search trigger also opens.
- Esc closes. Overlay click closes. Arrow keys navigate. Enter "selects"
  (logs to console — this is a proposal mock, not a real search).
- Fake data grouped into Getting started / Guides / Reference / Platform.
- Result items: 28×28 monochrome icon + title + path + keyboard hint.
- Backdrop-blur overlay, smooth overshoot-into-place modal transition.
- Matches the Untitled UI cmdk pattern: grouped sections, subtle keyboard
  footer, fullscreen-with-margins modal.

### Theme toggle
- Single icon button in the header toolbar. Cycles auto → dark or light
  based on current state. Stored in `localStorage`.

### Build pipeline change (`gulp.d/tasks/build.js`)
- `postcssVar({ preserve: true })` (was `preserve: preview`). The default
  `preserve: false` inlines CSS custom properties at build time, which
  strips runtime var switching — dark mode would not work. Preserve keeps
  the `var()` calls so the browser resolves them live.

## What was NOT changed

- Information architecture: same pages, same nav structure. Restyled only.
- Antora content source. Playbook-dev has the bundle URL pointed at a
  local build (`../axoniq-library-ui/build/ui-bundle.zip`) for development.
- Framework. Still Handlebars + Gulp + vanilla CSS. No React, no Tailwind
  runtime.
- Original assets (logos, favicons, existing icons) except background
  imagery which was removed.

## Known issues / followups

- Admonition FontAwesome glyphs are currently missing (unicode `content:`
  strings need to be restored after my CSS rewrite). Deferred — user
  requested to skip.
- Nav IA is unchanged. Phase 2 introduces a persistent drawer-style nav
  with deeper nesting (see NAV_IA.md).
- Search is a UI mock. Real search would need wiring into the
  `@antora/lunr-extension` index or an external provider.
- `@axoniq/antora-vale-extension` throws `this.stop is not a function`
  post-build unrelated to the UI. Does not block the site.

## How to build + serve locally

```
# 1. UI bundle
cd axoniq-library-ui
npm install              # first time
npx gulp clean && npx gulp build && npx gulp bundle:pack

# 2. Site (consuming local bundle)
cd ../axoniq-library-site
npm install              # first time
npm run build:dev
npm run serve            # http://localhost:3000/home/
```

`axoniq-library-site/playbook-dev.yaml` is configured to pull the UI from
`../axoniq-library-ui/build/ui-bundle.zip` so the loop above is all you need.
