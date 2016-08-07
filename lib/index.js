/**
 * Client of rfunc server
 * @module rfunc-client
 * @version 2.0.0
 */

'use strict'

const load = require('./load')
const create = require('./create')
const RFuncClient = require('./rfunc_client')

let lib = create.bind(this)

Object.assign(lib, RFuncClient, {
  create,
  load,
  RFuncClient
})

module.exports = lib
