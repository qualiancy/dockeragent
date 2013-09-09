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

facet(Remote.prototype);

Remote.prototype.addHook = function(ns, fn) {
  ns = ns.toLowerCase().trim().replace(/\s/g, ':');
  debug('(hook:add) %s #%s', ns, fn.name || 'unnamed hook');
  this.hooks[ns] = fn;
  return this;
};

Remote.prototype.removeHook = function(ns) {
  ns = ns.toLowerCase().trim().replace(/\s/g, ':');
  debug('(hook:remove) -%s', ns);
  this.hooks[ns] = null;
  return this;
};

Remote.prototype.prepareHook = function(ns, cb) {
  ns = ns.toLowerCase().trim().replace(/\s/g, ':');
  cb = cb || function() {};
  var fn = this.hooks[ns] || null;

  return function runHook(err, res) {
    if (err) return cb(err);
    if (!fn) return cb(null, res);
    debug('(hook:run) %s', ns);
    fn(res, function(err, ret) {
      if (err) return cb(err);
      cb(null, ret);
    });
  }
};

Remote.prototype.request = function(method, url) {
  var addr = this.enabled('secure') ? 'https://': 'http://';
  addr += this.get('host') + ':' + this.get('port') + url;
  method = method.toUpperCase();
  return request(method, addr);
};

/**
 * ### .version (cb)
 *
 * Retrieve the docker version(s).
 *
 * @api GET /version
 * @param {Function} callback
 * @cb {Error|null}
 * @cb {Object} response json
 */

Remote.prototype.version = function(cb) {
  var ns = 'system:version';
  var hook = this.prepareHook(ns, cb);
  var req = this.request('get', '/version');

  debug('(%s)', ns);
  macro.request(ns, req, hook);

  return this;
};

Remote.prototype.info = function (cb) {
  var ns = 'system:info';
  var hook = this.prepareHook(ns, cb);
  var req = this.request('get', '/info');

  debug('(%s)', ns);
  macro.request(ns, req, hook);

  return this;
};

Remote.prototype.images = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts = {};
  if ('object' !== typeof opts) opts = { all: opts };

  var ns = 'images:list';
  var hook = this.prepareHook(ns, cb);
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
  var hook = this.prepareHook(ns, cb);
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
  var hook = this.prepareHook(ns, cb);
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
