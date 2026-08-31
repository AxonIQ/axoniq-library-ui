'use strict'

// Returns the name of the version-aware drawer partial for the current page,
// e.g. navPartial('axon-framework-reference', '0') -> 'nav-cv-axon-framework-reference-0'.
// The `nav-assembler` Antora extension emits one such partial per component-version
// (see axoniq-library-site/lib/nav-assembler.js). Keep this sanitization in sync
// with partialKey() there. Usage: {{> (navPartial page.component.name page.version) }}
module.exports = (component, version) => {
  // Pages without a component-version (404, list pages) fall back to the default
  // drawer, which the extension always emits.
  if (!component || !version) return 'nav-generated'
  return 'nav-cv-' + (String(component) + '-' + String(version)).replace(/[^a-z0-9]+/gi, '-').toLowerCase()
}
