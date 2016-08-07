/**
 * Load a module from config
 */
'use strict'

const co = require('co')
const defaults = require('defaults')

let intercept = (instance, handlers, ...args) => co(function * () {
  for (let handler of [].concat(handlers || [])) {
    yield Promise.resolve(handler && handler.call(instance, ...args))
  }
})

/** @lends load */
function load (module, options = {}) {
  let { $before, $after } = module
  let { $$name, $$ctx } = defaults(options, {
    $$name: 'Anonymous',
    $$ctx: {}
  })
  let methods = Object.keys(module)
    .filter((name) => !/^\$/.test(name))
    .reduce((loaded, methodName) => Object.assign(loaded, {
      [methodName]: co.wrap(function * invoke (...params) {
        let instance = this
        let method = module[ methodName ]
        let returns
        yield intercept(instance, $before, methodName, params)
        returns = yield Promise.resolve(method.call(instance, ...(params || [])))
        // Check circular
        if (returns && typeof returns === 'object') {
          try {
            JSON.stringify(returns)
          } catch (err) {
            throw err
          }
        }
        yield intercept(instance, $after, methodName, params, returns)

        return returns
      })
    }), {})
  return Object.assign({
    __proto__: {
      $$name, $$ctx,
      __proto__: $$ctx
    }
  }, methods)
}

module.exports = load