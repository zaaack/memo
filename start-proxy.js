const httpProxy = require('http-proxy');
const express = require('express')
const cors = require('cors');
const { default: axios } = require('axios');

exports.getProxyServer = function (port) {
  const app = express()
  var proxy = httpProxy.createProxyServer({});
  app.use('/proxy', cors({
    credentials: true,
    origin(o, c) { return c(null, true) },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,MKCOL,COPY,MOVE,PROPFIND,OPTIONS,LOCK',
  }), function (req, res) {
    try {

      res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');

      let target = req.url.slice(1)
      target = target.replace(/:\/(\w+)/g, '://$1')
      console.log(req.method, target)
      if (target.startsWith('http')) {
        proxy.web(req, res, {
          target,
          changeOrigin: true,
          autoRewrite: true,
          followRedirects: true,
          ignorePath: true,
          cookieDomainRewrite: true,
          cookiePathRewrite: true,
        });
      } else {
        res.statusCode = 404
        res.end('404')
      }
    } catch (error) {
      console.error(error)
    }
  });

  app.use('/static', express.static('./dist'))

  if (port) {
    console.log("listening on port " + port)
    app.listen(port);
  }
  return app
}
