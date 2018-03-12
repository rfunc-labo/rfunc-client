'use strict'
/**
 * @class RFuncClint
 */
'use strict'

const {spinalcase} = require('stringcase')
const uuid = require('uuid')
const superagent = require('superagent')
const superagentPromisePlugin = require('superagent-promise-plugin')
const {DEFAULT_URL} = require('rfunc-constants')
const debug = require('debug')('rfunc:client')

/** @lends RFuncClint */
class RFuncClint {
  constructor (baseUrl = DEFAULT_URL, options = {}) {
    const {
      agent = superagent.agent ? superagent.agent() : superagent
    } = options
    Object.assign(this, {agent, baseUrl})
  }

  /**
   * Resolve urls
   * @param {...string} names
   * @returns {string}
   */
  resolve (...names) {
    return [...names].reduce((url, name) => {
      if (!name) {
        return url
      }
      return [url.replace(/\/$/, ''), spinalcase(name)].join('/')
    }, this.baseUrl)
  }

  /**
   * Check if module exists
   * @param {string} moduleName
   * @returns {boolean} - Exists or not
   */
  async has (moduleName) {
    const {agent} = this
    try {
      const {statusType} = await
        agent
          .head(this.resolve(moduleName))
          .use(superagentPromisePlugin)
      return statusType === 2
    } catch (e) {
      return false
    }
  }

  /**
   * Describe an api
   * @param {string} moduleName - Name of api
   */
  async describe (moduleName) {
    const {agent} = this
    const {body, statusCode} = await agent
      .options(this.resolve(moduleName))
      .use(superagentPromisePlugin)
    return body.data.attributes
  }

  /**
   * Connect to remote api
   * @param {string} moduleName - Name of api
   * @returns {Promise}
   */
  async connect (moduleName) {
    const {baseUrl} = this
    const has = await this.has(moduleName)
    if (!has) {
      throw new Error(`Module not found: ${moduleName}`)
    }

    const {name, version, methods} = await this.describe(moduleName)

    const api = methods.default ? (...args) => api.default(...args) : {}
    Object.assign(
      api,
      {
        then: null,
        inspect () {
          return `{ [RFuncClient: ${moduleName}] baseUrl: '${baseUrl}' }`
        },
        toJSON () {
          return {baseUrl, moduleName}
        }
      },
      Object.keys(methods || {}).reduce((methods, methodName) => Object.assign(methods, {
        [methodName]: async (...params) => {
          return this.invoke(moduleName, methodName, ...params)
        }
      }), {})
    )
    return api
  }

  /**
   * Invoke a method
   * @param {string} moduleName
   * @param {string} methodName - Name of method to invoke
   * @param {...*} params - Parameters
   */
  async invoke (moduleName, methodName, ...params) {
    const {agent} = this
    const {body, statusCode} = await agent
      .post(this.resolve(moduleName, methodName))
      .send({
        data: {
          type: 'invocations',
          id: uuid.v4(),
          attributes: {params}
        }
      })
      .use(superagentPromisePlugin)
      .catch((thrown) => {
        const {status, response} = thrown
        const {errors = []} = (response && response.body || {})
        const [error = thrown] = errors
        const {
          name,
          message = 'UNKNOWN ERROR',
          stack = null
        } = error
        let reject = (prefix) => Promise.reject(
          Object.assign(
            new Error(`"${prefix}"\n${message}`),
            error,
            {name, stack: stack ? [prefix, stack].join('\n') : undefined}
          )
        )
        switch (status) {
          case 404:
            return reject(`Method "${methodName}" is not defined in module "${moduleName}"`)
          default:
            return reject(`Failed to invoke method "${methodName}" on module "${moduleName}"`)
        }
      })
    let {attributes} = (body.data || {})
    let {returns} = (attributes || {})
    debug('Invoked with status:', statusCode)
    return returns
  }
}

module.exports = RFuncClint
