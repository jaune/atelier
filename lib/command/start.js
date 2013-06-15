var _spawn = require('child_process').spawn;

var Command = function (atelier) {
	this.atelier = atelier;
};

Command.prototype.startService = function (name, next) {
	var addon = null,
		options = {};

	try {
		options = this.atelier.getOptionsByServiceName(name);
		addon = this.atelier.getAddonByServiceOptions(name, options);
	} catch (e) {
		return next(e);
	}

	addon.configure(name, options, function (error, config) {
		if (error) { return next(error); }

		console.dir(config);

		var deamon = _spawn(config.command, config.parameters);

		deamon.stdout.on('data', function (data) {
			console.log(name+' stdout >>> \n' + data);
		});

		deamon.stderr.on('data', function (data) {
			console.log(name+' stderr >>> \n' + data);
		});

		deamon.on('exit', function (code, signal) {
			console.log(name+' exit >>> \n' + code+', '+signal);
		});

		deamon.on('error', function (error) {
			console.log(name+' error >>> \n' + error.stack);
		});

		deamon.on('close', function (code) {
			console.log(name+' close >>> \n' + code);
		});

		return next();
	});
};

Command.prototype.execute = function (parameters, next) {
	this.startService(parameters[0], next);
};

module.exports = function (atelier) {
	return new Command(atelier);
};