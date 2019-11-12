// register babel for the snapshot helper
require('@babel/register')
require('regenerator-runtime/runtime')

const launch = require('../helpers/snapshot').default

launch(async (page, snapshot) => {
  await page.goto('http://localhost:9999')
  await snapshot('Home Page')
})
