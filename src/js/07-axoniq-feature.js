;(function () {
  'use strict'

  var uiRootPath = (document.getElementById('site-script') || { dataset: {} }).dataset.uiRootPath || '.'

  var headings = document.querySelectorAll(
    '.axoniq-feature > h1, .axoniq-feature > h2, .axoniq-feature > h3,' +
      '.axoniq-feature > h4, .axoniq-feature > h5, .axoniq-feature > h6'
  )

  ;[].slice.call(headings).forEach(function (heading) {
    var img = document.createElement('img')
    img.src = uiRootPath + '/img/axoniq-feature.svg'
    img.alt = 'Axoniq feature indicator'
    img.className = 'axoniq-feature-icon'

    var link = document.createElement('a')
    link.href = 'https://www.axoniq.io/pricing'
    link.className = 'axoniq-feature-link'
    link.target = '_blank'
    link.rel = 'noopener'
    link.appendChild(img)

    heading.appendChild(link)
  })
})()
