'use strict'
/**
 * @class RFuncClint
 */
'use strict'

const {spinalcase} = require('stringcase')
const uuid = require('uuid')
const fetch = require('cross-fetch')

const {DEFAULT_URL} = require('rfunc-constants')
const debug = require('debug')('rfunc:client')

/** @lends RFuncClint */
class RFuncClint {
  constructor (baseUrl = DEFAULT_URL, options = {}) {
    this.baseUrl = baseUrl
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
    const {status} = await fetch(this.resolve(moduleName), {method: 'HEAD'})
    return parseInt(status / 100) === 2
  }

  /**
   * Describe an api
   * @param {string} moduleName - Name of api
   */
  async describe (moduleName) {
    let url = this.resolve(moduleName)
    const res = await fetch(url, {
      method: 'OPTIONS'
    })
    const body = await res.json()
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
    let url = this.resolve(moduleName, methodName)
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'invocations',
          id: uuid.v4(),
          attributes: {params}
        }
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    const body = await res.json()
    if (!res.ok) {
      const {errors = []} = (body || {})
      const [error] = [].concat(errors.errors || errors)
      const {
        name,
        message = 'UNKNOWN ERROR',
        stack = null
      } = error
      const reject = (prefix) => Promise.reject(
        Object.assign(
          new Error(`"${prefix}"\n${message}`),
          error,
          {name, stack: stack ? [prefix, stack].join('\n') : undefined}
        )
      )
      switch (res.status) {
        case 404:
          return reject(`Method "${methodName}" is not defined in module "${moduleName}"`)
        default:
          return reject(`Failed to invoke method "${methodName}" on module "${moduleName}"`)
      }
    }
    const {attributes} = (body.data || {})
    const {returns} = (attributes || {})
    debug('Invoked with status:', res.status)
    return returns
  }
}

module.exports = RFuncClint
