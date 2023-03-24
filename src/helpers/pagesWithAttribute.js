'use strict'

module.exports = (name, { data }) => {
  const { contentCatalog } = data.root
  var pages = contentCatalog.getPages(({ asciidoc, out }) => {
    if (!out || !asciidoc) return
    return asciidoc.attributes[name]
  })
  var list = {}
  for (const page of pages) {
    var componentName = page.asciidoc.attributes['page-component-name']
    var componentVersion = page.asciidoc.attributes['page-component-version']
    var componentId = componentName + '|' + componentVersion
    if (!list[componentId]) {
      list[componentId] = {}
      list[componentId].name = page.asciidoc.attributes['page-component-title']
      list[componentId].description = page.asciidoc.attributes.component_description
    }
    if (!('pages' in list[componentId])) {
      list[componentId].pages = []
    }
    list[componentId].pages.push(page)
  }
  // console.log('LIST: ' + JSON.stringify(list, null, 2))
  return list
}
