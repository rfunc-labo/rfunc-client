/**
 * @function create
 * @return {RFuncClint} - A client instance
 */
'use strict';

var RFuncClint = require('./rfunc_client');

/** @lends create */
function create() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return new (Function.prototype.bind.apply(RFuncClint, [null].concat(args)))();
}

module.exports = create;
//# sourceMappingURL=data:application/json;base64,bnVsbA==