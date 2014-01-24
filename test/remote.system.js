var Remote = dockeragent.Remote;

suite('.version()', function() {
  test('returns versions', function(done) {
    var docker = new Remote;
    docker.version(noErr(function(version) {
      version.should.be.an('object');
      version.should.include.keys('Version');
      done();
    }));
  });
});

suite('.info()', function() {
  test('returns info', function(done) {
    var docker = new Remote;
    docker.info(noErr(function(info) {
      info.should.be.an('object');
      info.should.include.keys('Containers', 'Images');
      done();
    }));
  });
});
