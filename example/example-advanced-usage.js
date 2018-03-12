#!/usr/bin/env node

/**
 * This is an example of rfunc client
 */
'use strict'

const rclient = require('rfunc/clinet')

void async function () {
  let sign = await rclient().connect('sign')

  // Fetch the spec data
  let $spec = await sign.describe()
  /* ... */
}().catch((err) => console.error(err))


