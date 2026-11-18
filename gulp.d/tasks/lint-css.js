'use strict'

// stylelint is ESM-only as of v16, so it must be loaded using a dynamic import
module.exports = (files) => async () => {
  const { default: stylelint } = await import('stylelint')
  const { report, errored } = await stylelint.lint({ files, formatter: 'string' })
  if (report) console.log(report)
  if (errored) throw new Error('stylelint found problems in the CSS source files')
}
