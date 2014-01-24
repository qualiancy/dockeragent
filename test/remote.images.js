var IMAGE_NAME = 'busybox';
var SIMPLE_SCRIPT = [ 'date' ];
var INFINITE_SCRIPT = [ '/bin/sh', '-c', 'echo "hello world" > /.dockeragent; while true; do echo hello universe; sleep 1; done' ]

var Remote = dockeragent.Remote;

suite('.pull()', function() {
  test('returns a status stream', function(done) {
    var docker = new Remote;

    var spy = chai.spy('readable', function() {
      var line = this.read();
      if (!line) return;
      line.should.be.an('object');
    });

    var stat = docker.pull({ fromImage: IMAGE_NAME }, noErr(function(id) {
      id.should.be.a('string');
      spy.should.have.been.called.gt(1);
      done();
    }));

    stat.on('readable', spy);
  });
});

suite('.images()', function() {
  test('returns list of images', function(done) {
    var docker = new Remote;
    docker.images(noErr(function(images) {
      images.filter(function(image) {
        return image.RepoTags[0].indexOf(IMAGE_NAME) === 0;
      }).should.have.length.gt(0);
      done();
    }));
  });
});

suite('Image', function() {

  function pull(cb) {
    var docker = new Remote;

    var pull = docker.pull({ fromImage: IMAGE_NAME }, noErr(function(id) {
      var img = docker.image(id);
      cb(null, img, docker);
    }));

    pull.on('readable', function() { this.read(); });
  }

  suite('.info()', function() {
    test('returns image info', function(done) {
      pull(function(err, img, docker) {
        img.info(noErr(function(info) {
          info.should.be.an('object');
          info.should.have.property('id').a('string');
          info.id.indexOf(img.id).should.equal(0);
          done();
        }));
      });
    });
  });

  suite('.history()', function() {
    test('returns image history', function(done) {
      pull(function(err, img, docker) {
        img.history(noErr(function(hist) {
          hist.should.be.an('array').with.property('length').gt(1);

          hist.forEach(function(item) {
            item.should.be.an('object');
            item.should.include.keys('Id', 'Created', 'Size');
          });

          done();
        }));
      });
    });
  });
});
