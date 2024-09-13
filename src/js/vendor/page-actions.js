;(function () {
  'use strict'

  var toggle = document.querySelector('.page-actions .actions-menu-toggle')
  if (!toggle) return

  var selector = document.querySelector('.page-actions')

  toggle.addEventListener('click', function (e) {
    var actives = document.querySelectorAll('.toolbar .is-active')
    selector.classList.toggle('is-active')
    actives.forEach((item) => {item.classList.remove('is-active')});
    e.stopPropagation() // trap event
  })

  document.documentElement.addEventListener('click', function () {
    selector.classList.remove('is-active')
  })
})()
