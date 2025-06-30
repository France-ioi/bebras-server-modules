require('node-env-file')(__dirname + '/.env')
var params = require('./libs/params')
var express = require('express')
var handler = require('./libs/handler')
var body_parser = require('body-parser')
var cors = require('./middleware/cors')
var conf = require('./config/server')

var app = express()
app.use(body_parser.urlencoded({ extended: true, limit: conf.request_max_size }))
app.use(body_parser.json({limit: conf.request_max_size}))
app.use(cors)
handler(app, params._[0])

app.listen(params.port, function () {
  console.log(`Serving handler ${params._[0]} on port ${params.port}`)
});