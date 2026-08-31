;(function () {
  'use strict'
  // TODO this needs to unify with 07-axoniq-feature.js functionality
  // Premium = Axoniq Framework exclusive. Three placement modes:
  //   1. data-premium="category" on a nav <section> → mark the section title
  //   2. data-premium="route"    on a nav <a>       → mark the link (right side)
  //   3. Entries in PREMIUM_SECTIONS below          → mark an in-page heading
  //
  // Content-section marks use pathname-prefix match + a list of heading texts.
  // Keeping it centralized here instead of in AsciiDoc keeps the marking
  // decoupled from upstream content repos.
  var PREMIUM_SECTIONS = [
    {
      pathPrefix: '/axon-framework-reference/development/events/event-store-internals/',
      headings: ['DCB', 'Dynamic Consistency Boundary'],
    },
  ]

  var TOOLTIP_TEXT = 'This feature is exclusive to Axoniq Framework'

  var config = (document.getElementById('site-script') || { dataset: {} }).dataset
  var uiRootPath = config.uiRootPath == null ? '.' : config.uiRootPath
  var LOGO_URL = uiRootPath + '/img/axoniq-framework.svg'

  function makeIcon (size) {
    var img = document.createElement('img')
    img.src = LOGO_URL
    img.alt = ''
    img.width = size
    img.height = size
    img.setAttribute('aria-hidden', 'true')
    return img
  }

  function makeMark (size, extraClass) {
    var span = document.createElement('span')
    span.className = 'premium-mark' + (extraClass ? ' ' + extraClass : '')
    span.setAttribute('data-tooltip', TOOLTIP_TEXT)
    span.setAttribute('role', 'img')
    span.setAttribute('aria-label', TOOLTIP_TEXT)
    span.appendChild(makeIcon(size))
    return span
  }

  // --- Nav: category + route marks ---

  function markNav () {
    var section, i
    var sections = document.querySelectorAll('.drawer [data-premium="category"]')
    for (i = 0; i < sections.length; i++) {
      section = sections[i]
      var title = section.querySelector('.nav-section-title')
      if (title && !title.querySelector('.premium-mark')) {
        title.appendChild(makeMark(14, 'premium-mark--nav'))
      }
    }
    var links = document.querySelectorAll('.drawer [data-premium="route"]')
    for (i = 0; i < links.length; i++) {
      if (links[i].querySelector('.premium-mark')) continue
      links[i].appendChild(makeMark(16, 'premium-mark--nav'))
    }
  }

  // --- Content: in-page heading marks ---

  function normalizeText (s) {
    return (s || '').replace(/\s+/g, ' ').trim()
  }

  function findHeadingByText (needle) {
    var candidates = document.querySelectorAll('.doc h1, .doc h2, .doc h3, .doc h4, .doc h5, .doc h6')
    for (var i = 0; i < candidates.length; i++) {
      var text = normalizeText(candidates[i].textContent)
      if (text === needle || text.indexOf(needle) === 0) return candidates[i]
    }
    return null
  }

  function markContent () {
    var path = window.location.pathname
    for (var i = 0; i < PREMIUM_SECTIONS.length; i++) {
      var entry = PREMIUM_SECTIONS[i]
      if (path.indexOf(entry.pathPrefix) !== 0) continue
      for (var j = 0; j < entry.headings.length; j++) {
        var h = findHeadingByText(entry.headings[j])
        if (h && !h.querySelector('.premium-mark')) {
          h.appendChild(makeMark(24, 'premium-mark--inline'))
        }
      }
    }
  }

  function run () {
    markNav()
    markContent()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run)
  } else {
    run()
  }
})()
