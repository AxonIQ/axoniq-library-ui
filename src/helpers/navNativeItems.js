'use strict'

// Flattens page.navigation the same way nav-assembler.js's menuGroups() does:
// an untitled top-level menu (the common case — a plain nav.adoc with no
// leading `.Title` line) is unwrapped so its items become top-level entries;
// a TITLED menu (e.g. a legacy versioned nav.adoc's ".Axon Framework 4.x"
// block) is kept as its own group instead of silently dropping the title.
module.exports = (navigation) => {
  var out = []
  ;(navigation || []).forEach((menu) => {
    if (!menu.content && (menu.items || []).length) {
      out = out.concat(menu.items)
    } else if (menu.content || menu.url || (menu.items || []).length) {
      out.push(menu)
    }
  })
  return out
}
