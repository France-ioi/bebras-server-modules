require('node-env-file')(__dirname + '/.env')
var params = require('./libs/params')
var express = require('express')
var handler = require('./libs/handler')
var body_parser = require('body-parser')

var app = express()
app.use(body_parser.urlencoded({ extended: true }))
app.use(body_parser.json())

handler(app, params._[0])

app.listen(params.port, function () {
  console.log(`Serving handler ${params.handler} on port ${params.port}`)
});