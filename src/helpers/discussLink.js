'use strict'

module.exports = (site, page) => {
  var categoryName = 'library'
  var createTitle = encodeURIComponent(`"${page.title}" library page ...`)
  var pageUrl = site.url + page.url
  var pageUrlEncoded = encodeURIComponent(pageUrl)
  var createBody = encodeURIComponent(
`<!-- Replace this comment with your comment/suggestion/question/... -->


<!--
Keep the section below!
Linking back to the documentation URL not only helps people go to the page
but also helps find relevant discussions from the documentation page via the "View Discussion" menu.
-->
[details="Related library page"]
[${page.title}](${pageUrl})
[/details]
`)

  var discuss = {}
  discuss.createUrl =
    `https://discuss.axoniq.io/new-topic?category=${categoryName}&title=${createTitle}&body=${createBody}`
  discuss.searchUrl = `https://discuss.axoniq.io/search?q=${pageUrlEncoded}%20%23${categoryName}`
  return discuss
}
