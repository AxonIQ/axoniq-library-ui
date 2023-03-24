'use strict'

module.exports = (site, page) => {
  var categoryName = 'library'
  var createTitle = encodeURIComponent(`"${page.title}" library page ...`)
  var pageUrl = site.url + page.url
  var createBody = encodeURIComponent(`
[details="Related library page"]
[${page.title}](${pageUrl})
[/details]

Your comment/suggestion/question/...
`)

  var discuss = {}
  discuss.createUrl =
    `https://discuss.axoniq.io/new-topic?category=${categoryName}&title=${createTitle}&body=${createBody}`
  discuss.searchUrl = `https://discuss.axoniq.io/search?q=${pageUrl}%20%23${categoryName}`
  return discuss
}
