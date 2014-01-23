/*!
 * DockerAgent - Remote
 * Copyright(c) 2013 Jake Luer <jake@datalabs.io>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var debug = require('sherlock')('dockeragent:remote');
var facet = require('facet');
var merge = require('tea-merge');
var url = require('url');

/*!
 * Local constructors
 */

var Container = require('./container');
var Image = require('./image');

/*!
 * Local dependencies
 */

var fixtures = require('./fixtures');
var macro = require('./macros');

/*!
 * Primary export
 */

module.exports = Remote;

/**
 * ### Remote(address)
 *
 * Create a new remote connection using
 * the provided host:port info.
 *
 * @param {String} address
 * @api publc
 * @return Remote
 */

function Remote(address) {
  if (!(this instanceof Remote)) return new Remote(address);
  address = address || '/var/run/docker.sock';

  if (!~address.indexOf('http') && address.indexOf('/') === 0) {
    this.set('mode', 'socket');
    this.set('socket', address);
  } else if (~address.indexOf('http')) {
    this.set('mode', 'http');
    this.set('address', address);
  } else {
    throw new Error('Invalid docker address');
  }

  this.hooks = {};
}

/**
 * #### Configuration
 *
 * - `host` _{String}_ http host
 * - `port` _{Number}_ http port number
 * - `secure` _{Boolean}_ use `https`
 * - `username` _{String}_ http auth username (optional)
 * - `password` _{String}_ http auth password (optional)
 */

facet(Remote.prototype);

/**
 * #### .hook(ns, fn)
 *
 * A hook can be added to any response
 * which returns static JSON data. It is
 * used to reformat the data anytime that
 * method is invoked.
 *
 * @param {String} namespace
 * @param {Function} hook
 * @api public
 * @return this
 */

Remote.prototype.hook = function(ns, fn) {
  ns = ns.toLowerCase().trim().replace(/\s/g, ':');

  if ('function' === typeof fn) {
    debug('(hook:add) %s #%s', ns, fn.name || 'unnamed hook');
    this.hooks[ns] = fn;
  } else {
    debug('(hook:remove) -%s', ns);
    delete this.hooks[ns];
  }

  return this;
};

/*!
 * Lookup a hook for a given namespace
 * and invoke it. Pass results onto given
 * callback. Only used internally.
 *
 * @param {String} namespace
 * @param {Function} callback
 * @api private
 */

Remote.prototype._hook = function(ns, cb) {
  ns = ns.toLowerCase().trim().replace(/\s/g, ':');
  cb = cb || function() {};
  var fn = this.hooks[ns] || null;

  return function runHook(err, raw) {
    if (err) return cb(err);
    if (!fn) return cb(null, raw);
    debug('(hook:run) %s', ns);
    fn(raw, function(err, res) {
      if (err) return cb(err);
      cb(null, res);
    });
  }
};

/*!
 * Prepare a request object based on config.
 *
 * @param {String} http method
 * @param {String} url
 * @return Request
 * @api private
 */

Remote.prototype.request = function(method, url) {
  var opts = {};

  opts.method = method.toUpperCase();
  opts.qs = {};

  switch (this.get('mode')) {
    case 'socket':
      opts.socketPath = this.get('socket');
      opts.path = url;
      opts.url = 'http://localhost' + url;
      break;
    case 'http':
      var addr = this.enabled('secure') ? 'https://': 'http://';
      addr += this.get('host') + ':' + this.get('port') + url;
      opts.url = addr;
      break;
  }

  return opts;
};

/**
 * #### .version(cb)
 *
 * Retrieve the docker version(s).
 *
 * @param {Function} callback
 * @cb {Error|null}
 * @cb {Object} response json
 * @api GET /version
 * @hook system:version
 */

Remote.prototype.version = function(cb) {
  var ns = 'system:version';
  var hook = this._hook(ns, cb);
  var req = this.request('get', '/version');

  debug('(%s)', ns);
  macro.request(ns, req, hook);

  return this;
};

/**
 * #### .info(cb)
 *
 * Retrieve the docker system infomation.
 *
 * @param {Function} cb
 * @cb {Error|null}
 * @cb {Object} response json
 * @api GET /info
 * @hook system:info
 */

