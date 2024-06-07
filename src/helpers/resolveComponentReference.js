'use strict'

module.exports = (components, componentName, contentName) => {
  var resolvedUrl = '#'

  if (components[componentName]) {
    var component = components[componentName]
    if (contentName && component.latest.navigation) {
      var contentMenu = findContentInNavigation(component.latest.navigation, contentName)
      resolvedUrl = contentMenu.url ? contentMenu.url : '#'
    } else {
      resolvedUrl = components[componentName].latest.url
    }
  } else {
    console.warn('Component ' + componentName + ' not found in site components!')
  }

  return resolvedUrl
}

function findContentInNavigation (navigation, contentName) {
  for (var i = 0; i < navigation.length; i++) {
    var navItems = navigation[i].items
    for (var j = 0; j < navItems.length; j++) {
      if (navItems[j].content === contentName) {
        return navItems[j]
      }
    }
  }
}
