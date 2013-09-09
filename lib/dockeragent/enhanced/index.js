/*!
 * DockerAgent - enhanced hooks bootstrap
 * Copyright(c) 2013 Jake Luer <jake@datalabs.io>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var debug = require('sherlock')('dockeragent:enhanced');

/*!
 * Primary exports
 */

var exports = module.exports = mount;

/*!
 * Mount all hooks
 */

function mount(remote) {
  for (var name in exports) {
    debug('(mount) %s', name);
    remote.hook(name, exports[name]);
  }

  return remote;
};

/*!
 * Export individual hooks for cherry-picking.
 */

exports['container:top'] = require('./container.top');
