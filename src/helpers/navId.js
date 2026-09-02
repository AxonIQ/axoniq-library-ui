'use strict'

// Builds a stable, unique data-nav-id for a nested item in nav-native-item.hbs
// by threading the ancestor path through recursion, e.g. navId(navId('0', 1), 2) -> '0-1-2'.
module.exports = (parent, index) => (parent == null || parent === '' ? '' : parent + '-') + index
