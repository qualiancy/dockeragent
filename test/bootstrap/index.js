/*!
 * Attach chai to global should
 */

global.chai = require('chai');
global.should = global.chai.should();

/*!
 * Chai Plugins
 */

global.chai.use(require('chai-spies'));
//global.chai.use(require('chai-http'));

global.chai.after = function (n, fn) {
  return function () {
    --n || fn.apply(null, arguments);
  }
};

/*!
 * Import project
 */

global.dockeragent = require('../..');

/*!
 * Global configs
 */

global.DOCKER_HOST = process.env.DOCKERAGENT_HOST || 'localhost';
global.DOCKER_PORT = parseFloat(process.env.DOCKERAGENT_PORT || 4243);

/*!
 * Helper to load internals for cov unit tests
 */

function req (name) {
  return process.env.dockeragent_COV
    ? require('../../lib-cov/dockeragent/' + name)
    : require('../../lib/dockeragent/' + name);
}

/*!
 * Load unexposed modules for unit tests
 */

global.__dockeragent = {
    remote: {
        Container: req('remote/container')
      , Image: req('remote/image')
    }
};

global.noErr = function(fn) {
  return function () {
    var args = [].slice.call(arguments);
    should.not.exist(args[0]);
    args.shift();
    if (!args.length) return fn();
    fn.apply(null, args);
  };
};

global.addImage =  function(names)  {
  if (!Array.isArray(names)) names = [ names ];
  return function (done) {
    var rem = new dockeragent.Remote;
    var next = chai.after(names.length, done);

    rem.set('host', DOCKER_HOST);
    rem.set('port', DOCKER_PORT);
    rem.images(noErr(function (res) {
      names.forEach(function(name) {
        var image = res.filter(function(i) {
          return i.Repository === name;
        });

        if (!image.length) {
          rem.pull(name, noErr(next));
        } else {
          next();
        }
      });
    }));
  }
};
