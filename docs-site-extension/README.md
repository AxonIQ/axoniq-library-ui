# Site-repo pieces for the dynamic navigation

These two files do **not** belong in this UI-bundle repo. They live in the docs
**site** repo (`axoniq-library-site`, the one with the Antora playbook). They are
included here so the navigation feature can be reviewed as one unit. See
[`../NAV-PLAN.md`](../NAV-PLAN.md) for the full design.

## What they do
- **`nav-assembler.js`** — an Antora extension. At the `navigationBuilt` step it
  reads every component version's navigation (built from each repo's `nav.adoc`)
  and emits one drawer partial per component-version (`nav-cv-<component>-<version>`)
  plus a default. The UI's `navPartial` helper picks the right one per page, so the
  drawer is version-aware (older versions render their own nav).
- **`nav-manifest.js`** — the curated, docs-team-owned skeleton: the fixed sections
  and which content flows into each. This is the only editorial (non-dynamic) part.

## How to wire it into the site repo (one-time, ~4 lines of change)
1. Copy `nav-assembler.js` into `axoniq-library-site/lib/` and `nav-manifest.js`
   into the site repo root.
2. Register the extension in the playbook(s) under `antora.extensions`:
   ```yaml
   antora:
     extensions:
       - id: nav-assembler
         require: ./lib/nav-assembler.js
   ```
3. Ensure `axon-framework-reference` declares its nav in `antora.yml`. On `main` it
   currently does not (the AF team's `_reference-guide-preview` variant already does):
   ```yaml
   nav:
     - modules/ROOT/partials/nav.adoc
   ```

## Impact
- No change to how docs are authored. Authors keep editing `nav.adoc` as today; new
  pages appear in the drawer on the next build.
- The only build change is the extension registration above, plus the one `nav:`
  line. That is the entire footprint on the docs project.

## Notes for the reviewer
- Generated nav links are site-root absolute (fine for root-served docs; would need
  relativizing if ever served under a sub-path).
- The `home` component's landing nav is broad, so it currently over-fills the
  "Getting started" section. Tighten via the manifest matchers.
- Version/product coverage depends on which branches/repos the build includes;
  a local dev build shows only what it pulls.
