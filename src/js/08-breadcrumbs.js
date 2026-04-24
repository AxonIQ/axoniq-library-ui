;(function () {
  'use strict'

  // Antora only populates page.breadcrumbs from nav.adoc — our hand-authored
  // drawer nav bypasses that, so most pages render with empty breadcrumbs.
  // Synthesize them from the drawer: find the active link, walk up through
  // its ancestor <details>/<section>, emit one breadcrumb per level.

  function findActiveLink () {
    var drawer = document.querySelector('.drawer')
    if (!drawer) return null
    var path = window.location.pathname
    var links = drawer.querySelectorAll('a.nav-link[data-href], summary.nav-link[data-href]')
    var best = null
    var bestLen = 0
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('data-href')
      if (!href) continue
      if (path.indexOf(href) === 0 && href.length > bestLen) {
        best = links[i]
        bestLen = href.length
      }
    }
    return best
  }

  function labelText (el) {
    if (!el) return ''
    var span = el.querySelector('span:first-child')
    return (span || el).textContent.replace(/\s+/g, ' ').trim()
  }

  function hrefForLink (el) {
    if (el.tagName === 'A') return el.getAttribute('href') || ''
    return ''
  }

  function buildTrail (leaf) {
    var trail = []
    var current = leaf
    if (leaf.tagName === 'A') {
      trail.push({ text: labelText(leaf), href: hrefForLink(leaf) })
    }
    // Walk up through <details> parents and the <section>
    var node = leaf.closest('details')
    while (node) {
      var sum = node.querySelector(':scope > summary')
      if (sum && sum !== leaf) {
        trail.unshift({ text: labelText(sum), href: null })
      }
      node = node.parentElement && node.parentElement.closest('details')
    }
    var section = leaf.closest('.nav-section')
    if (section) {
      var h3 = section.querySelector(':scope > .nav-section-title')
      if (h3) trail.unshift({ text: (h3.firstChild ? h3.firstChild.textContent : h3.textContent).trim(), href: null })
    }
    // Always start with "Docs"
    trail.unshift({ text: 'Docs', href: '/' })
    return trail
  }

  function render (trail) {
    var bc = document.querySelector('.topbar nav.breadcrumbs, nav.breadcrumbs')
    if (!bc) return
    // Clear and rebuild
    bc.innerHTML = ''
    var ul = document.createElement('ul')
    for (var i = 0; i < trail.length; i++) {
      var item = trail[i]
      var li = document.createElement('li')
      if (item.href && i < trail.length - 1) {
        var a = document.createElement('a')
        a.href = item.href
        a.textContent = item.text
        li.appendChild(a)
      } else {
        li.textContent = item.text
      }
      ul.appendChild(li)
    }
    bc.appendChild(ul)
  }

  function run () {
    var bc = document.querySelector('nav.breadcrumbs')
    if (!bc) return
    // If Antora already populated breadcrumbs, leave them alone.
    if (bc.querySelector('ul li')) return
    var leaf = findActiveLink()
    if (!leaf) return
    render(buildTrail(leaf))
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run)
  } else {
    run()
  }
})()
