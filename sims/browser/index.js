/**
 * Client of rfunc server
 * @module rfunc-client
 */

'use strict';

var create = require('./create');
var RFuncClient = require('./rfunc_client');

var lib = create.bind(undefined);

Object.assign(lib, RFuncClient, {
  create: create,
  RFuncClient: RFuncClient
});

module.exports = lib;
//# sourceMappingURL=data:application/json;base64,bnVsbA==