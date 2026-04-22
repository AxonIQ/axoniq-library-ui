# Navigation IA — current state + Phase 2 proposal

## 1. Current top-level bar (header)

Rendered in `src/partials/header-content.hbs`:

```
Logo  |  Basics   Guides ▾   Reference ▾   [search]   [☾]   [AxonIQ Platform]
```

- **Basics** → single page `home:basics.adoc`
- **Guides ▾** (dropdown):
  - Axon Framework
  - Axon Server
- **Reference ▾** (dropdown, populated dynamically from any component whose
  `asciidoc.attributes.type == 'reference'`):
  - Axon Framework
  - Axon Server *(private repo — currently absent in local build)*
  - Axon Synapse *(private)*
  - AxonIQ Platform *(private)*

## 2. Current left rail (Antora `component-nav`)

Antora renders one nav per "component" (a versioned content source). Each
component's nav is authored as `nav.adoc` in the source repo. The site
aggregates 13 public components and would include 6 more from private
repos.

### 2.1 Public components with nav trees

#### `home` (the outer shell — content/home/modules/ROOT/nav.adoc)

```
* Basics
* Guides
  ** Axon Framework
  ** Axon Server
* Reference
  ** Axon Framework        → xref to axon-framework-reference component
  ** Axon Server           → private
  ** Axon Synapse          → private
  ** Axoniq Platform       → private
```

#### `axon-framework-reference` (AxonFramework/docs/reference-guide)

Composed from 10 module partials. Already 3–4 levels deep.

```
* Migration
  ** Why upgrade
  ** Prerequisites
  ** Solved architecture choices
  ** Understanding architecture principles
  ** Paths
    *** Messages
    *** Aggregates
      **** Configuration migration
      **** Multi-entity migration
      **** Polymorphism migration
    *** Projectors & event processors
    *** Event store
    *** Test fixtures
    *** Serializers
    *** DLQ
    *** Interceptors
    *** Configuration
    *** Sequencing policies
* Messaging concepts
  ** Anatomy of a message
  ** Message intercepting
  ** Supported parameters (annotated handlers)
  ** Message correlation
  ** Exception handling
  ** Processing context
* Commands
  ** Command handlers
  ** Command dispatchers
  ** Infrastructure
  ** Configuration
* Events
  ** Event handlers
  ** Event publishing
  ** Event processors
    *** Subscribing
    *** Streaming
    *** Dead-letter queue       (advanced only)
  ** Infrastructure
    *** Event store internals
  ** Event versioning
* Queries
  ** Query handlers
  ** Query dispatchers
  ** Infrastructure
  ** Configuration
* Testing
  ** Basic testing
  ** Matchers & field filters
  ** Advanced testing
* Conversion
* Tuning
  ** Snapshotting              (advanced only)
  ** Caching                   (advanced only)
  ** Event processing
  ** Command processing
  ** RDBMS tuning
* Monitoring
  ** Tracing                   (advanced only)
  ** Metrics
  ** Health
  ** Processors
  ** Message tracking
* Spring Boot integration
* Modules
* Release notes
  ** Major releases
  ** Minor releases
* Known issues and workarounds
```

#### AxonFramework additional guides (separate components)

- `axon-framework-5-getting-started` — 9 pages, flat
- `identifier-generation-guide` — 1 page
- `message-handler-customization-guide` — 2 pages, flat
- `meta-annotations-guide` — 1 page

#### Extension references (11 separate components, each small)

All live at `extension-*` components — each a single flat list of 2–5 pages:

- AMQP: Forwarding / Reading / Release notes
- JGroups: *(single page; tracing-like)*
- JobRunr Pro: *(empty nav, landing page only)*
- Kafka: Publishing / Consuming / Message format / SpringBoot configuration / Release notes
- Kotlin: Commands / Events / Queries / Release notes
- Mongo: Spring config / SpringBoot config / DLQ spring config / Release notes
- Multitenancy, Reactor, Spring AOT, Spring Cloud, Tracing — similar shape

#### Tutorials / quick-starts

- `bike-rental-demo` — 8 steps, flat
- `bikerental-console-demo` — 4 sections (intro / connect-your-app / monitoring / conclusion), up to 3 levels deep

#### Site-wide content components (content/…)

