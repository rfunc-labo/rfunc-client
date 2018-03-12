/**
 * Load a module from config
 */
'use strict'

const instanceCall = async (instance, handlers, ...args) => {
  for (const handler of [].concat(handlers || [])) {
    await Promise.resolve(handler && handler.call(instance, ...args))
  }
}

/** @lends load */
async function load (module, options = {}) {
  const {$init, $before, $after} = module
  const {
    $$name = 'Anonymous',
    $$ctx = {}
  } = options
  const instance = {
    __proto__: {
      $$name, $$ctx,
      __proto__: $$ctx
    }
  }
  const methods = Object.keys(module)
    .filter((name) => !/^\$/.test(name))
    .reduce((loaded, methodName) => Object.assign(loaded, {
      [methodName]: async function methodWrap (...params) {
        const method = module[methodName]
        let returns
        await instanceCall(instance, $before, methodName, params)
        returns = await Promise.resolve(method.call(instance, ...(params || [])))
        // Check circular
        if (returns && typeof returns === 'object') {
          try {
            JSON.stringify(returns)
          } catch (err) {
            throw err
          }
        }
        await instanceCall(instance, $after, methodName, params, returns)

        return returns
      }
    }), {})
  Object.assign(instance, methods)
  instanceCall(instance, $init)
  return Promise.resolve().then(() => instance)
}

module.exports = load
