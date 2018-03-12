/**
 * Test case for load.
 * Runs with mocha.
 */
'use strict'

const load = require('../lib/load.js')
const assert = require('assert')


describe('load', function () {
  this.timeout(3000)

  before(async () => {

  })

  after(async () => {

  })

  it('Load', async () => {
    let module = await load({
      hey () {
        return this._hey
      },
      $init () {
        this._hey = 0
      },
      $before () {
        this._hey = this._hey + 1
      },
      $after () {
        this._hey = this._hey * 2
      }
    })
    assert.equal(await module.hey(), 1)
    assert.equal(await module.hey(), 3)
    assert.equal(await module.hey(), 7)
  })
})

/* global describe, before, after, it */
