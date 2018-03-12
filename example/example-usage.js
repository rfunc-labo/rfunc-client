#!/usr/bin/env node

/**
 * This is an example of rfunc client
 */
'use strict'

const rclient = require('rfunc-clinet')

void async function () {
  const sign = await rclient().connect('sign') // Define a client

  // Call remote api and receive the result
  const {success} = await sign.signin('foo', 'bar1234')
  console.log('success:', success)
}().catch((err) => console.error(err))
