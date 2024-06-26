'use strict'

module.exports = (type, groupsText, components) => {
  //console.log('Type is: ' + type)
  var typesArray = []
  if (type && type.includes(',')) {
    typesArray = type.split(',').map((value) => value.trim())
  } else {
    typesArray = [type]
  }
  //console.log('Groups is: ' + groupsText)
  //console.log('Components is: ' + JSON.stringify(components))
  //console.log('---')

  try {
    var groups = JSON.parse(groupsText)
  } catch (e) {
    console.error(e)
    return undefined
  }

  for (var component in components) {
    var componentType = components[component].asciidoc.attributes.type
    if (typesArray.includes(componentType)) {
      var componentGroup = components[component].asciidoc.attributes.group
      if (componentGroup === undefined) {
        componentGroup = ''
      }
      //console.log('Group is: ' + componentGroup)
      //console.log('groups contains ' + componentGroup + '? ' + Object.hasOwn(groups, componentGroup))

      if (Object.hasOwn(groups, componentGroup)) {
        if (!('components' in groups[componentGroup])) {
          groups[componentGroup].components = []
        }
        groups[componentGroup].components.push(components[component])
      }
    }
  }

  //console.log('result is: ' + JSON.stringify(groups, null, 2))
  return groups
}
