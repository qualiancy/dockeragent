var IMAGE_NAME = 'busybox';
var SIMPLE_SCRIPT = [ 'date' ];
var INFINITE_SCRIPT = [ '/bin/sh', '-c', 'echo "hello world" > /.dockeragent; while true; do echo hello universe; sleep 1; done' ]

describe('(containers) remote', function() {
  var remote = new dockeragent.Remote;
  remote.set('host', DOCKER_HOST);
  remote.set('port', DOCKER_PORT);

  function addImage (name)  {
    return function (done) {
      remote.pull(name, noErr(done));
    }
  }

  describe('.create(opts, cb)', function () {
    before(addImage(IMAGE_NAME));
    it('responds with an id', function (done) {
      var opts = { Image: IMAGE_NAME, Cmd: SIMPLE_SCRIPT };
      remote.create(opts, noErr(function(res) {
        should.exist(res);
        res.should.have.property('Id');
        done();
      }));
    })
  });

  describe('.containers(opts, cb)', function() {
    var opts = { Image: IMAGE_NAME, Cmd: INFINITE_SCRIPT };

    before(addImage(IMAGE_NAME));
    it('lists all available containers', function(done) {
      remote.create(opts, noErr(function(res) {
        remote.containers(true, noErr(function(list) {
          var found = false;
          list.should.be.an('array');
          for (var i = 0; i < list.length; i++) {
            if (~list[i].Id.indexOf(res.Id)) found = true;
          }
          found.should.be.true;
          done();
        }));
      }));
    });
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
        var container = remote.container(c.Id);
        containers.push(container);
        done();
      }));
    });

    after(function(done) {
      var i = contaminated.length;

      function next () {
        --i || done();
      }

      contaminated.forEach(function(c) {
        c.stop(function () {
          c.remove(next);
        });
      });
    });

    describe('.inspect(cb)', function() {
      it('responds with status object', function(done) {
        var container = claim();
        container.info(noErr(function(res) {
          //console.log(res);
          done();
        }));
      });
    });

    describe('.remove(cb)', function() {
      it('removes container from available', function(done) {
        var container = claim();
        var id = container.id;
        container.remove(noErr(function() {
          remote.containers(true, noErr(function(list) {
            var found = false;
            for (var i = 0; i < list.length; i++) {
              if (~list[i].Id.indexOf(id)) found = true;
            }

            found.should.be.false;
            done();
          }));
        }));
      });
    });

    describe('.start(cb)', function() {
      it('starts a container', function(done) {
        var container = claim();
        container.info(noErr(function(stats_pre) {
          stats_pre.should.have.deep.property('State.Running', false);
          container.start(noErr(function() {
            container.info(noErr(function(stats_post) {
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
          container.info(noErr(function(stats_pre) {
            stats_pre.should.have.deep.property('State.Running', true);
            container.stop(noErr(function() {
              container.info(noErr(function(stats_post) {
                stats_post.should.have.deep.property('State.Running', false);
                done();
              }));
            }));
          }));
        }));
      });
    });

    describe('.restart(cb)', function() {
      it('restarts a container', function(done) {
        var container = claim();
        container.start(noErr(function() {
          container.info(noErr(function(stats_pre) {
            stats_pre.should.have.deep.property('State.Running', true);
            container.restart(noErr(function() {
              container.info(noErr(function(stats_post) {
                stats_post.should.have.deep.property('State.Running', true);
                done();
              }));
            }));
          }));
        }));
      });
    });

    describe('.kill(cb)', function() {
      it('kills a running container', function(done) {
        var container = claim();
        container.start(noErr(function() {
          container.info(noErr(function(stats_pre) {
            stats_pre.should.have.deep.property('State.Running', true);
            container.kill(noErr(function() {
              container.info(noErr(function(stats_post) {
                stats_post.should.have.deep.property('State.Running', false);
                done();
              }));
            }));
          }));
        }));
      });
    });

    describe('.wait(cb)', function() {
      it('waits for exit of a running container', function(done) {
        var container = claim();
        container.start(noErr(function() {
          container.info(noErr(function(stats_pre) {
            stats_pre.should.have.deep.property('State.Running', true);
            container.wait(noErr(function(res) {
              res.should.have.property('StatusCode');
              container.info(noErr(function(stats_post) {
                stats_post.should.have.deep.property('State.Running', false);
                done();
              }));
            }));

            container.stop();
          }));
        }));
      });
    });

    describe('.top(cb)', function() {
      it('responds with running processes', function(done) {
        var container = claim();
        container.start(noErr(function() {
          setTimeout(function() { // time to start
            container.top(noErr(function(procs) {
              procs.should.be.an('object');
              procs.should.have.property('Titles')
                .an('array');
              procs.should.have.property('Processes')
                .an('array')
              procs['Processes'].should.have.length.above(0);
              done();
            }));
          }, 500);
        }));
      });
    });

    describe('.changes(cb)', function() {
      it('responds with container fs changes', function(done) {
        var container = claim();
        container.start(noErr(function() {
          setTimeout(function() { // time to start
            container.changes(noErr(function(res) {
              should.exist(res);
              res.should.be.an('array')
              res.should.have.length.above(0);
              done();
            }));
          }, 100);
        }));
      });
    });

    describe('.export()', function() {
      it('streams container contents', function(done) {
        var container = claim();
        var stream = container.export();
        var len = 0;

        stream.on('readable', function() {
          var chunk = stream.read();
          if (chunk) len += chunk.length;
        });

        stream.once('end', function() {
          (len / 1024).should.be.above(1000);
          done();
        });
      });
    });

    describe('.attach(opts)', function() {
      it('can stream the stdout', function(done) {
        var container = claim();
        container.start(noErr(function() {
          var i = 5;
          var stream = container.attach({ stream: true, stdout: true });

          stream.on('readable', function() {
            var chunk = stream.read();
            should.exist(chunk);
            chunk = chunk.toString();
            chunk.should.equal('hello universe\n');
            --i || stream.destroy();
          });

          stream.once('end', done);
        }));
      });
    });

    describe('.copy(opts)', function() {
      it('can stream a file', function(done) {
        var container = claim();
        container.start(noErr(function() {
          setTimeout(function() {
            var str = '';
            var stream = container.copy('/.dockeragent');

            stream.on('readable', function() {
              var chunk = stream.read();
              should.exist(chunk);
              chunk = chunk.toString();
              str += chunk;
            });

            stream.once('end', function() {
              str.should.contain('hello world');
              done();
            });
          }, 500);
        }));
      });
    });
  });
});
