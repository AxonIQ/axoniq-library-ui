'use strict'

module.exports = (attributes) => {
  var needIndexes = attributes['needs-improvement'].split(',')
  // console.log('needIndexes: ' + needIndexes)
  var needs = []
  needIndexes.forEach((needIndex) => {
    // console.log('processing "needs-' + needIndex.trim() + '"')
    needs.push(attributes['needs-' + needIndex.trim()])
  })
  return needs
}
