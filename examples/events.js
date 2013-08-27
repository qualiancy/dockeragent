var DOCKER_HOST = process.env.DOCKERAGENT_HOST || 'localhost';;;;
var DOCKER_PORT = parseFloat(process.env.DOCKERAGENT_PORT || 4243);

var docker = require('..');
var remote = new docker.Remote;

remote
.set('host', DOCKER_HOST)
.set('post', DOCKER_PORT);

var ee = remote.events();

ee.on('status', function(line) {
  console.log('status', line);
});

ee.on('end', function() {
  console.log('events end');
});
