#!/usr/bin/env node

var _wget = require('wget'),
	_path = require('path'),
	_fs = require('fs'),
	_url = require('url'),
	_readline = require('readline'),
	_events = require("events"),
	_util = require("util"),

	Atelier = require('../lib/Atelier.js');

var atelier = new Atelier();

var command = null;

command = require('../lib/command/help.js')(atelier);
atelier.on('help', command);
atelier.on('h', command);

command = require('../lib/command/install.js')(atelier);
atelier.on('install', command);
atelier.on('i', command);

command = require('../lib/command/start.js')(atelier);
atelier.on('start', command);

command = require('../lib/command/services.js')(atelier);
atelier.on('services', command);

atelier.addons = {
	mongodb: require('../lib/addon/mongodb.js'),
	nodejs: require('../lib/addon/nodejs.js')
};

var rl = _readline.createInterface(process.stdin, process.stdout);

rl.setPrompt('atelier> ');

rl.on('line', function(line) {
	rl.pause();
	atelier.execute(line.trim(), function (result) {
		if (result) {
			console.log(result.stack || result);
		}

		rl.prompt();
		rl.resume();
	});
}).on('close', function() {
	atelier.termine();
	process.exit(0);
});

atelier.load(process.cwd()+'/.atelier.json', function (error) {
	if (error) {
		throw error;
	}
	rl.prompt();
});