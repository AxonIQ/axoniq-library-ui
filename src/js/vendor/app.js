;(function () {
  'use strict'

  // ============================================================
  // Search: reuse the Lunr index built by @antora/lunr-extension,
  // but render the results in our ⌘K palette. The generated
  // search-index.js calls window.antoraSearch.initSearch(lunr, data),
  // so we define that hook here (app.js runs before search-index.js).
  // ============================================================
  var LunrSearch = (function () {
    var lunrLib = null, idx = null, store = null, ready = false
    window.antoraSearch = window.antoraSearch || {}
    window.antoraSearch.initSearch = function (lunr, data) {
      try {
        lunrLib = lunr
        idx = lunr.Index.load(data.index)
        store = data.store
        ready = true
        document.dispatchEvent(new CustomEvent('antora-search-ready'))
      } catch (e) { /* index failed to load; palette stays empty */ }
    }
    function keep (results) {
      return results.filter(function (r) { return store.documents[r.ref.split('-')[0]] })
    }
    // Exact -> begins-with -> contains, mirroring @antora/lunr-extension.
    function runQuery (qs) {
      var query
      var result = keep(idx.query(function (q) {
        var parser = new lunrLib.QueryParser(qs, q); parser.parse(); query = q
      }))
      if (result.length) return result
      try {
        result = keep(idx.query(function (q) {
          q.clauses = query.clauses.map(function (c) {
            if (c.presence !== lunrLib.Query.presence.PROHIBITED) {
              c.term = c.term + '*'; c.wildcard = lunrLib.Query.wildcard.TRAILING; c.usePipeline = false
            }
            return c
          })
        }))
      } catch (e) {}
      if (result.length) return result
      try {
        result = keep(idx.query(function (q) {
          q.clauses = query.clauses.map(function (c) {
            if (c.presence !== lunrLib.Query.presence.PROHIBITED) {
              c.term = '*' + c.term + '*'
              c.wildcard = lunrLib.Query.wildcard.LEADING | lunrLib.Query.wildcard.TRAILING
              c.usePipeline = false
            }
            return c
          })
        }))
      } catch (e) {}
      return result
    }
    return {
      isReady: function () { return ready },
      results: function (qs, limit) {
        if (!ready || !qs) return []
        var raw
        try { raw = runQuery(qs) } catch (e) { return [] }
        var out = [], seen = {}
        for (var i = 0; i < raw.length && out.length < (limit || 40); i++) {
          var ids = raw[i].ref.split('-'), doc = store.documents[ids[0]]
          if (!doc) continue
          var section = null
          if (ids.length > 1) {
            section = (doc.titles || []).filter(function (t) { return String(t.id) === ids[1] })[0]
          }
          var url = doc.url + (section ? '#' + section.hash : '')
          if (seen[url]) continue
          seen[url] = 1
          var cv = store.componentVersions[doc.component + '/' + doc.version]
          out.push({
            title: section ? section.text : doc.title,
            page: doc.title,
            section: !!section,
            url: url,
            group: cv ? (cv.title + (doc.version && cv.displayVersion ? ' ' + cv.displayVersion : '')) : 'Documentation'
          })
        }
        return out
      }
    }
  })()

  // ============================================================
  // Nav drawer: active path, details persistence, product switcher
  // ============================================================
  var drawer = document.querySelector('.drawer')
  if (drawer) {
    var path = location.pathname.replace(/\/+$/, '/') // normalise trailing slash
    if (!path.endsWith('/')) path += '/'
    var all = drawer.querySelectorAll('.nav-link')
    var bestMatch = null
    var bestLen = -1

    function normHref (href) { return href.endsWith('/') ? href : href + '/' }

    // Some pages are intentionally linked from more than one place in the tree
    // (e.g. a full product tree AND a themed "Core concepts" section). Remember
    // exactly which occurrence was clicked, in sessionStorage, so the next page
    // load lands on and scrolls to THAT occurrence rather than always the
    // first one in document order.
    var CLICK_KEY = 'axoniq-nav-click'
    Array.prototype.forEach.call(all, function (el, elIdx) {
      el.addEventListener('click', function () {
        var href = el.getAttribute('data-href')
        if (!href) return
        var norm = normHref(href)
        var index = 0
        for (var i = 0; i < elIdx; i++) {
          var otherHref = all[i].getAttribute('data-href')
          if (otherHref && normHref(otherHref) === norm) index++
        }
        try { sessionStorage.setItem(CLICK_KEY, JSON.stringify({ href: norm, index: index })) } catch (e) {}
      })
    })

    try {
      var clicked = JSON.parse(sessionStorage.getItem(CLICK_KEY) || 'null')
      sessionStorage.removeItem(CLICK_KEY)
      if (clicked && clicked.href && (path === clicked.href || path === clicked.href.replace(/\/$/, ''))) {
        var occurrence = 0
        Array.prototype.forEach.call(all, function (el) {
          if (bestMatch) return
          var href = el.getAttribute('data-href')
          if (!href || normHref(href) !== clicked.href) return
          if (occurrence++ === clicked.index) { bestMatch = el; bestLen = clicked.href.length }
        })
      }
    } catch (e) {}

    if (!bestMatch) {
      Array.prototype.forEach.call(all, function (el) {
        var href = el.getAttribute('data-href')
        if (!href) return
        var norm = normHref(href)
        if (path === norm || path === norm.replace(/\/$/, '')) {
          if (norm.length > bestLen) { bestMatch = el; bestLen = norm.length }
        }
      })
    }

    // Fallback: longest prefix match
    if (!bestMatch) {
      Array.prototype.forEach.call(all, function (el) {
        var href = el.getAttribute('data-href')
        if (!href) return
        var norm = href.endsWith('/') ? href : href + '/'
        if (path.indexOf(norm) === 0 && norm.length > bestLen) {
          bestMatch = el; bestLen = norm.length
        }
      })
    }

    if (bestMatch) {
      bestMatch.classList.add('is-current')
      // Walk up: open every ancestor <details> and mark summaries as ancestors
      var node = bestMatch.parentElement
      while (node && node !== drawer) {
        if (node.tagName === 'DETAILS') {
          node.open = true
          var sum = node.querySelector(':scope > summary.nav-link')
          if (sum && sum !== bestMatch) sum.classList.add('is-ancestor')
        }
        node = node.parentElement
      }
    }

    // Persist details open/closed state + accordion (opening an item collapses
    // its siblings at the same level, matching the pre-restyle nav)
    var STORAGE_KEY = 'axoniq-nav-open'
    var openSet = {}
    try {
      var raw = localStorage.getItem(STORAGE_KEY)
      if (raw) openSet = JSON.parse(raw) || {}
    } catch (e) {}

    // Top-level items live inside their own curated <section class="nav-section">
    // (see nav-manifest.js), so different top-level entries sit in different
    // <ul> lists even though they're visually siblings in the drawer. Treat all
    // of them as one accordion group, drawer-wide; below the top level, scope
    // to true DOM siblings (the same parent <ul>) as usual.
    function isTopLevel (d) {
      var ul = d.parentElement && d.parentElement.parentElement
      return !!(ul && ul.parentElement && ul.parentElement.classList.contains('nav-section'))
    }

    function closeOpenSiblings (d) {
      if (isTopLevel(d)) {
        Array.prototype.forEach.call(drawer.querySelectorAll('.nav-section > .nav-tree > li > details.nav-group'), function (sibling) {
          if (sibling !== d && sibling.open) sibling.open = false
        })
        return
      }
      var li = d.parentElement
      var ul = li && li.parentElement
      if (!ul) return
      Array.prototype.forEach.call(ul.children, function (siblingLi) {
        if (siblingLi === li) return
        var sibling = siblingLi.querySelector(':scope > details.nav-group')
        if (sibling && sibling.open) sibling.open = false
      })
    }

    // True only while the block below opens the current page's ancestor chain
    // and restores previously-persisted sections — both are programmatic and
    // must not trigger accordion-collapsing against each other. Only genuine
    // user clicks (after this pass) should collapse siblings.
    var initializingNav = true

    Array.prototype.forEach.call(drawer.querySelectorAll('details[data-nav-id]'), function (d) {
      var id = d.getAttribute('data-nav-id')
      // Only restore if user hasn't just been marked as ancestor (already open)
      if (!d.open && openSet[id]) d.open = true
      d.addEventListener('toggle', function () {
        if (!initializingNav && d.open) closeOpenSiblings(d)
        openSet[id] = d.open
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(openSet)) } catch (e) {}
      })
    })

    initializingNav = false

    // Scroll the current page into view within the drawer body. Done
    // synchronously (no setTimeout) and after the open-state restore above, so
    // it measures the tree in its final, fully-settled state and applies
    // before first paint — a deferred correction was visible as a jump once
    // the page had already painted at scrollTop 0.
    if (bestMatch) {
      var drawerBody = drawer.querySelector('.drawer-body')
      if (drawerBody) {
        var bmRect = bestMatch.getBoundingClientRect()
        var bodyRect = drawerBody.getBoundingClientRect()
        if (bmRect.top < bodyRect.top || bmRect.bottom > bodyRect.bottom) {
          drawerBody.scrollTop += bmRect.top - bodyRect.top - 80
        }
      }
    }

    // Product switcher popover
    var productBtn = document.getElementById('drawer-product')
    var productMenu = document.getElementById('drawer-product-menu')
    if (productBtn && productMenu) {
      // Highlight the version matching the current URL and sync the header pill
      // to that product + version. Falls back to the pre-marked default.
      var versions = productMenu.querySelectorAll('.product-version')
      var pathNow = location.pathname.replace(/\/+$/, '/') + (location.pathname.endsWith('/') ? '' : '/')
      var currentVersion = null
      var currentLen = -1
      Array.prototype.forEach.call(versions, function (el) {
        var href = el.getAttribute('href') || ''
        // Strip relative prefixes so we compare on the meaningful path tail
        var norm = href.replace(/^(\.\.\/)+/, '/').replace(/^\.\//, '/')
        norm = norm.replace(/\/+$/, '/')
        if (!norm.endsWith('/')) norm += '/'
        if (pathNow.indexOf(norm.replace(/^\//, '')) >= 0 && norm.length > currentLen) {
          currentVersion = el
          currentLen = norm.length
        }
      })
      if (currentVersion) {
        Array.prototype.forEach.call(versions, function (el) { el.classList.remove('is-current') })
        currentVersion.classList.add('is-current')
        var group = currentVersion.closest('.product-group')
        if (group) {
          var name = group.getAttribute('data-product-name')
          var icon = group.querySelector('.product-group-icon')
          var num = currentVersion.querySelector('.pv-num')
          var hdrName = productBtn.querySelector('.drawer-product-name')
          var hdrChip = productBtn.querySelector('.drawer-product-chip')
          var hdrIcon = productBtn.querySelector('.drawer-product-icon')
          if (hdrName && name) hdrName.textContent = name
          if (hdrChip && num) hdrChip.textContent = num.textContent
          if (hdrIcon && icon) hdrIcon.innerHTML = icon.innerHTML
        }
      }

      function closeProduct () {
        productBtn.setAttribute('aria-expanded', 'false')
        productMenu.hidden = true
      }
      function openProduct () {
        productBtn.setAttribute('aria-expanded', 'true')
        productMenu.hidden = false
      }
      productBtn.addEventListener('click', function (e) {
        e.stopPropagation()
        productMenu.hidden ? openProduct() : closeProduct()
      })
      document.addEventListener('click', function (e) {
        if (productMenu.hidden) return
        if (!productMenu.contains(e.target) && e.target !== productBtn) closeProduct()
      })
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !productMenu.hidden) closeProduct()
      })
    }

    // Mobile drawer toggle (off-canvas drawer + scrim)
    var burger = document.getElementById('drawer-burger')
    var scrim = document.getElementById('drawer-scrim')
    function openDrawer () {
      document.documentElement.classList.add('is-drawer-open')
      if (burger) burger.setAttribute('aria-expanded', 'true')
    }
    function closeDrawer () {
      document.documentElement.classList.remove('is-drawer-open')
      if (burger) burger.setAttribute('aria-expanded', 'false')
    }
    if (burger) {
      burger.addEventListener('click', function () {
        if (document.documentElement.classList.contains('is-drawer-open')) closeDrawer()
        else openDrawer()
      })
    }
    if (scrim) scrim.addEventListener('click', closeDrawer)
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer() })
    // Close on any real link click (mobile)
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('.nav-link:not(.nav-parent)')) closeDrawer()
    })
  }

  // ============================================================
  // Theme toggle
  // ============================================================
  var themeBtn = document.getElementById('theme-toggle')
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var html = document.documentElement
      var current = html.getAttribute('data-theme')
      var next
      if (current === 'dark') next = 'light'
      else if (current === 'light') next = 'dark'
      else next = matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark'
      html.setAttribute('data-theme', next)
      try { localStorage.setItem('axoniq-theme', next) } catch (e) {}
    })
  }

  // ============================================================
  // Theme switch (light / dark / auto — topbar)
  // ============================================================
  var themeSwitchBtns = document.querySelectorAll('.theme-switch-btn')
  if (themeSwitchBtns.length) {
    function currentThemeChoice () {
      var current = document.documentElement.getAttribute('data-theme')
      return current === 'light' || current === 'dark' ? current : 'auto'
    }
    function markActiveThemeBtn () {
      var choice = currentThemeChoice()
      Array.prototype.forEach.call(themeSwitchBtns, function (btn) {
        var isActive = btn.getAttribute('data-theme-choice') === choice
        btn.classList.toggle('is-active', isActive)
        btn.setAttribute('aria-pressed', String(isActive))
      })
    }
    Array.prototype.forEach.call(themeSwitchBtns, function (btn) {
      btn.addEventListener('click', function () {
        var choice = btn.getAttribute('data-theme-choice')
        var html = document.documentElement
        if (choice === 'auto') html.removeAttribute('data-theme')
        else html.setAttribute('data-theme', choice)
        try { localStorage.setItem('axoniq-theme', choice) } catch (e) {}
        markActiveThemeBtn()
      })
    })
    markActiveThemeBtn()
  }

  // ============================================================
  // Command palette (⌘K) — backed by the real Lunr index
  // ============================================================
  function docIcon () {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
  }

  var overlay = document.getElementById('cmdk-overlay')
  var input = document.getElementById('cmdk-input')
  var results = document.getElementById('cmdk-results')
  var launch = document.getElementById('cmdk-launch')
  if (!overlay || !input || !results) return

  var selected = 0
  var flat = []

  function escapeHtml (s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
    })
  }

  function highlight (text, q) {
    if (!q) return escapeHtml(text)
    var i = text.toLowerCase().indexOf(q.toLowerCase())
    if (i < 0) return escapeHtml(text)
    return escapeHtml(text.slice(0, i)) +
      '<mark style="background:transparent;color:var(--color-text-primary);font-weight:600;">' +
      escapeHtml(text.slice(i, i + q.length)) + '</mark>' +
      escapeHtml(text.slice(i + q.length))
  }

  function render (q) {
    q = (q || '').trim()
    flat = []
    if (!q) {
      results.innerHTML = '<div class="cmdk-empty">' +
        (LunrSearch.isReady() ? 'Type to search the documentation…' : 'Loading search index…') +
        '</div>'
      return
    }
    var hits = LunrSearch.results(q, 40)
    var html = ''
    var lastGroup = null
    hits.forEach(function (it) {
      if (it.group !== lastGroup) {
        if (lastGroup !== null) html += '</div>'
        html += '<div class="cmdk-group"><div class="cmdk-group-title">' + escapeHtml(it.group) + '</div>'
        lastGroup = it.group
      }
      var idx = flat.length
      flat.push(it)
      var sub = it.section ? it.page : it.url
      html += '<div class="cmdk-item" role="option" data-idx="' + idx + '">' +
        '<span class="cmdk-item-icon">' + docIcon() + '</span>' +
        '<span class="cmdk-item-text">' +
        '<span class="cmdk-item-title">' + highlight(it.title, q) + '</span>' +
        '<span class="cmdk-item-path">' + escapeHtml(sub) + '</span>' +
        '</span>' +
        '<span class="cmdk-item-kbd">↵</span>' +
        '</div>'
    })
    if (lastGroup !== null) html += '</div>'
    if (!flat.length) {
      html = '<div class="cmdk-empty">No results for <strong>' + escapeHtml(q) + '</strong></div>'
    }
    results.innerHTML = html
    selected = 0
    updateSelection()
    Array.prototype.forEach.call(results.querySelectorAll('.cmdk-item'), function (el) {
      el.addEventListener('mouseenter', function () {
        selected = parseInt(el.getAttribute('data-idx'), 10)
        updateSelection()
      })
      el.addEventListener('click', function () { choose() })
    })
  }

  function updateSelection () {
    var items = results.querySelectorAll('.cmdk-item')
    Array.prototype.forEach.call(items, function (el, i) {
      if (i === selected) {
        el.setAttribute('aria-selected', 'true')
        var r = el.getBoundingClientRect()
        var pr = results.getBoundingClientRect()
        if (r.top < pr.top) results.scrollTop += r.top - pr.top - 8
        else if (r.bottom > pr.bottom) results.scrollTop += r.bottom - pr.bottom + 8
      } else {
        el.removeAttribute('aria-selected')
      }
    })
  }

  function choose () {
    var item = flat[selected]
    if (!item) return
    close()
    window.location.href = item.url
  }

  function open () {
    overlay.classList.add('is-open')
    overlay.setAttribute('aria-hidden', 'false')
    document.documentElement.classList.add('is-cmdk-open')
    input.value = ''
    render('')
    setTimeout(function () { input.focus() }, 20)
  }
  function close () {
    overlay.classList.remove('is-open')
    overlay.setAttribute('aria-hidden', 'true')
    document.documentElement.classList.remove('is-cmdk-open')
  }

  if (launch) launch.addEventListener('click', open)

  var searchTimer
  input.addEventListener('input', function (e) {
    var v = e.target.value
    clearTimeout(searchTimer)
    searchTimer = setTimeout(function () { render(v) }, 110)
  })

  // Re-render if the (large) index finishes loading while the palette is open
  document.addEventListener('antora-search-ready', function () {
    if (overlay.classList.contains('is-open')) render(input.value)
  })

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close()
  })

  document.addEventListener('keydown', function (e) {
    // Open
    if ((e.metaKey || e.ctrlKey) && e.key && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      if (overlay.classList.contains('is-open')) close()
      else open()
      return
    }
    if (!overlay.classList.contains('is-open')) return
    if (e.key === 'Escape') { close(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (flat.length) { selected = (selected + 1) % flat.length; updateSelection() }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (flat.length) { selected = (selected - 1 + flat.length) % flat.length; updateSelection() }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose()
    }
  })
})()