- `home` — outer shell (see above)
- `as-faq` — 1 page
- `axon-server-installation` — 4 distribution channels (Developer / Professional / Enterprise / Migrations) × 4–5 distros each → ~20 leaf pages
- `axon-server-upgrade` — 1 page
- `axoniq-console-faq` — 1 page
- `axon-framework-update-checker` — 1 page

### 2.2 Private components (referenced but not buildable locally)

Same shape as their public siblings. Left as placeholders in the nav:

- `axon-server-reference`
- `axon-server-image-build`
- `axon-synapse` (synapse-reference)
- `axoniq-platform` (axoniq-platform-reference)
- `axoniq-playbook`
- `axoniq-framework` (the AF 5 docs companion)

## 3. Current right rail (TOC)

Generated per-page by Antora from heading structure. Already rendered in a
sticky aside (`aside.toc`). Phase 1 restyled it with a left-border active
indicator; Phase 2 keeps it on the right, unchanged.

## 4. What's wrong with the current IA

1. **Three parallel nav systems** competing for attention:
   - Header dropdowns ("Basics / Guides / Reference")
   - Left rail per-component (deeply nested inside reference)
   - Right TOC
2. **No global sense of place.** Inside `axon-framework-reference`, the
   left rail shows that component's nav only. There is no way to jump to
   Extensions, Guides, or Axon Server without first going back to the
   header dropdown.
3. **Deep reference structure is invisible.** The 3rd and 4th levels
   (Migration → Paths → Aggregates → Polymorphism-migration) exist but
   require multiple clicks — the header dropdowns only show top-level
   components.
4. **Reference vs Guides split is a false dichotomy for users.** A dev
   looking up how to configure event processors doesn't care whether
   it's labelled "Guide" or "Reference." They want the topic.
5. **Flat extension list.** 11 extensions are 11 separate sibling
   components. No grouping (messaging / data-stores / observability).
6. **Versions drawer is awkward** (bottom-left `nav-panel-explore` lists
   every component + its versions). Untitled UI pattern is a version
   selector chip on the drawer header.

## 5. Phase 2 — proposed drawer IA (Untitled-UI style)

### 5.1 Structural changes

- **Single persistent left drawer** — always visible on ≥ lg. Collapses
  to a hamburger on < md. No header dropdowns.
- **Drawer header**: AxonIQ Docs logo + product-switcher pill (pill shows
  current area; click → panel with all areas).
- **Drawer sections** (collapsible, deep-nestable — up to 4 levels). Order
  reflects journey, not source-repo layout.
- **Right TOC** (page-local) stays as-is; on < xl it collapses above the
  content as a native `<details>`.
- **Header becomes a utility strip**: logo | breadcrumbs | ⌘K | theme |
  external link (AxonIQ Platform). No nav links — those live in the drawer.

### 5.2 Proposed drawer tree

```
┌─ AxonIQ Docs ───────────────────────────────────────────┐
│  [Axon Framework 4.11 ▾]   ← product + version switcher │
├─────────────────────────────────────────────────────────┤
│  GETTING STARTED                                        │
│    Introduction                                         │
│    Quick start (bike rental)                            │
│    Getting started with AF 5                            │
│                                                         │
│  CORE CONCEPTS                                          │
│    Messaging concepts                                   │
│      Anatomy of a message                               │
│      Message intercepting                               │
│      Supported parameters                               │
│      Message correlation                                │
│      Exception handling                                 │
│      Processing context                                 │
│    Commands                                             │
│      Command handlers                                   │
│      Command dispatchers                                │
│      Infrastructure                                     │
│      Configuration                                      │
│    Events                                               │
│      Event handlers                                     │
│      Event publishing                                   │
│      Event processors                                   │
│        Subscribing                                      │
│        Streaming                                        │
│        Dead-letter queue                                │
│      Infrastructure                                     │
│        Event store internals                            │
│      Event versioning                                   │
│    Queries                                              │
│      Handlers / Dispatchers / Infrastructure / Config   │
│                                                         │
│  OPERATIONS                                             │
│    Testing                                              │
│    Conversion                                           │
│    Tuning                                               │
│      Snapshotting / Caching / Event proc / Cmd proc    │
│      RDBMS tuning                                       │
│    Monitoring                                           │
│      Tracing / Metrics / Health / Processors / Tracking │
│    Spring Boot integration                              │
│    Modules                                              │
│                                                         │
│  MIGRATION (AF4 → AF5)                                  │
│    Why upgrade                                          │
│    Prerequisites                                        │
│    Solved architecture choices                          │
│    Understanding architecture principles                │
│    Paths                                                │
│      Messages                                           │
│      Aggregates                                         │
│        Configuration migration                          │
│        Multi-entity migration                           │
│        Polymorphism migration                           │
│      Projectors & event processors                      │
│      Event store                                        │
│      Test fixtures / Serializers / DLQ / Interceptors   │
│      Configuration / Sequencing policies                │
│                                                         │
│  GUIDES                                                 │
│    Identifier generation                                │
│    Message handler customization                        │
│      Parameter resolvers                                │
│      Handler enhancers                                  │
│    Meta-annotations                                     │
│                                                         │
│  EXTENSIONS                        ← grouped            │
│    Messaging                                            │
│      Kafka / AMQP / JGroups                             │
│    Data stores                                          │
│      Mongo                                              │
│    Language                                             │
│      Kotlin                                             │
│    Reactive                                             │
│      Reactor                                            │
│    Multi-tenancy                                        │
│    Jobs                                                 │
│      JobRunr Pro                                        │
│    Spring                                               │
│      Spring AOT / Spring Cloud                          │
│    Observability                                        │
│      Tracing                                            │
│                                                         │
│  RELEASE NOTES                                          │
│    Major releases / Minor releases / Known issues      │
└─────────────────────────────────────────────────────────┘
```

