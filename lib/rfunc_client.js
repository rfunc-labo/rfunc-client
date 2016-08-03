'use strict'
/**
 * @class RFuncClint
 */
'use strict'

const co = require('co')
const { spinalcase } = require('stringcase')
const uuid = require('uuid')
const superagent = require('superagent')
const superagentPromisePlugin = require('superagent-promise-plugin')
const { DEFAULT_URL } = require('rfunc-constants')
const debug = require('debug')('rfunc:client')

let reject = (message) => Promise.reject(new Error(message))

/** @lends RFuncClint */
class RFuncClint {
  constructor (baseUrl = DEFAULT_URL, options = {}) {
    const s = this
    s.agent = options.agent || superagent.agent()
    s.baseUrl = baseUrl
  }

  /**
   * Resolve urls
   * @param {...string} names
   * @returns {string}
   */
  resolve (...names) {
    const s = this
    return [ ...names ].reduce((url, name) => {
      if (!name) {
        return url
      }
      return [ url.replace(/\/$/, ''), spinalcase(name) ].join('/')
    }, s.baseUrl)
  }

  /**
   * Check if module exists
   * @param {string} moduleName
   * @returns {boolean} - Exists or not
   */
  has (moduleName) {
    const s = this
    let { agent } = s
    return co(function * () {
      try {
        let { statusType } = yield agent
          .head(s.resolve(moduleName))
          .use(superagentPromisePlugin)
        return statusType === 2
      } catch (e) {
        return false
      }
    })
  }

  /**
   * Describe an api
   * @param {string} moduleName - Name of api
   */
  describe (moduleName) {
    const s = this
    let { agent } = s
    return co(function * () {
      let { body, statusCode } = yield agent
        .options(s.resolve(moduleName))
        .use(superagentPromisePlugin)
      return body.data.attributes
    })
  }

  /**
   * Connect to remote api
   * @param {string} moduleName - Name of api
   * @returns {Promise}
   */
  connect (moduleName) {
    const s = this
    let { baseUrl } = s
    return co(function * () {
      let has = yield s.has(moduleName)
      if (!has) {
        throw new Error(`Module not found: ${moduleName}`)
      }
      function api (...args) {
        if (api.default) {
          return api.default(...args)
        }
        throw new Error(`${moduleName} is not a function!`)
      }

      Object.assign(api, {
        then: null,
        inspect () {
          return `{ [RFuncClient: ${moduleName}] baseUrl: '${baseUrl}' }`
        },
        toJSON () {
          return { baseUrl, moduleName }
        }
      })

      return new Proxy(api, {
        get (target, methodName) {
          if (methodName in target) {
            return target[ methodName ]
          }
          return co.wrap(function * invoke (...params) {
            return s.invoke(moduleName, methodName, ...params)
          })
        }
      })
    })
  }

  /**
   * Invoke a method
   * @param {string} moduleName
   * @param {string} methodName - Name of method to invoke
   * @param {...*} params - Parameters
   */
  invoke (moduleName, methodName, ...params) {
    const s = this
    let { agent } = s
    return co(function * () {
      let { body, statusCode } = yield agent
        .post(s.resolve(moduleName, methodName))
        .send({
          data: {
            type: 'invocations',
            id: uuid.v4(),
            attributes: { params }
          }
        })
        .use(superagentPromisePlugin)
        .catch((e) => {
          let { status, response } = e
          let { errors } = (response && response.body || {})
          let detail = errors ? `( ${JSON.stringify(errors || {}, null, 2)} )` : null
          switch (status) {
            case 404:
              return reject(`Method "${methodName}" is not defined in module "${moduleName}"`)
            default:
              return reject(`Failed to invoke method "${methodName}" on module "${moduleName} ${detail}"`)
          }
        })
      let { attributes } = (body.data || {})
      let { returns } = (attributes || {})
      debug('Invoked with status:', statusCode)
      return returns
    })
  }
}

module.exports = RFuncClint
