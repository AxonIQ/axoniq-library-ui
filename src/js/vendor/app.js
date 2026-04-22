;(function () {
  'use strict'

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

    Array.prototype.forEach.call(all, function (el) {
      var href = el.getAttribute('data-href')
      if (!href) return
      var norm = href.endsWith('/') ? href : href + '/'
      if (path === norm || path === norm.replace(/\/$/, '')) {
        if (norm.length > bestLen) { bestMatch = el; bestLen = norm.length }
      }
    })

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
      // Scroll into view within drawer body
      setTimeout(function () {
        var body = drawer.querySelector('.drawer-body')
        if (!body) return
        var r = bestMatch.getBoundingClientRect()
        var br = body.getBoundingClientRect()
        if (r.top < br.top || r.bottom > br.bottom) {
          body.scrollTop += r.top - br.top - 80
        }
      }, 0)
    }

    // Persist details open/closed state
    var STORAGE_KEY = 'axoniq-nav-open'
    var openSet = {}
    try {
      var raw = localStorage.getItem(STORAGE_KEY)
      if (raw) openSet = JSON.parse(raw) || {}
    } catch (e) {}

    Array.prototype.forEach.call(drawer.querySelectorAll('details[data-nav-id]'), function (d) {
      var id = d.getAttribute('data-nav-id')
      // Only restore if user hasn't just been marked as ancestor (already open)
      if (!d.open && openSet[id]) d.open = true
      d.addEventListener('toggle', function () {
        openSet[id] = d.open
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(openSet)) } catch (e) {}
      })
    })

    // Product switcher popover
    var productBtn = document.getElementById('drawer-product')
    var productMenu = document.getElementById('drawer-product-menu')
    if (productBtn && productMenu) {
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

    // Mobile drawer toggle (reuses existing navbar-burger if present)
    var burger = document.querySelector('.navbar-burger')
    if (burger) {
      burger.addEventListener('click', function () {
        document.documentElement.classList.toggle('is-drawer-open')
      })
      // Close on any link click
      drawer.addEventListener('click', function (e) {
        if (e.target.closest('.nav-link:not(.nav-parent)')) {
          document.documentElement.classList.remove('is-drawer-open')
        }
      })
    }
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
  // Command palette (fake data, real UX)
  // ============================================================
  var DATA = {
    'Getting started': [
      { title: 'Introduction', path: '/home/basics/introduction', icon: 'doc' },
      { title: 'Installation', path: '/home/basics/installation', icon: 'package' },
      { title: 'Quick start tutorial', path: '/home/basics/quickstart', icon: 'bolt' },
      { title: 'Core concepts', path: '/home/basics/concepts', icon: 'book' }
    ],
    'Guides': [
      { title: 'Axon Framework — Event sourcing', path: '/home/guides/axon-framework/event-sourcing', icon: 'doc' },
      { title: 'Axon Framework — Command handling', path: '/home/guides/axon-framework/commands', icon: 'doc' },
      { title: 'Axon Server — Clustering', path: '/home/guides/axon-server/clustering', icon: 'server' },
      { title: 'Axon Server — Security', path: '/home/guides/axon-server/security', icon: 'shield' },
      { title: 'Bike-rental demo walkthrough', path: '/home/bikerental-demo/overview', icon: 'bolt' }
    ],
    'Reference': [
      { title: 'Axon Framework Reference', path: '/axon-framework-reference', icon: 'book' },
      { title: 'Axon Server Reference', path: '/axon-server-reference', icon: 'book' },
      { title: 'Kafka extension', path: '/kafka-extension-reference', icon: 'plug' },
      { title: 'Mongo extension', path: '/mongo-extension-reference', icon: 'plug' },
      { title: 'Kotlin extension', path: '/kotlin-extension-reference', icon: 'plug' },
      { title: 'Reactor extension', path: '/reactor-extension-reference', icon: 'plug' }
    ],
    'AxonIQ Platform': [
      { title: 'Platform overview', path: '/home/axoniq-platform/overview', icon: 'platform' },
      { title: 'Console dashboard guide', path: '/home/axoniq-platform/console', icon: 'dashboard' },
      { title: 'Billing & plans', path: '/home/axoniq-platform/billing', icon: 'card' }
    ]
  }

  var ICONS = {
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    package: '<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    server: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    plug: '<path d="M9 2v6M15 2v6"/><path d="M5 8h14v4a7 7 0 0 1-14 0V8z"/><path d="M12 22v-3"/>',
    platform: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    dashboard: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>'
  }

  var overlay = document.getElementById('cmdk-overlay')
  var input = document.getElementById('cmdk-input')
  var results = document.getElementById('cmdk-results')
  var launch = document.getElementById('cmdk-launch')
  if (!overlay || !input || !results) return

  var selected = 0
  var flat = []

  function iconSvg (name) {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      (ICONS[name] || ICONS.doc) + '</svg>'
  }

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
    results.innerHTML = ''
    flat = []
    var html = ''
    var groups = Object.keys(DATA)
    groups.forEach(function (group) {
      var items = DATA[group].filter(function (it) {
        if (!q) return true
        return (it.title + ' ' + it.path).toLowerCase().indexOf(q.toLowerCase()) >= 0
      })
      if (!items.length) return
      html += '<div class="cmdk-group"><div class="cmdk-group-title">' + escapeHtml(group) + '</div>'
      items.forEach(function (it) {
        var idx = flat.length
        flat.push(it)
        html += '<div class="cmdk-item" role="option" data-idx="' + idx + '">' +
          '<span class="cmdk-item-icon">' + iconSvg(it.icon) + '</span>' +
          '<span class="cmdk-item-text">' +
          '<span class="cmdk-item-title">' + highlight(it.title, q) + '</span>' +
          '<span class="cmdk-item-path">' + highlight(it.path, q) + '</span>' +
          '</span>' +
          '<span class="cmdk-item-kbd">↵</span>' +
          '</div>'
      })
      html += '</div>'
    })
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
    // This is a mock — in production we'd navigate. For demo, just flash a log.
    console.log('[cmdk] open:', item.title, item.path)
    close()
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

  input.addEventListener('input', function (e) { render(e.target.value) })

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
