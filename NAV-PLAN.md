# Navigation Management Plan — fixed sections, dynamic content

## The requirement

The drawer must keep its **curated top-level sections, always present, in a fixed
editorial order**:

> Getting started · Core concepts · Operations · Migration · Guides · Extensions · Release notes

But the **content inside** each section must be **dynamic**: when a page is added
to a docs source repo, it must appear in the right section automatically. It
**cannot be a manual chore** — engineers already resist documenting; editing a
central nav file by hand is a non-starter.

So we need: *fixed editorial skeleton (owned by docs) + auto-populated contents
(driven by the content itself)*. This document is how we get there with Antora.

> **Status: implemented as a working prototype.** The design below is built:
> `axoniq-library-site/lib/nav-assembler.js` (extension) + `nav-manifest.js` (skeleton)
> assemble the drawer from Antora's nav model and emit it as the `nav-generated`
> partial that `nav-drawer.hbs` renders server-side. Verified: all seven sections
> populate from `nav.adoc` (Core concepts 27, Operations 19, Migration 19, Release
> notes 4, Extensions 34, Guides 4 links), and the existing active-path / expand /
> persistence JS works on the generated markup unchanged. **Prerequisite discovered
> during implementation:** see "The one hard prerequisite" below.

---

## Why today's drawer can't do this

The current `nav-drawer.hbs` is **hand-authored static markup** — every link is
typed out. It has three fatal properties for this requirement:
- New content does **not** appear until someone hand-edits the partial.
- It is **out of sync by construction** (it duplicates what's already in each
  repo's `nav.adoc`).
- It is **decoupled from Antora**, so it can't reuse anything Antora already knows.

The fix is to stop duplicating and start **consuming Antora's own navigation
model**, then overlay the curated sections on top.

---

## The key insight (this is the "negotiation with Antora")

**Reflecting new content is not a new chore — it is the chore that already
exists.** For any page to appear in navigation *at all*, Antora requires it to be
listed in that component's `nav.adoc`. Engineers already do this (or must, for the
page to be reachable). So:

- **Content membership** already lives in each repo's `nav.adoc` — engineer-owned,
  already required, **zero new effort**.
- **The curated cross-product sections** (Getting started, Core concepts, …) are
  editorial groupings that span components. They don't exist in Antora's
  per-component model — so they live in a small **docs-team-owned manifest**.

The restyle's mistake was throwing away `nav.adoc` and hardcoding. We reverse that.

## The one hard prerequisite (discovered during implementation)

A component only contributes navigation if it **declares `nav:` in its `antora.yml`**.
The Axon Framework reference (`axon-framework-reference`) did **not** — its nav content
lives in `modules/ROOT/partials/nav.adoc` but was never declared, so Antora built
**zero** navigation for that component. That is almost certainly the original reason the
drawer was hardcoded: there was no Antora nav to consume.

The fix is one line in the component's `antora.yml`:

```yaml
nav:
  - modules/ROOT/partials/nav.adoc
```

With that in place, the assembler picks the whole reference tree up automatically. This
must land in the **source repos** (Axon Framework, and any other component missing a
`nav:` declaration) for production. For the local preview it is applied to the
`localLinks` clone. This is a genuinely one-time, one-line-per-component change — not a
recurring chore — and after it, new pages flow in through `nav.adoc` as designed.

Note also that a component's navigation is keyed by **version**; the assembler picks the
version that actually has navigation (the reference's real nav is under one version while
a legacy release-notes archive sits under another), so `nav-assembler.js` iterates
versions rather than trusting "latest".

---

## What Antora gives us (verified against the installed version)

- Content is aggregated into **components / versions**; each has one or more
  `nav.adoc` files. Antora builds a navigation tree per component version.
- Antora **extensions** (Node.js, registered in the playbook under
  `antora.extensions`) run during generation and receive lifecycle events:
  `contentAggregated → contentClassified → documentsConverted → navigationBuilt →
  pagesComposed → siteMapped → beforePublish`.
- At `navigationBuilt` (and after) an extension has the **navigationCatalog**, whose
  `getNavigation(component, version)` returns that component version's nav trees
  (the exact structure the UI renders).
- The UI model already exposes `site.components` (all components/versions) and, per
  page, `page.navigation` — so Antora is clearly built to hand navigation to the
  theme; we just need a *unified, curated* version of it.

That's everything the design below needs; no forking of Antora.

---

## Design: a manifest + a small Antora extension ("nav-assembler")

Two pieces, with a clean ownership split.

### 1. `nav-manifest.yml` — the fixed skeleton (docs-team-owned, in the **site** repo)

Declares the sections, their order, and which content flows into each. Editorial,
changes rarely.

```yaml
sections:
  - title: Getting started
    include:
      - component: home
      - component: axon-framework-5-getting-started
      - component: bikerental-demo

  - title: Core concepts
    include:
      - component: axon-framework-reference
        startsWith: [messaging-concepts, commands, events, queries]

  - title: Operations
    include:
      - component: axon-framework-reference
        startsWith: [testing, tuning, monitoring, spring-boot, modules, conversion]

  - title: Migration (AF4 → AF5)
    include:
      - component: axon-framework-reference
        startsWith: [migration]

  - title: Extensions
    include:
      - componentGlob: "*-extension-reference"     # all extensions, auto-discovered

  - title: Release notes
    include:
      - pathMatches: release-notes                  # cross-component
```

