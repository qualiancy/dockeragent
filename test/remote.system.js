var IMAGE_NAME = 'busybox';
var SIMPLE_SCRIPT = [ 'date' ];
var INFINITE_SCRIPT = [ '/bin/sh', '-c', 'while true; do echo hello universe; sleep 1; done' ]

describe('(system) remote', function () {
  var remote = new dockeragent.Remote
  remote.set('host', DOCKER_HOST);
  remote.set('port', DOCKER_PORT);

  function addImage (name)  {
    return function (done) {
      remote.pull(name, noErr(done));
    }
  }

  describe('.version(cb)', function() {
    it('requests the version object', function(done) {
      remote.version(noErr(function(version) {
        version.should.be.an('object');
        version.should.have.property('Version');
        done();
      }));
    });
  });

  describe('.info(cb)', function() {
    it('requests the info object', function (done) {
      remote.info(noErr(function(info) {
        info.should.be.an('object');
        info.should.include.keys('Containers', 'Images');
        done();
      }));
    });
  });
});
