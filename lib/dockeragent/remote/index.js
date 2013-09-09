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
var request = require('superagent');
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
  address = address || 'http://localhost:4243';

  if (!~address.indexOf('http')) {
    address = 'http://' + address;
  }

  var parsed = url.parse(address);
  this.set('host', parsed.hostname);
  this.set('port', parsed.port ? parseFloat(parsed.port) : 4243);
  this.set('secure', parsed.protocol === 'https:');

  if (parsed.auth) {
    var auth = parsed.auth.split(':');
    this.set('username', auth[0]);
    this.set('password', auth[1]);
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
  var addr = this.enabled('secure') ? 'https://': 'http://';
  addr += this.get('host') + ':' + this.get('port') + url;
  method = method.toUpperCase();
  return request(method, addr);
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
 * @api GET /images/json
 * @hook images:list
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
 * ### .pull (opts[, cb])
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

Remote.prototype.image = function(name) {
  return new Image(this, name);
};

Remote.prototype.create = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts = {};
  opts = merge({}, fixtures.createContainer, opts || {});

  var ns = 'containers:create';
  var hook = this._hook(ns, cb);
  var req = this.request('post', '/containers/create');

  req.expectCode = 201;
  req.send(opts);

  debug('(%s) %j', ns, opts);
  macro.request(ns, req, hook);

  return this;
};

Remote.prototype.containers = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts = {};
  if ('object' !== typeof opts) opts = { all: opts };

  var ns = 'coantiners:list';
  var hook = this._hook(ns, cb);
  var req = this.request('get', '/containers/json');
  req.query(opts);

  debug('(%s) %j', ns, opts);
  macro.request(ns, req, hook);

  return this;
};

Remote.prototype.container = function(id) {
  return new Container(this, id);
};

Remote.prototype.events = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts = {};
  if ('object' !== typeof opts) opts = { since: opts };

  var ns = 'events';
  var req = this.request('get', '/events').query(opts);

  debug('(%s) %j', ns, opts);
  var emitter = macro.status(ns, req, cb);
  return emitter;
};
