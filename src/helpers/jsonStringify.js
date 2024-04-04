'use strict'

module.exports = (val) => '<pre> (type: ' + typeof val + ')\n' + JSON.stringify(val, null, 2) + '</pre>'
