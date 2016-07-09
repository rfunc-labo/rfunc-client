/**
 * @function create
 * @return {RFuncClint} - A client instance
 */
'use strict'

const RFuncClint = require('./rfunc_client')

/** @lends create */
function create (...args) {
  return new RFuncClint(...args)
}

module.exports = create
