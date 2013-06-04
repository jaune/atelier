var _unzip = require('unzip'),
	_fs = require('fs'),
	_wget = require('wget'),
	_path = require('path'),
	_os = require('os'),
	_url = require('url'),
	_mkdirp = require('mkdirp')
	;


var MongodbService = function (name, settings) {
	this.name = name;
	this.settings = settings;
	this.options = {};
};

MongodbService.prototype.buildDownloadURL = function () {
	var domains = ['http://downloads.mongodb.org', 'http://fastdl.mongodb.org'];
	var cdn_index = Math.floor(Math.random() * domains.length);
	var platform = _os.platform();
	var arch = _os.arch();

	if (arch === 'x64') {
		arch = 'x86_64';
	}
	return domains[cdn_index]+'/'+platform+'/mongodb-'+platform+'-'+arch+'-'+this.settings.version+'.zip';
};

MongodbService.prototype.execute = function () {
	var args = '--port 27017 --logpath '+options.path+'/mongod.log --pidfilepath '+options.path+'/mongod.pid --dbpath '+options.path+'/data';


};

MongodbService.prototype.configure = function (options, next) {
	var me = this;

	_mkdirp(options.path+'/data', function (error) {
		if (error) {
			return next(error);
		}
		me.options = options;
		next();
	});
};


var _services = {
	mongodb: function (name, settings) {
		return new MongodbService(name, settings);
	}
};

function service_download (in_url, output_path, next) {
	console.log('service_download `'+in_url+'`, `'+output_path+'`');

	var options = {};
	var download = _wget.download(in_url, output_path, options);

	download.on('error', function(err) {
		next(err);
	});
	download.on('end', function(output) {
		next();
	});
	download.on('progress', function(progress) {
		console.log(progress);
	});
}

function service_unarchive (archive_path, unarchive_path, next) {
	console.log('service_unarchive `'+archive_path+'`, `'+unarchive_path+'`');

	_fs.createReadStream(archive_path)
		.pipe(_unzip.Extract({ path: unarchive_path }))
		.on('error', function (error) {
			return next(error);
		})
		.on('close', function () {
			return next();
		})
	;
}

function service_configure (service, options, next) {
	console.log('service_configure `'+service.name+'`');
	_mkdirp(options.path, function (error) {
		if (error) {
			return next(error);
		}
		_fs.writeFile(options.options_path, JSON.stringify(options), function (error) {
			if (error) {
				return next(error);
			}
			service.configure(options, next);
		});
	});
}

function service_install (name, settings, next) {
	console.log('service_install `'+name+'`');

	var service = _services[settings.type](name, settings),
		in_url =  service.buildDownloadURL(settings),
		working_path = __dirname+'/.atelier/.services/'+settings.type+'-'+settings.version,
		archive_path = working_path+'/'+_path.basename(_url.parse(in_url).pathname),
		service_path = __dirname+'/.atelier/'+name,
		options_path = service_path+'/.atelier.options.json'
	;
	var options = {
		options_path: options_path,
		path: service_path
	};

	var configure = function (error) {
		console.log('after service_unarchive');

		if (error) {
			return next(error);
		}
		service_configure(service, options, next);
	};

	_mkdirp(working_path, function (error) {
		if (error) {
			return next(error);
		}
		_fs.exists(archive_path, function (exists) {
			if (exists) {
				service_unarchive(archive_path, working_path, configure);
			} else {
				service_download(in_url, archive_path, function (error) {
					if (error) {
						return next(error);
					}
					service_unarchive(archive_path, working_path, configure);
				});
			}
		});
	});
}

function services_install (json_path, next) {
	_fs.exists(json_path, function (exists) {
		if (!exists) {
			return next(new Error('Missing `.atelier.json`.'));
		}
		_fs.readFile(json_path, function (error, data) {
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

			var count = json.services.length;
			var errors = [];
			Object.keys(json.services).forEach(function (service_name) {
				service_install(service_name, this[service_name], function (error) {
					if (error) {
						throw error;
					}
					count--;
					if (count === 0) {
						next();
					}
				});
			}, json.services);

		});

	});
}

var json_path = '.atelier.json';

services_install(json_path, function (errors) {
	if (errors) {
		throw errors;
	}
	console.log('done !');
});