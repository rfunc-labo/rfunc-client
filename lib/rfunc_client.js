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
    return co(function * () {
      let api = new Proxy({}, {
        get (target, methodName) {
          if (methodName === 'then') {
            return null
          }
          return co.wrap(function * invoke (...params) {
            return s.invoke(moduleName, methodName, ...params)
          })
        }
      })
      return api
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
      let { attributes } = (body.data || {})
      let { returns } = (attributes || {})
      debug('Invoked with status:', statusCode)
      return returns
    })
  }
}

module.exports = RFuncClint
