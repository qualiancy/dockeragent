var IMAGE_NAME = 'busybox';
var SIMPLE_SCRIPT = [ 'date' ];
var INFINITE_SCRIPT = [ '/bin/sh', '-c', 'while true; do echo hello universe; sleep 1; done' ]

describe('(system) remote', function () {
  var Remote = dockeragent.Remote;
  var remote = new Remote;
  remote.set('host', DOCKER_HOST);
  remote.set('port', DOCKER_PORT);

  describe('construction', function() {
    describe('Remote()', function() {
      it('uses default values', function() {
        var rem = new Remote;
        rem.get('host').should.equal('localhost');
        rem.get('port').should.equal(4243);
        rem.enabled('secure').should.be.false;
      });
    });

    describe('Remote("docker.io:5000")', function() {
      it('uses user provide host/port', function() {
        var rem = new Remote('docker.io:5000');
        rem.get('host').should.equal('docker.io');
        rem.get('port').should.equal(5000);
        rem.enabled('secure').should.be.false;
      });
    });

    describe('Remote("https://docker.io:5000")', function() {
      it('enables secure', function() {
        var rem = new Remote('https://docker.io:5000');
        rem.get('host').should.equal('docker.io');
        rem.get('port').should.equal(5000);
        rem.enabled('secure').should.be.true;
      });
    });

    describe('Remote("https://user:pass@docker.io:5000")', function() {
      it('detects user credentals', function() {
        var rem = new Remote('https://user:pass@docker.io:5000');
        rem.get('host').should.equal('docker.io');
        rem.get('port').should.equal(5000);
        rem.enabled('secure').should.be.true;
        rem.get('username').should.equal('user');
        rem.get('password').should.equal('pass');
      });
    });
  });

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
