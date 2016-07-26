'use strict';
/**
 * @class RFuncClint
 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var co = require('co');

var _require = require('stringcase');

var spinalcase = _require.spinalcase;

var uuid = require('uuid');
var superagent = require('superagent');
var superagentPromisePlugin = require('superagent-promise-plugin');

var _require2 = require('rfunc-constants');

var DEFAULT_URL = _require2.DEFAULT_URL;

var debug = require('debug')('rfunc:client');

var reject = function reject(message) {
  return Promise.reject(new Error(message));
};

/** @lends RFuncClint */

var RFuncClint = function () {
  function RFuncClint() {
    var baseUrl = arguments.length <= 0 || arguments[0] === undefined ? DEFAULT_URL : arguments[0];
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, RFuncClint);

    var s = this;
    s.agent = options.agent || superagent.agent();
    s.baseUrl = baseUrl;
  }

  /**
   * Resolve urls
   * @param {...string} names
   * @returns {string}
   */


  _createClass(RFuncClint, [{
    key: 'resolve',
    value: function resolve() {
      var s = this;

      for (var _len = arguments.length, names = Array(_len), _key = 0; _key < _len; _key++) {
        names[_key] = arguments[_key];
      }

      return [].concat(names).reduce(function (url, name) {
        if (!name) {
          return url;
        }
        return [url.replace(/\/$/, ''), spinalcase(name)].join('/');
      }, s.baseUrl);
    }

    /**
     * Check if module exists
     * @param {string} moduleName
     * @returns {boolean} - Exists or not
     */

  }, {
    key: 'has',
    value: function has(moduleName) {
      var s = this;
      var agent = s.agent;

      return co(regeneratorRuntime.mark(function _callee() {
        var _ref, statusType;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return agent.head(s.resolve(moduleName)).use(superagentPromisePlugin);

              case 3:
                _ref = _context.sent;
                statusType = _ref.statusType;
                return _context.abrupt('return', statusType === 2);

              case 8:
                _context.prev = 8;
                _context.t0 = _context['catch'](0);
                return _context.abrupt('return', false);

              case 11:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 8]]);
      }));
    }

    /**
     * Describe an api
     * @param {string} moduleName - Name of api
     */

  }, {
    key: 'describe',
    value: function describe(moduleName) {
      var s = this;
      var agent = s.agent;

      return co(regeneratorRuntime.mark(function _callee2() {
        var _ref2, body, statusCode;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return agent.options(s.resolve(moduleName)).use(superagentPromisePlugin);

              case 2:
                _ref2 = _context2.sent;
                body = _ref2.body;
                statusCode = _ref2.statusCode;
                return _context2.abrupt('return', body.data.attributes);

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));
    }

    /**
     * Connect to remote api
     * @param {string} moduleName - Name of api
     * @returns {Promise}
     */

  }, {
    key: 'connect',
    value: function connect(moduleName) {
      var s = this;
      var baseUrl = s.baseUrl;

      return co(regeneratorRuntime.mark(function _callee3() {
        var has, api;
        return regeneratorRuntime.wrap(function _callee3$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return s.has(moduleName);

              case 2:
                has = _context4.sent;

                if (has) {
                  _context4.next = 5;
                  break;
                }

                throw new Error('Module not found: ' + moduleName);

              case 5:
                api = new Proxy({
                  then: null,
                  inspect: function inspect() {
                    return '{ [RFuncClient: ' + moduleName + '] baseUrl: \'' + baseUrl + '\' }';
                  },
                  toJSON: function toJSON() {
                    return { baseUrl: baseUrl, moduleName: moduleName };
                  }
                }, {
                  get: function get(target, methodName) {
                    if (methodName in target) {
                      return target[methodName];
                    }
                    return co.wrap(regeneratorRuntime.mark(function invoke() {
                      for (var _len2 = arguments.length, params = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                        params[_key2] = arguments[_key2];
                      }

                      return regeneratorRuntime.wrap(function invoke$(_context3) {
                        while (1) {
                          switch (_context3.prev = _context3.next) {
                            case 0:
                              return _context3.abrupt('return', s.invoke.apply(s, [moduleName, methodName].concat(params)));

                            case 1:
                            case 'end':
                              return _context3.stop();
                          }
                        }
                      }, invoke, this);
                    }));
                  }
                });
                return _context4.abrupt('return', api);

              case 7:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee3, this);
      }));
    }

    /**
     * Invoke a method
     * @param {string} moduleName
     * @param {string} methodName - Name of method to invoke
     * @param {...*} params - Parameters
     */

  }, {
    key: 'invoke',
    value: function invoke(moduleName, methodName) {
      for (var _len3 = arguments.length, params = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
        params[_key3 - 2] = arguments[_key3];
      }

      var s = this;
      var agent = s.agent;

      return co(regeneratorRuntime.mark(function _callee4() {
        var _ref3, body, statusCode, _ref4, attributes, _ref5, returns;

        return regeneratorRuntime.wrap(function _callee4$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return agent.post(s.resolve(moduleName, methodName)).send({
                  data: {
                    type: 'invocations',
                    id: uuid.v4(),
                    attributes: { params: params }
                  }
                }).use(superagentPromisePlugin).catch(function (e) {
                  var status = e.status;
                  var response = e.response;

                  var _ref6 = response && response.body || {};

                  var errors = _ref6.errors;

                  var detail = errors ? '( ' + JSON.stringify(errors || {}, null, 2) + ' )' : null;
                  switch (status) {
                    case 404:
                      return reject('Method "' + methodName + '" is not defined in module "' + moduleName + '"');
                    default:
                      return reject('Failed to invoke method "' + methodName + '" on module "' + moduleName + ' ' + detail + '"');
                  }
                });

              case 2:
                _ref3 = _context5.sent;
                body = _ref3.body;
                statusCode = _ref3.statusCode;
                _ref4 = body.data || {};
                attributes = _ref4.attributes;
                _ref5 = attributes || {};
                returns = _ref5.returns;

                debug('Invoked with status:', statusCode);
                return _context5.abrupt('return', returns);

              case 11:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee4, this);
      }));
    }
  }]);

  return RFuncClint;
}();

module.exports = RFuncClint;
//# sourceMappingURL=data:application/json;base64,bnVsbA==