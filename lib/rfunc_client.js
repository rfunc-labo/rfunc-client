'use strict'
/**
 * @class RFuncClint
 */
'use strict'

const {spinalcase} = require('stringcase')
const uuid = require('uuid')
const crossFetch = require('cross-fetch')
const {get} = require('bwindow')
const {resolve: resolveUrl} = require('url')
const {DEFAULT_URL} = require('rfunc-constants')
const debug = require('debug')('rfunc:client')

/** @lends RFuncClint */
class RFuncClint {
  constructor (baseUrl = DEFAULT_URL) {
    if (typeof arguments[0] === 'object') {
      baseUrl = arguments[0].baseUrl || DEFAULT_URL
    }
    this.baseUrl = baseUrl.replace(/\/$/, '') + '/'
    this.specs = {}
  }

  async fetch (pathname, options) {
    const url = resolveUrl(this.baseUrl, pathname)
    const fetch = get('fetch') || crossFetch
    return fetch(url, options)
  }

  /**
   * Resolve pathname for modules
   * @param {...string} names
   * @returns {string}
   */
  pathnameFor (...names) {
    return [...names].reduce((url, name) => {
      if (!name) {
        return url
      }
      return [url.replace(/\/$/, ''), spinalcase(name)].filter(Boolean).join('/')
    }, '/')
  }

  /**
   * Check if module exists
   * @param {string} moduleName
   * @returns {boolean} - Exists or not
   */
  async has (moduleName) {
    const isKnown = this.specs[moduleName]
    if (isKnown) {
      return true
    }
    const pathname = this.pathnameFor(moduleName)
    const {status} = await this.fetch(pathname, {method: 'HEAD'})
    return parseInt(status / 100) === 2
  }

  /**
   * Describe an api
   * @param {string} moduleName - Name of api
   */
  async describe (moduleName) {
    const known = this.specs[moduleName]
    if (known) {
      return known
    }
    const pathname = this.pathnameFor(moduleName)
    const res = await this.fetch(pathname, {
      method: 'OPTIONS'
    })
    const body = await res.json()
    const spec = body.data.attributes
    this.specs[moduleName] = spec
    return spec
  }

  /**f
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
    const pathname = this.pathnameFor(moduleName, methodName)
    const res = await this.fetch(pathname, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'invocations',
          id: uuid.v4(),
          attributes: {params}
        }
      }),
      headers: {'Content-Type': 'application/json'}
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

  invalidate () {
    this.specs = {}
  }
}

module.exports = RFuncClint
