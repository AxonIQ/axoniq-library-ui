'use strict'

// Returns the name of the drawer-body partial to render for the current page.
// Usage: {{> (navPartial page.component.name page.version) }}
//
// On the aggregated axoniq-library-site build, the `nav-assembler` Antora
// extension (axoniq-library-site/lib/nav-assembler.js) OVERWRITES this exact
// file at build time with a generated version that returns the real,
// version-aware `nav-cv-<component>-<version>` partial it assembled for the
// page, falling back to 'nav-native' for anything it didn't cover.
//
// This is the DEFAULT, shipped as-is in the ui-bundle and used unmodified by
// every other build that doesn't register that extension — e.g. an
// individual repo's own local doc-verification playbook. 'nav-native' always
// exists (it renders page.navigation directly, see partials/nav-native.hbs),
// so those builds never hit a missing-partial build failure.
module.exports = () => 'nav-native'
