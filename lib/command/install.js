var _mkdirp = require('mkdirp');

var Command = function (atelier) {
	this.atelier = atelier;
};

Command.prototype.installService = function (name, next) {
	var addon = null,
		options = {};

	try {
		options = this.atelier.getOptionsByServiceName(name);
		addon = this.atelier.getAddonByServiceOptions(name, options);
	} catch (e) {
		return next(e);
	}

	var full_addon_name = options.addon+'@'+options.version;
	var full_service_name = name+'('+full_addon_name+')';

	_mkdirp(addon.settings.path, function (error) {
		if (error) { return next(error); }

		_mkdirp(options.path, function (error) {
			if (error) { return next(error); }

			console.log('install `'+full_addon_name+'`...');

			addon.install(function (error) {
				if (error) { return next(error); }

				console.log('install `'+full_addon_name+'` done !');

				return next();


			});
		});
	});
};


Command.prototype.installServices = function (services, next) {
	var me = this,
		keys = Object.keys(services),
		count = keys.length;

	keys.forEach(function (service_name) {
		me.installService(service_name, function (error) {
			if (error) { return next(error); }
			count--;
			if (count === 0) {
				next();
			}
		});
	}, services);
};

Command.prototype.execute = function (parameters, next) {
	var services = this.atelier.settings.services;
	if (parameters.length === 1) {
		var service = parameters[0];
		if (!services.hasOwnProperty(service)) {
			return next(new Error('Missing service `'+service+'`.'));
		}
		return this.installService(service, next);
	} else if (parameters.length === 0) {
		return this.installServices(services, next);
	} else {
		return next(new Error('Usage: [service_name]'));
	}
};

module.exports = function (atelier) {

	return new Command(atelier);
};