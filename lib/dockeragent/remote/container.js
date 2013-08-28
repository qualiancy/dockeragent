/*!
 * DockerAgent - Remote Container
 * Copyright(c) 2013 Jake Luer <jake@datalabs.io>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var debug = require('sherlock')('dockeragent:remote-container');

/*!
 * Local dependencies
 */

var macro = require('./macros');

/*!
 * Primary export
 */

module.exports = Container;

/**
 * ### Container
 *
 * Container constructor.
 *
 * @param {Remote} dockeragent remote
 * @param {String} container id
 */

function Container(remote, id) {
  if (!(this instanceof Container)) return new Container(remote, id);
  this.id = id;
  this.remote = remote;
}

/**
 * #### .inspect(cb)
 *
 * Get low-level information about a container.
 *
 * @param {Function} callback
 * @cb {Error|null}
 * @cb {Object} response
 * @hook container:inspect
 * @http GET /containers/:id/json
 * @api public
 */

Container.prototype.inspect = function(cb) {
  var ns = 'container:inspect';
  var hook = this.remote.prepareHook(ns, cb);
  var url = '/containers/' + this.id + '/json';
  var req = this.remote.request('get', url);

  debug('(%s) #%s', ns, this.id);
  macro.request(ns, req, hook);

  return this;
};

/**
 * #### .start([opts,] cb)
 *
 * Start the container.
 *
 * @param {Object} options (request body)
 * @param {Function} callback
 * @cb {Error|null}
 * @http POST /containers/:id/start
 * @api public
 */

Container.prototype.start = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts = {};

  var ns = 'container:start';
  var url = '/containers/' + this.id + '/start';
  var req = this.remote.request('post', url);
  req.send(opts);
  req.expectCode = 204;

  debug('(%s) #%s %j', ns, this.id, opts);
  macro.request(ns, req, cb);

  return this;
};

/**
 * #### .stop(opts, cb)
 *
 * Stop the container. Default option is `t`.
 *
 * @param {Object} options (querystring)
 * @param {Function} callback
 * @cb {Error|null}
 * @http POST /containers/:id/stop
 * @api public
 */

Container.prototype.stop = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts = {};
  if ('object' !== typeof opts) opts = { t: opts };

  var ns = 'container:stop';
  var url = '/containers/' + this.id + '/stop';
  var req = this.remote.request('post', url);
  req.query(opts);
  req.expectCode = 204;

  debug('(%s) #%s %j', ns, this.id, opts);
  macro.request(ns, req, cb);

  return this;
};

/**
 * #### .restart([opts,] cb)
 *
 * Stop the container. Default option is `t`.
 *
 * @param {Object} options (querystring)
 * @param {Function} callback
 * @cb {Error|null}
 * @http POST /containers/:id/restart
 * @api public
 */

Container.prototype.restart = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts = {};
  if ('object' !== typeof opts) opts = { t: opts };

  var ns = 'container:restart';
  var url = '/containers/' + this.id + '/restart';
  var req = this.remote.request('post', url);
  req.query(opts);
  req.expectCode = 204;

  debug('(%s) #%s %j', ns, this.id, opts);
  macro.request(ns, req, cb);

  return this;
};

/**
 * #### .kill(cb)
 *
 * Kill the container.
 *
 * @param {Function} callback
 * @cb {Error|null}
 * @http POST /containers/:id/kill
 * @api public
 */

Container.prototype.kill = function(cb) {
  var ns = 'container:kill';
  var url = '/containers/' + this.id + '/kill';
  var req = this.remote.request('post', url);
  req.expectCode = 204;

  debug('(%s) #%s', ns, this.id);
  macro.request(ns, req, cb);

  return this;
};

/**
 * #### .wait(cb)
 *
 * Wait for container to stop and respond with exit code.
 *
 * @param {Function} callback
 * @cb {Error|null}
 * @cb {Object} response
 * @hook container:wait
 * @http POST /containers/:id/wait
 * @api public
 */

