var _os = require('os'),
	_mkdirp = require('mkdirp'),
	_wget = require('wget'),
	_spawn = require('child_process').spawn;

var Addon = function (settings) {
	this.settings = settings;
};

Addon.prototype.install = function (next) {
	var platform = _os.platform(),
		arch = _os.arch(),
		in_url = null,
		downloader = null,
		output_path = this.settings.path + '/node.exe';

	if (platform !== 'win32') {
		return next(new Error('Unsuppoted platform `'+platform+'`.'));
	}
	in_url = 'http://nodejs.org/dist/v'+this.settings.version+'/'+arch+'/node.exe';

	downloader = _wget.download(in_url, output_path, {});
	downloader.on('error', function(err) {
		next(new Error('download `'+in_url+'` fail: '+err+'.'));
	});
	downloader.on('end', function(output) {
		next();
	});
	downloader.on('progress', function(progress) {
//		console.log(progress);
	});
};

Addon.prototype.configure = function (name, options, next) {
	next(null, {
		command: this.settings.path+'/node.exe',
		parameters: [process.cwd()+'/server.js']
	});
};

module.exports = function (settings) {
	return new Addon(settings);
};