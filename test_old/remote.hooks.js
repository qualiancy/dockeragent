describe('(hooks) remote', function() {
  var remote = new dockeragent.Remote;
  remote.set('host', DOCKER_HOST);
  remote.set('port', DOCKER_PORT);

  describe('.prepareHook(name, cb)', function() {
    it('will be invoked on ns response', function(done) {
      var hook = chai.spy('version', function(res, next) {
        setTimeout(function() {
          res.invoked = true;
          next(null, res);
        }, 100);
      });

      remote.hook('system:version', hook);

      remote.version(function(err, res) {
        should.not.exist(err);
        res.should.have.property('invoked', true);
        hook.should.have.been.called.once;
        done();
      });
    });

    it('will error a response on hook return error', function(done) {
      var hook = chai.spy('version', function(res, next) {
        setTimeout(function() {
          var err = new Error('fail on purpose');
          next(err);
        }, 100);
      });

      remote.hook('system:version', hook);

      remote.version(function(err, res) {
        should.exist(err);
        err.should.be.instanceof(Error);
        err.should.have.property('message', 'fail on purpose');
        hook.should.have.been.called.once;
        done();
      });
    });
  });

  describe('.hook(name)', function() {
    it('removes a hook at name', function(done) {
      var hook = chai.spy('version');

      remote.hook('system:version', hook);
      remote.hook('system:version');

      remote.version(function(err, res) {
        hook.should.not.have.been.called();
        done();
      });
    });
  });
});
