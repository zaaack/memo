
require('ts-node').register({
  project: './tsconfig.test.json',
  moduleTypes: {
    // "./src": 'esm',
    // "./test": 'esm',
  }
})

require('source-map-support/register')
