var docker = require('..');
var remote = docker.Remote();

var ee = remote.events();
ee.on('status', function(line) {
  console.log('status', line);
});

ee.on('end', function() {
  console.log('events end');
});
