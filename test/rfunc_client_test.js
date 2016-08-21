/**
 * Test case for client.
 * Runs with mocha.
 */
'use strict'

const RFClient = require('../lib/rfunc_client')
const rfunc = require('rfunc')
const asleep = require('asleep')
const aport = require('aport')
const assert = require('assert')
const co = require('co')

describe('RfClient', function () {
  const BASE_URL = '/testing-api/rfunc'
  this.timeout(3000)
  let port
  let server
  let baseUrl
  before(() => co(function * () {
    port = yield aport()
    server = rfunc({
      foo: {
        bar (text) {
          return co(function * () {
            let d = new Date()
            yield asleep(100)
            return {
              time: new Date() - d,
              text
            }
          })
        },
        hoge () {
          throw Object.assign(new Error('hoge!'), { status: 400 })
        },
        $spec: {
          name: 'foo-api',
          methods: {
            hello: { desc: 'Say hello' },
            bye: { desc: 'Say bye' }
          }
        }
      },
      baz () {
        return 'This is baz!'
      },
      $pathname: BASE_URL
    })
    server.listen(port)
    baseUrl = `http://localhost:${port}${BASE_URL}`
  }))

  after(() => co(function * () {
    server.close()
  }))

  it('Send client', () => co(function * () {
    // Get description
    {
      let desc = yield new RFClient(baseUrl).describe('foo')
      assert.ok(desc.name, 'foo-api')
    }
    {
      let foo = yield new RFClient(baseUrl).connect('foo')
      assert.ok(foo.inspect())
      let hoge = yield foo.bar('hoge')
      assert.ok(hoge)

      try {
        yield foo.hoge()
      } catch (e) {
        assert.equal(e.status, 400)
        assert.equal(e.message, 'hoge!')
      }
    }
    {
      let caught
      try {
        yield new RFClient(baseUrl).connect('__invalid_module__')
      } catch (e) {
        caught = e
      }
      assert.ok(caught)
    }
    {
      let caught
      let foo = yield new RFClient(baseUrl).connect('foo')
      try {
        yield foo.__not_exists()
      } catch (e) {
        caught = e
      }
      assert.ok(caught)
    }
    {
      let baz = yield new RFClient(baseUrl).connect('baz')
      assert.equal((yield baz()), 'This is baz!')
    }
  }))
})

/* global describe, before, after, it */
