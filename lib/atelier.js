var _fs = require('fs'),
	_path = require('path'),
	_spawn = require('child_process').spawn,
	_util = require('util');

var Atelier = function () {
	this.commands = {};
	this.services = {};
	this.addons = {};

	this.settings = {
		path: null,
		service: {
			path: null
		},
		services: {
		},
		addon: {
			path: null
		}
	};
};

/**
 *
 */
Atelier.prototype.startService = function (name, next) {
	var addon = null,
		options = {},
		me = this;

	try {
		options = this.getOptionsByServiceName(name);
		addon = this.getAddonByServiceOptions(name, options);
	} catch (e) {
		return next(e);
	}

	addon.configure(name, options, function (error, config) {
		if (error) { return next(error); }

//		console.log(_util.inspect(config));

		var deamon = _spawn(config.command, config.parameters);

		deamon.stdout.pipe(_fs.createWriteStream(options.path+'/stdout.log'));
		deamon.stderr.pipe(_fs.createWriteStream(options.path+'/stderr.log'));

		deamon.on('exit', function (code, signal) {
			var service = me.services[name];

			service.isRunning = false;
			service.events.push({
				name: 'exit',
				code: code,
				signal: signal
			});
		});

		deamon.on('error', function (error) {
			var service = me.services[name];

			service.isRunning = false;
			service.events.push({
				name: 'error',
				error: error
			});
		});

		deamon.on('close', function (code) {
			var service = me.services[name];

			service.isRunning = false;
			service.events.push({
				name: 'close',
				code: code
			});
		});

		me.services[name] = {
			name: name,
			deamon: deamon,
			isRunning: true,
			events: []
		};

		return next();
	});
};

/**
 *
 */
Atelier.prototype.stopService = function (name, next) {
	if (!this.services.hasOwnProperty(name)) {
		return next(new Error('Missing service `'+name+'`.'));
	}

	var service = this.services[name];

	if (!service.isRunning) {
		return next(new Error('Service `'+name+'` already stop.'));
	}

	service.deamon.kill();
	next(null, 'Signal `kill` sent.');
};


Atelier.prototype.getOptionsByServiceName = function (name) {
	if (!this.settings.services.hasOwnProperty(name)) {
		throw new Error('Missing service `'+name+'`.');
	}
	var options = this.settings.services[name];

	options.path = this.settings.service.path+'/'+name;

	return options;
};

Atelier.prototype.getAddonByServiceName = function (name) {
	return this.getAddonByServiceOptions(name, this.getOptionsByServiceName(name));
};

Atelier.prototype.getAddonByServiceOptions = function (name, options) {
	if (!options.hasOwnProperty('addon')) {
		throw new Error('Missing option `addon`.');
	}

	if (!options.hasOwnProperty('version')) {
		throw new Error('Missing option `version`.');
	}

	if (!this.addons.hasOwnProperty(options.addon)) {
		throw new Error('Missing addon `'+options.addon+'`.');
	}

	var factory = this.addons[options.addon];

	if (typeof factory !== 'function') {
		throw new Error('Addon factory `'+options.addon+'` must be a function.');
	}

	var settings = {
		name: options.addon,
		version: options.version,
		path: this.settings.addon.path+'/'+options.addon+'-'+options.version
	};

	var addon = factory(settings);

	if (typeof addon.install !== 'function') {
		throw new Error('Addon `'+settings.name+'` must have a method `install`.');
	}

	return addon;
};

Atelier.prototype.load = function (path, next) {
	var me = this;

	_fs.exists(path, function (exists) {
		if (!exists) {
			return next(new Error('Missing `.atelier.json`.'));
		}
		_fs.readFile(path, function (error, data) {
			if (error) {
				return next(new Error('Read `.atelier.json` fail.'));
			}
			var json = JSON.parse(data);
			if (!json) {
				return next(new Error('Wrong `.atelier.json`.'));
			}
			if (!json.hasOwnProperty('services')) {
				return next(new Error('Missing `service` in `.atelier.json`.'));
			}

			me.settings.path = path;
			me.settings.service.path = _path.dirname(path)+'/.atelier';
			me.settings.addon.path = _path.dirname(path)+'/.atelier/.addon';

			me.settings.services = json.services;

			next();
		});
	});

};

Atelier.prototype.execute = function (expression, next) {
	var parameters = expression.split(' ');

	var name = parameters.shift();

	if (!this.commands.hasOwnProperty(name)) {
		next('Missing command `'+name+'`.');
		return;
	}

	this.commands[name].execute(parameters, next);
};

Atelier.prototype.termine = function () {
	console.log('---*---');
};

module.exports = Atelier;