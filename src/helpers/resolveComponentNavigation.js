'use strict'

module.exports = (components, componentName, contentName) => {
  var resolvedNav = {}

  if (components[componentName]) {
    var component = components[componentName]
    if (contentName && component.latest.navigation) {
      var contentMenu = findContentInNavigation(component.latest.navigation, contentName)
      if (contentMenu) resolvedNav = contentMenu
    } else {
      resolvedNav = components[componentName].latest
    }
  } else {
    console.warn('Component ' + componentName + ' not found in site components!')
  }

  return resolvedNav.items
}

function findContentInNavigation (navigation, contentName) {
  //console.log('looking for ' + contentName + ' in ' + JSON.stringify(navigation))

  for (var i = 0; i < navigation.length; i++) {
    var navItems = navigation[i].items
    for (var j = 0; j < navItems.length; j++) {
      if (navItems[j].content === contentName) {
        return navItems[j]
      }
    }
  }
}
