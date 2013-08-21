var IMAGE_NAME = 'busybox';
var SIMPLE_SCRIPT = [ 'date' ];
var INFINITE_SCRIPT = [ '/bin/sh', '-c', 'while true; do echo hello universe; sleep 1; done' ]

var DOCKER_HOST = process.env.DOCKERAGENT_HOST || 'localhost';
var DOCKER_PORT = parseFloat(process.env.DOCKERAGENT_PORT || 4243);

function noErr(fn) {
  return function () {
    var args = [].slice.call(arguments);
    should.not.exist(args[0]);
    args.shift();
    if (!args.length) return fn();
    fn.apply(null, args);
  }
}

describe('remote', function () {
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
    describe('.inspect(cb)', function() {
      before(addImage(IMAGE_NAME));
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
      before(addImage(IMAGE_NAME));
      it('removes an image', function(done) {
        remote
        .image(IMAGE_NAME)
        .remove(noErr(function(log) {
          log.should.be.an('array');
          remote.images(noErr(function(images) {
            var found = false;

            images.forEach(function (image) {
              if (image.Repository === IMAGE_NAME) found = true;
            });

            chai.expect(found, 'image found').to.be.false;
            done();
          }));
        }));
      });
    });
  });

  describe('.create(opts, cb)', function () {
    before(addImage(IMAGE_NAME));
    it('should not return an error', function (done) {
      var opts = { Image: IMAGE_NAME, Cmd: SIMPLE_SCRIPT };
      remote.create(opts, noErr(function(res) {
        should.exist(res);
        res.should.be.instanceof(__dockeragent.remote.Container);
        done();
      }));
    })
  });

  describe('.container(id)', function() {
    var opts = { Image: IMAGE_NAME, Cmd: INFINITE_SCRIPT };
    var containers = [];
    var contaminated = [];

    function claim() {
      var c = containers.shift();
      contaminated.push(c);
      return c;
    }

    before(addImage(IMAGE_NAME));
    beforeEach(function(done) {
      remote.create(opts, noErr(function(c) {
        containers.push(c);
        done();
      }));
    });

    after(function(done) {
      var i = contaminated.length;

      function next () {
        --i || done();
      }

      contaminated.forEach(function(c) {
        c.stop(next);
      });
    });

    describe('.inspect(cb)', function() {
      it('responds with status object', function(done) {
        var container = claim();
        container.inspect(noErr(function(res) {
          //console.log(res);
          done();
        }));
      });
    });

    describe('.start(cb)', function() {
      it('starts a container', function(done) {
        var container = claim();
        container.inspect(noErr(function(stats_pre) {
          stats_pre.should.have.deep.property('State.Running', false);
          container.start(noErr(function() {
            container.inspect(noErr(function(stats_post) {
              stats_post.should.have.deep.property('State.Running', true);
              done();
            }));
          }));
        }));
      });
    });

    describe('.stop(cb)', function() {
      it('stops a container', function(done) {
        var container = claim();
        container.start(noErr(function() {
          container.inspect(noErr(function(stats_pre) {
            stats_pre.should.have.deep.property('State.Running', true);
            container.stop(noErr(function() {
              container.inspect(noErr(function(stats_post) {
                stats_post.should.have.deep.property('State.Running', false);
                done();
              }));
            }));
          }));
        }));
      });
    });

    describe('.top(cb)', function() {
      it('responds with running processes', function(done) {
        var container = claim();
        container.start(noErr(function() {
          setTimeout(function() {
            container.top(noErr(function(procs) {
              procs.should.be.an('array');
              procs.should.have.lengthOf(2);
              procs.forEach(function(proc) {
                proc.should.have.keys('pid', 'tty', 'time', 'cmd');
              });
              done();
            }));
          }, 500);
        }));
      });
    });
  });
});
