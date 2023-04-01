const webdav = require('webdav-server').v2;
const express = require('express');
const cors = require('cors')
const util = require('util')

exports.startWebdav = async function startWebdav({
  port = 1900,
  dir = "./test/store/",
} = {}) {
  const nephele = (await import('nephele')).default
  const fileSystem = (await import('@nephele/adapter-file-system')).default
  const authNone =  (await import('@nephele/authenticator-none')).default
  const pluginIndex = (await import('@nephele/plugin-index')).default
  // JavaScript
  const app = express();
  app.use(
    '/',
    nephele({
      adapter: new fileSystem({ root: dir }),
      authenticator: new authNone(),
      plugins: [new pluginIndex()],
    })
  );
  let s = app.listen(port)
  return () => new Promise(res => s.close(res))
}
exports.startWebdav2 = function startWebdav({
  port = 1900,
  dir = "./test/store/",
} = {}) {
  // JavaScript
  const app = express();

  const simpleUserManager = new webdav.SimpleUserManager();
  const user = simpleUserManager.addUser("user", "user", true);

  // Privilege manager (tells which users can access which files/folders)
  const privilegeManager = new webdav.SimplePathPrivilegeManager();
  privilegeManager.setRights(user, "/", ["all"]);

  const server = new webdav.WebDAVServer({
    port: port,
    lockTimeout: 30 * 1000,
    privilegeManager,
    httpAuthentication: new webdav.HTTPBasicAuthentication(simpleUserManager),
  });
  server.setFileSystem(
    "/",
    new webdav.PhysicalFileSystem(dir),
    (success) => { }
  );
  server.start(port, (aa) => {
    aa.addListener('error', console.error)
    aa.addListener('clientError', console.error)
    aa.on('error', console.error)
  })
  return () => server.stopAsync()
}
