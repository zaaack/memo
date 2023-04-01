const { exec } = require('foy')
const { getProxyServer } = require('../start-proxy')
const { startWebdav } = require('./start-webdav')

getProxyServer(3010)
startWebdav()
// exec(`./test/webdav/webdav -c ./test/webdav/config.yaml`)
