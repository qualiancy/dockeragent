
describe('Remote', function () {
  var remote = new docker.Remote
    , IMAGE_NAME = 'busybox';

  describe('.version(cb)', function () {
    it('should return the version object', function (done) {
      remote.version(function (err, version) {
        should.not.exist(err);
        version.should.be.an('object');
        version.should.have.property('Version');
        done();
      });
    });
  });


  describe('.systemInfo(cb)', function () {
    it('shoud return the info object', function (done) {
      remote.info(function (err, info) {
        should.not.exist(err);
        info.should.be.an('object');
        info.should.include.keys('Containers', 'Images');
        done();
      });
    });
  });

  describe('.createImage({ fromImage: "' + IMAGE_NAME + '" })', function () {
    it('should emit status progress', function (done) {
      var ee = remote.pull({ fromImage: IMAGE_NAME });

      var spyError = chai.spy('error', function (err) {
        should.not.exist(err);
        should.not.exist(true);
      });

      var spyStatus = chai.spy('status', function (stat) {
        stat.should
          .be.an('object')
          .with.property('status');
      });

      ee.on('error', spyError);
      ee.on('status', spyStatus);
      ee.on('end', function (err) {
        should.not.exist(err);
        spyError.should.not.have.been.called();
        spyStatus.should.have.been.called();
        done();
      });
    });
  });

  function addImage (name)  {
    return function (done) {
      remote.pull({ fromImage: name }, function (err) {
        should.not.exist(err);
        done();
      });
    }
  }

  describe('.listImages(cb)', function () {
    before(addImage(IMAGE_NAME));
    it('should return the images array', function (done) {
      remote.images(function (err, images) {
        var found = false;
        should.not.exist(err);
        images.should.be.an('array');
        images.forEach(function (image) {
          if (image.Repository === IMAGE_NAME) {
            found = true;
          }
        });
        chai.expect(found, 'image found').to.be.true;
        done();
      });
    });
  });


  describe('.inspectImage("' + IMAGE_NAME + '", cb)', function () {
    before(addImage(IMAGE_NAME));
    it('should return the image details', function (done) {
      remote.image(IMAGE_NAME).info(function (err, image) {
        should.not.exist(err);
        image.should
          .be.an('object')
          .with.property('id');
        done();
      });
    });
  });

  describe('.removeImage("' + IMAGE_NAME + '", cb)', function () {
    before(addImage(IMAGE_NAME));
    it('should return the image details', function (done) {
      remote.image(IMAGE_NAME).remove(function (err, log) {
        should.not.exist(err);
        log.should.be.an('array');
        remote.images(function (err, images) {
          var found = false;
          should.not.exist(err);
          images.forEach(function (err) {
            if (image.Repository === IMAGE_NAME) {
              found = true;
            }
          });
          chai.expect(found, 'image found').to.be.false;
          done();
        });
      });
    });
  });

  describe.skip('.createContainer(cb)', function () {
    it('should not return an error', function (done) {
      var opts = {
          Image: 'base'
      };

      remote.createContainer(opts, function (err, res) {
        should.not.exist(err);
        console.log(res);
        done();
      });
    })
  });
});
