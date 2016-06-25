var path = require("path");

try {
  var localAtelier = require.resolve(path.join(process.cwd(), 'node_modules', 'atelier', 'bin', 'atelier.js'));
  if(__filename !== localAtelier) {
    return require(localAtelier);
  }
} catch(e) {}

var program = require('commander');

program
  .version('0.1.0');

program
  .command('start')
  .action(function () {
    console.log('--START--');
  });

program
  .command('stop', '')
  .action(function () {
    console.log('--STOP--');
  });

program
  .command('install', '')
  .action(function () {
    console.log('--INSTALL--');
  });

program
  .command('list', '')
  .action(function () {
    console.log('--LIST--');
  });

program
  .parse(process.argv);
