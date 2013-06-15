var _os = require('os'),
	_mkdirp = require('mkdirp'),
	_unzip = require('unzip'),
	_wget = require('wget'),
	_fs = require('fs'),
	_spawn = require('child_process').spawn;

var Addon = function (settings) {
	this.settings = settings;
};

Addon.prototype.buildPackName = function () {
	var arch = _os.arch();
	if (arch === 'x64') {
		arch = 'x86_64';
	}
	return 'mongodb-'+_os.platform()+'-'+arch+'-'+this.settings.version;
};

Addon.prototype.install = function (next) {
	var domains = ['http://downloads.mongodb.org', 'http://fastdl.mongodb.org'];
	var cdn_index = Math.floor(Math.random() * domains.length);
	var platform = _os.platform();

	if (platform !== 'win32') {
		return next(new Error('Unsuppoted platform `'+platform+'`.'));
	}

	var url = domains[cdn_index]+'/'+platform+'/'+this.buildPackName()+'.zip';
	var archive_path = this.settings.path+'/mongodb.zip';
	var unarchive_path = this.settings.path;
	var downloader = _wget.download(url, archive_path, {});

	downloader.on('error', function(err) {
		next(new Error('download `'+url+'` fail: '+err+'.'));
	});
	downloader.on('end', function(archive_path) {
		_fs.createReadStream(archive_path)
			.pipe(_unzip.Extract({ path: unarchive_path }))
			.on('error', function (error) {
				return next(error);
			})
			.on('close', function () {
				next();
			})
		;
	});
	downloader.on('progress', function(progress) {
//		console.log(progress);
	});
};
/*
Addon.prototype.start = function (name, next) {
	var path = this.settings.service.path,
		command = this.settings.addon.path+'/bin/mongod.exe';

	next(null, command, ['--port', '27017', '--logpath', path+'/mongod.log', '--pidfilepath', path+'/mongod.pid', '--dbpath', path+'/data']);

	deamon.stdout.on('data', function (data) {
		console.log('mongodb stdout >>> ' + data);
	});

	deamon.stderr.on('data', function (data) {
		console.log('mongodb stderr >>> ' + data);
	});

	deamon.on('close', function (code) {
		console.log('mongodb close >>> ' + code);
	});
};

Addon.prototype.stop = function (name, next) {
	deamon.kill();
};

Addon.prototype.restart = function (name, next) {
	var me = this;
	this.stop(name, function (error) {
		if (error) {
			return next(error);
		}
		this.start(name, next);
	});
};
*/
Addon.prototype.configure = function (name, options, next) {
	var me = this,
		path = options.path;

	_mkdirp(path+'/data', function (error) {
		if (error) {
			return next(error);
		}
		next(null, {
			command: me.settings.path+'/'+me.buildPackName()+'/bin/mongod.exe',
			parameters: ['--port', '27017', '--logpath', path+'/mongod.log', '--pidfilepath', path+'/mongod.pid', '--dbpath', path+'/data']
		});
	});

};

module.exports = function (settings) {
	return new Addon(settings);
};