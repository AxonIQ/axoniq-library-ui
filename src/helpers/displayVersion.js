'use strict'

module.exports = (val) => (val && (val === 'master' || val === 'main')) ? 'development' : val
