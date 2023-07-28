
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./sm-js.cjs.production.min.js')
} else {
  module.exports = require('./sm-js.cjs.development.js')
}
