/**
 * Load a module from config
 */
'use strict'

const co = require('co')
const defaults = require('defaults')

let instanceCall = (instance, handlers, ...args) => co(function * () {
  for (let handler of [].concat(handlers || [])) {
    yield Promise.resolve(handler && handler.call(instance, ...args))
  }
})

/** @lends load */
function load (module, options = {}) {
  return co(function * () {
    let { $init, $before, $after } = module
    let { $$name, $$ctx } = defaults(options, {
      $$name: 'Anonymous',
      $$ctx: {}
    })
    let instance = {
      __proto__: {
        $$name, $$ctx,
        __proto__: $$ctx
      }
    }
    let methods = Object.keys(module)
      .filter((name) => !/^\$/.test(name))
      .reduce((loaded, methodName) => Object.assign(loaded, {
        [methodName]: co.wrap(function * methodWrap (...params) {
          let method = module[ methodName ]
          let returns
          yield instanceCall(instance, $before, methodName, params)
          returns = yield Promise.resolve(method.call(instance, ...(params || [])))
          // Check circular
          if (returns && typeof returns === 'object') {
            try {
              JSON.stringify(returns)
            } catch (err) {
              throw err
            }
          }
          yield instanceCall(instance, $after, methodName, params, returns)

          return returns
        })
      }), {})
    Object.assign(instance, methods)
    instanceCall(instance, $init)
    return Promise.resolve().then(() => instance)
  })
}

module.exports = load
