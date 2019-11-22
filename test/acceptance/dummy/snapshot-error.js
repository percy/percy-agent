// register babel for the snapshot helper
require('@babel/register')
require('regenerator-runtime/runtime')

const launch = require('../helpers/snapshot').default

launch(async (page, snapshot) => {
  await page.goto('http://localhost:9999')

  setTimeout(() => {
    throw new Error('Surprise!')
  }, 100) // magic number

  for (let index = 0; index < 10; index++) {
    await snapshot(`Home Page - ${index}`)
  }
})
