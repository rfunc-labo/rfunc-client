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
  let rfunc
  let baseUrl
  before(() => co(function * () {
    port = yield aport()
    rfunc = rfunc({
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
        $spec: {
          name: 'foo-api',
          methods: {
            hello: { desc: 'Say hello' },
            bye: { desc: 'Say bye' }
          }
        }
      }
    }, {
      pathname: BASE_URL
    })
    rfunc.listen(port)
    baseUrl = `http://localhost:${port}${BASE_URL}`
  }))

  after(() => co(function * () {
    rfunc.close()
  }))

  it('Send client', () => co(function * () {
    // Get description
    {
      let desc = yield new RFClient(baseUrl).describe('foo')
      assert.ok(desc.name, 'foo-api')
    }
    {
      let foo = yield new RFClient(baseUrl).connect('foo')
      let hoge = yield foo.bar('hoge')
      console.log(hoge)
    }
  }))
})

/* global describe, before, after, it */
