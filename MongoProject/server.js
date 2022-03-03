const express = require('express');
const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;
const initDatabases = require('./dbs');
const test = require('assert');
const routes = require('./routes');
var session = require('express-session');

var bodyParser = require('body-parser');

const app = express();
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(session({resave: true, saveUninitialized: true, secret: 'XCR3rsasa%RDHHH', cookie: { maxAge: 60000 }}));

initDatabases().then(dbs => {
	var mongodb = dbs.production
	var theApp = routes(app, mongodb);
	
	var server = theApp.listen(port, function() {});
});