Remote.prototype.info = function (cb) {
  var ns = 'system:info';
  var hook = this._hook(ns, cb);
  var req = this.request('get', '/info');

  debug('(%s)', ns);
  macro.request(ns, req, hook);

  return this;
};

/**
 * #### .images(opts, cb)
 *
 * Retrieve a list of all available images.
 *
 * @param {Function} cb
 * @cb {Error|null}
 * @cb {Object} response json
 * @http GET /images/json
 * @hook images:list
 * @api public
 */

Remote.prototype.images = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts = {};
  if ('object' !== typeof opts) opts = { all: opts };

  var ns = 'images:list';
  var hook = this._hook(ns, cb);
  var req = this.request('get', '/images/json');
  req.query(opts);

  debug('(%s) %j', ns, opts);
  macro.request(ns, req, hook);

  return this;
};

/**
 * #### .pull (opts[, cb])
 *
 * Create an image either by pulling from the
 * registry or by importing it.
 *
 * @param {String|Object} options
 * @param {Function} callback (optional}
 * @return {EventEmitter} status listener
 * @event `error` on error
 * @event `status` on status line
 * @event `end` on finish w/o errors
 * @cb {Error|null} if error
 */

Remote.prototype.pull = function(opts, cb) {
  if ('string' === typeof opts) opts = { fromImage: opts };

  var ns = 'images:create';
  var req = this.request('post', '/images/create')
  req.query(opts);

  debug('(%s) %j', ns, opts);
  var emitter = macro.status(ns, req, cb);
  return emitter;
};

/**
 * #### .image(name)
 *
 * Chainable api for working with a single image.
 * It is expected that this image has already been
 * pulled into docker.
 *
 * @param {String} name
 * @return {Image}
 * @api public
 */

Remote.prototype.image = function(name) {
  return new Image(this, name);
};

/**
 * #### .create([opts,] cb)
 *
 * Create a new container based on the given options.
 *
 * @param {Object} options
 * @param {Function} callback
 * @cb {Error|null}
 * @cb {Object} response json
 * @http POST /containers/create
 * @hook container:create
 * @api public
 */

Remote.prototype.create = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts = {};
  opts = merge({}, fixtures.createContainer, opts || {});

  var ns = 'container:create';
  var hook = this._hook(ns, cb);
  var req = this.request('post', '/containers/create');

  req.expectCode = 201;
  req.send(opts);

  debug('(%s) %j', ns, opts);
  macro.request(ns, req, hook);

  return this;
};

/**
 * #### .containers([opts,] cb)
 *
 * List the containers available in this docker system.
 * Will default to only running containers. Use option `true`
 * to view all.
 *
 * @param {Object} options
 * @param {Function} callback
 * @cb {Error|null}
 * @cb {Object} response json
 * @http GET /containers/json
 * @hook containers:list
 * @api public
 */

Remote.prototype.containers = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts = {};
  if ('object' !== typeof opts) opts = { all: opts };

  var ns = 'containers:list';
  var hook = this._hook(ns, cb);
  var req = this.request('get', '/containers/json');
  req.query(opts);

  debug('(%s) %j', ns, opts);
  macro.request(ns, req, hook);

  return this;
};

/**
 * #### .container(id)
 *
 * Chainable api for working with a single container.
 * It is expected that this container has already been
 * created.
 *
 * @param {String} id
 * @return {Container}
 * @api public
 */

Remote.prototype.container = function(id) {
  return new Container(this, id);
};

/**
 * #### .events([opts,] cb)
 *
 * Attach to docker instance and recieve log
 * of events or streaming events. Returns `EventEmitter`;
 * close streaming connection with `emitter.destroy()`.
 *
 * @param {Object} options
 * @param {Function} callback
 * @return {EventEmitter} status stream
 * @api public
 */

Remote.prototype.events = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts = {};
  if ('object' !== typeof opts) opts = { since: opts };

  var ns = 'events';
  var req = this.request('get', '/events').query(opts);

  debug('(%s) %j', ns, opts);
  var emitter = macro.status(ns, req, cb);
  return emitter;
};
