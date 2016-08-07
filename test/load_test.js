/**
 * Test case for load.
 * Runs with mocha.
 */
'use strict'

const load = require('../lib/load.js')
const assert = require('assert')
const co = require('co')

describe('load', function () {
  this.timeout(3000)

  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Load', () => co(function * () {
    let module = yield load({
      hey () {
        const s = this
        return s._hey
      },
      $init () {
        const s = this
        s._hey = 0
      },
      $before () {
        const s = this
        s._hey = s._hey + 1
      },
      $after () {
        const s = this
        s._hey = s._hey * 2
      }
    })
    assert.equal(yield module.hey(), 1)
    assert.equal(yield module.hey(), 3)
    assert.equal(yield module.hey(), 7)
  }))
})

/* global describe, before, after, it */
