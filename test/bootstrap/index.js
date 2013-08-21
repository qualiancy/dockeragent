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

/*!
 * Import project
 */

global.dockeragent = require('../..');

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