Container.prototype.wait = function(cb) {
  var ns = 'container:wait';
  var hook = this.remote.prepareHook(ns, cb);
  var url = '/containers/' + this.id + '/wait';
  var req = this.remote.request('post', url);

  debug('(%s) #%s', ns, this.id);
  macro.request(ns, req, hook);

  return this;
};

/**
 * #### .remove([opts,] cb)
 *
 * Remove the container. Default option is `v`.
 *
 * @param {Object} options (optional)
 * @param {Function} callback
 * @cb {Error|null}
 * @http DELETE /containers/:id
 * @api public
 */

Container.prototype.remove = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts = {};
  if ('boolean' === typeof opts) opts = { v: opts };

  var ns = 'container:remove';
  var url = '/containers/' + this.id;
  var req = this.remote.request('delete', url);
  req.query(opts);
  req.expectCode = 204;

  debug('(%s) #%s %j', ns, this.id, opts);
  macro.request(ns, req, cb);

  return this;
};

/**
 * #### .top([opts,] cb)
 *
 * Remove the container. Default option is `ps_args`.
 *
 * @param {Object} options (optional)
 * @param {Function} callback
 * @cb {Error|null}
 * @cb {Object} response
 * @hook container:top
 * @http GET /containers/:id/top
 * @api public
 */

Container.prototype.top = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts= '';

  var ns = 'container:top';
  var hook = this.remote.prepareHook(ns, cb);
  var url = '/containers/' + this.id + '/top';
  var req = this.remote.request('get', url);
  req.query({ ps_args: opts });

  debug('(%s) [%s] #%s', ns, opts, this.id);
  macro.request(ns, req, hook);

  return this;
};

/*
 * #### .changes(cb)
 *
 * View changes to a container's filesystem.
 *
 * @param {Function} callback
 * @cb {Error|null}
 * @cb {Object} response
 * @hook container:changes
 * @http GET /containers/:id/changes
 * @api public
 */

Container.prototype.changes = function(cb) {
  var ns = 'container:changes';
  var hook = this.remote.prepareHook(ns, cb);
  var url = '/containers/' + this.id + '/changes';
  var req = this.remote.request('get', url);

  debug('(%s) #%s', ns, this.id);
  macro.request(ns, req, hook);

  return this;
};

/*
 * #### .export()
 *
 * Export the container to `tar` archive.
 * This method returns a node.js readable stream.
 *
 * @return {ReadableStream} result
 * @http GET /containers/:id/export
 * @api public
 */

Container.prototype.export = function() {
  var ns = 'container:export';
  var url = '/containers/' + this.id + '/export';
  var req = this.remote.request('get', url);

  debug('(%s) #%s', ns, this.id);
  var stream = macro.stream(ns, req);

  return stream;
};

/*
 * #### .attach(opts)
 *
 * Attach to a container and download logs or
 * stream stdin/stdout/stderr. Invoke `stream.destroy()`
 * to stop downloading live logs.
 *
 * @param {Object} options
 * @return {ReadableStream} result
 * @http GET /containers/:id/attach
 * @api public
 */

Container.prototype.attach = function(opts) {
  opts = opts || {};

  var ns = 'container:attach';
  var url = '/containers/' + this.id + '/attach';
  var req = this.remote.request('post', url);
  req.query(opts);

  debug('(%s) #%s %j', ns, this.id, opts);
  var stream = macro.stream(ns, req);

  return stream;
};

/*
 * #### .copy(opts)
 *
 * Download a file or directory from the container.
 * Stream is a tar file. Default option is `resource`
 * relative to root of container.
 *
 * @param {Object} options
 * @return {ReadableStream} result (tar)
 * @http POST /containers/:id/copy
 * @api public
 */

Container.prototype.copy = function(opts) {
  if ('object' !== typeof opts) opts = { resource: opts };

  var ns = 'container:copy';
  var url = '/containers/' + this.id + '/copy';
  var req = this.remote.request('post', url);
  req.send(opts);

  debug('(%s) #%s %j', ns, this.id, opts);
  var stream = macro.stream(ns, req);

  return stream;
};