Switching product via the pill reshapes the drawer:

```
Axon Server ▾
  ├─ Getting started
  │    Install (Developer / Professional / Enterprise)
  │    Upgrade
  ├─ Reference (private — gated)
  └─ FAQ

Axon Synapse ▾  (private)
Axoniq Platform ▾  (private)
```

### 5.3 Behaviours

- **Persistent** — drawer stays mounted across navigation; only the
  active item scrolls into view. Saves scroll position.
- **Collapsible sections** — `<details>` under the hood, each remembers
  open/closed in `localStorage` per section-id.
- **Active trail** — all ancestors of the current page get a subtle
  left-indicator line; only the leaf gets the filled state.
- **Deep nesting rendering** — indent guide lines at each level (1px
  `--color-border-secondary`), identical to Untitled UI's drawer.
- **Product switcher** — pill button in drawer header opens a popover
  listing products + current version; clicking a product re-scopes the
  drawer without a full reload (phase 2+ — for the proposal it can be a
  plain link that navigates).
- **Version chip** — small `--font-mono` badge next to the product name.
  Clicking opens a popover with all available versions.
- **Keyboard** — `[` toggles drawer, `]` focuses first item, arrows
  navigate siblings, `→`/`←` expand/collapse, `Enter` opens.

### 5.4 What's needed in code for Phase 2

1. **New partial `nav-drawer.hbs`** — renders the grouped tree. For the
   proposal we can render it from a static JSON (like `nav.json`) to
   decouple from Antora's component model; a later phase wires it up to
   `site.components`.
2. **New partial `header-utility.hbs`** — drops the center nav dropdowns,
   keeps logo + breadcrumbs + ⌘K + theme + CTA.
3. **CSS**: `src/css/nav-drawer.css` with the deep-nesting guide lines,
   section collapsers, active/ancestor states, version chip, product
   switcher popover.
4. **JS additions** (in `app.js`): `<details>` persistence, keyboard map,
   scroll-into-view on load, ancestor-trail class-marking from
   `page.url`.
5. **Layout change** (`default.hbs` + `body.hbs`): always render the
   drawer mounted in the body flex row; content area flex-grows; TOC
   stays right.
6. **Mobile**: drawer becomes a slide-over. Hamburger in the header.

### 5.5 Migration plan

The site pulls content from many repos. The drawer tree above is more
opinionated than any single `nav.adoc`. Two ways to produce it:

- **A. Hand-authored** at the UI level (one `nav.json` file shipped with
  the UI bundle). Fastest; good enough for the proposal demo; stays
  authoritative for cross-component structure.
- **B. Aggregated** from `site.components` with per-component metadata
  (group, category, tier). Requires touching every source repo. Better
  long-term but not necessary for phase 2.

We'll ship **A** for the proposal and document **B** as the production
follow-up.
