var _util = require('util');

var Command = function (atelier) {
	this.atelier = atelier;
};

Command.prototype.execute = function (parameters, next) {
	var services = this.atelier.services;

	Object.keys(services).forEach(function (service_name) {
		var service = services[service_name];
		var isRunning = service.isRunning;

		console.log(service_name+': '+(isRunning?'running':'stop'));
		if (!isRunning) {
			console.log(_util.inspect(service.events));
		}

	});

	next();
};

module.exports = function (atelier) {
	return new Command(atelier);
};