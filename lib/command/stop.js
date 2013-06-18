var Command = function (atelier) {
	this.atelier = atelier;
};

Command.prototype.execute = function (parameters, next) {
	this.atelier.stopService(parameters[0], next);
};

module.exports = function (atelier) {
	return new Command(atelier);
};