- `include` entries are **matchers**, not link lists — they say *"whatever nav
  entries the source already has that match this, put them here."*
- `componentGlob` means **new extensions appear automatically** with zero manifest
  edits.
- Section order and titles are guaranteed and stable regardless of content.

### 2. `nav-assembler` extension — assembles the tree (in the **site** repo)

Registered in the playbook:

```yaml
antora:
  extensions:
    - require: ./lib/nav-assembler.js
      manifest: ./nav-manifest.yml
```

At `navigationBuilt`, it:
1. Loads the manifest.
2. For every component version, reads `navigationCatalog.getNavigation(component,
   version)` — the real, current nav derived from each repo's `nav.adoc`.
3. Buckets those nav entries into the manifest's sections using the matchers,
   preserving each source's `nav.adoc` ordering within a section.
4. Emits **every section from the manifest** (even empty ones, so the skeleton is
   always present — with an optional `hideWhenEmpty` flag).
5. Publishes the assembled tree (see "How the drawer gets it" below).

### 3. The drawer renders the assembled tree

`nav-drawer.hbs` stops hardcoding links. It loops over the assembled sections:
fixed section headers come from the manifest; children come from the assembled
(dynamic) tree. The product/version switcher stays as-is but can likewise be fed
from `site.components` instead of a hardcoded list (a natural follow-on).

---

## How the assembled nav reaches the template — implemented

We render **server-side** (no flash, no extra client JS, works with the existing
active-path logic). The plan originally proposed a client-side `nav.json`; during
implementation we found a cleaner path that the Lunr extension itself uses:

**The extension generates a Handlebars partial into the UI catalog.** At the
`navigationBuilt` event the extension has `contentCatalog`, `navigationCatalog`, and
`uiCatalog`. It assembles the HTML and calls `uiCatalog.addFile(... type: 'partial',
path: 'partials/nav-generated.hbs' ...)` (overriding a stub shipped in the UI bundle).
`nav-drawer.hbs` then just does `{{> nav-generated}}`. Because this runs before
`createPageComposer`, the partial is registered in time for every page. Injecting into
the per-page UI model is *not* cleanly exposed by Antora, so this partial approach is
the pragmatic server-side win — and it needs no `app.js` changes.

---

## Ownership — why this isn't a chore

| Piece | Owner | Frequency | New effort? |
|---|---|---|---|
| Page appears in its repo's `nav.adoc` | Engineers | Per page (existing Antora step) | **None new** |
| Section list, order, component→section mapping (`nav-manifest.yml`) | Docs team | Rare, editorial | Small, centralized |
| `nav-assembler` extension + drawer refactor | One-time build | Once | One-time |

**Adding a page** = engineer adds it to `nav.adoc` (already required) → next build,
the assembler slots it under the mapped section. No drawer edit, no manifest edit.

**Adding a new extension component** = appears automatically via `componentGlob`.

**Adding a brand-new top-level product** = docs team adds one manifest line. Rare.

---

## Fixed skeleton + versions

- **Always-present sections:** the assembler emits every manifest section
  regardless of content, so the IA never collapses. `hideWhenEmpty: true` is
  opt-in per section.
- **Version awareness:** `getNavigation` is per component version, so the assembled
  tree is built per version. The drawer shows the active version's tree; the
  version switcher (already built) selects it. Cross-product sections aggregate
  each component at its selected/current version.

---

## Phased rollout

1. **Phase 0 (done):** hardcoded drawer shipped and documented.
2. **Phase 1 — pilot (done):** built `nav-assembler` + `nav-manifest.js`; server-side
   generated partial; all sections assembled from `nav.adoc`. Hardcoded nav removed
   from `nav-drawer.hbs`.
3. **Phase 2 (done):** product/version switcher is now dynamic — versions come from
   `site.components` (products remain a tiny editorial mapping with logos); products
   with no versions in the build are hidden. Extensions group one-per-extension;
   tutorials nest under their component title.
4. **Phase 3 — productionize (next):** land the `nav:` declaration for
   `axon-framework-reference` in the source repo (the AF team's `_reference-guide-preview`
   already has it); refine manifest matchers (tighten `home` → "Getting started").
5. **Phase 4 — polish:** align the drawer tree to the switcher's selected version;
   `hideWhenEmpty` per section; optional relativized (non-root) URL support.

---

## Risks / open questions (spikes to run in Phase 1)

- **UI-model injection point** for Option B — confirm during the pilot; Option A
  de-risks this.
- **Matcher granularity:** some sections (Core concepts vs Operations) split a
  single component's pages by path. That relies on the component's `nav.adoc` being
  reasonably structured, or on `startsWith`/path matchers. Worst case: a small,
  one-time `nav.adoc` reorg in a few repos (still normal Antora authoring, not a
  recurring chore).
- **Ordering across multiple includes** in one section — resolved by manifest
  include order + `nav.adoc` order within each.
- **Empty vs hidden sections** — decide the default with the docs team.

---

## Bottom line

Keep the curated sections as a tiny, docs-team-owned **manifest** (fixed skeleton),
and populate them from each repo's **existing `nav.adoc`** via a small **Antora
extension**. New content flows in through the step engineers already perform, so it
is dynamic without becoming a chore — which is exactly the negotiation with Antora
the CTO asked for.
