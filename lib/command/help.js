var Command = function (atelier) {

};

Command.prototype.execute = function (parameters, next) {
	next('help');
};

module.exports = function (atelier) {
	return new Command(atelier);
};