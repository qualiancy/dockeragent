var IMAGE_NAME = 'busybox';
var SIMPLE_SCRIPT = [ 'date' ];
var INFINITE_SCRIPT = [ '/bin/sh', '-c', 'echo "hello world" > /.dockeragent; while true; do echo hello universe; sleep 1; done' ]

describe('(image) remote', function() {
  var remote = new dockeragent.Remote;
  remote.set('host', DOCKER_HOST);
  remote.set('port', DOCKER_PORT);

  function addImage (name)  {
    return function (done) {
      remote.pull(name, noErr(done));
    }
  }

  describe('.pull("' + IMAGE_NAME + '")', function() {
    it('emits pull status progress', function(done) {
      var ee = remote.pull(IMAGE_NAME);

      var spyError = chai.spy('error', function(err) {
        should.not.exist(err);
        should.not.exist(true);
      });

      var spyStatus = chai.spy('status', function(stat) {
        stat.should
          .be.an('object')
          .with.property('status');
      });

      ee.on('error', spyError);
      ee.on('status', spyStatus);
      ee.on('end', noErr(function() {
        spyError.should.not.have.been.called();
        spyStatus.should.have.been.called();
        done();
      }));
    });
  });

  describe('.images(cb)', function () {
    before(addImage(IMAGE_NAME));
    it('should return the images array', function (done) {
      remote.images(noErr(function(images) {
        var found = false;

        images.should.be.an('array');
        images.forEach(function (image) {
          if (image.Repository === IMAGE_NAME) found = true;
        });

        chai.expect(found, 'image found').to.be.true;
        done();
      }));
    });
  });

  describe('.image("' + IMAGE_NAME + '")', function() {
    beforeEach(addImage(IMAGE_NAME));

    describe('.inspect(cb)', function() {
      it('requests the image details', function(done) {
        remote
        .image(IMAGE_NAME)
        .inspect(noErr(function(image) {
          image.should
            .be.an('object')
            .with.property('id');
          done();
        }));
      });
    });

    describe('.remove(cb)', function() {
      it('removes an image', function(done) {
        remote
        .image(IMAGE_NAME)
        .remove(noErr(function(log) {
          log.should.be.an('array');
          remote.images(noErr(function(images) {
            var found = false;
            images = images || []; // cool!

            images.forEach(function (image) {
              if (image.Repository === IMAGE_NAME) found = true;
            });

            chai.expect(found, 'image found').to.be.false;
            done();
          }));
        }));
      });
    });

    describe('.history(cb)', function() {
      it('returns image history', function(done) {
        remote
        .image(IMAGE_NAME)
        .history(noErr(function(history) {
          history.should.be.an('array');
          history.should.have.length.above(0);
          done();
        }));
      });
    });
  });
});
