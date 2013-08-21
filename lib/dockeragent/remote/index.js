/*!
 * Module dependencies
 */

var debug = require('sherlock')('dockeragent:remote');
var facet = require('facet');
var merge = require('tea-merge');
var request = require('superagent');

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

function Remote() {
  if (!(this instanceof Remote)) return new Remote;
  this.disable('secure');
  this.set('host', 'localhost');
  this.set('port', 4243);
}

facet(Remote.prototype);

Remote.prototype.request = function(method, url) {
  var addr = this.enabled('secure') ? 'https://': 'http://';
  addr += this.get('host') + ':' + this.get('port') + url;
  method = method.toUpperCase();
  return request(method, addr);
}

/**
 * ### .version (cb)
 *
 * Retrieve the docker version(s).
 *
 * ```js
 * remote.version(function (err, info) {
 *   should.not.exist(err);
 *   info.should.have.property('Version');
 * });
 * ```
 *
 * @api GET /version
 * @param {Function} callback
 * @cb {Error|null}
 * @cb {Object} response json
 */

Remote.prototype.version = function(cb) {
  var ns = 'remote:version';
  var req = this.request('get', '/version');

  debug('(%s)', ns);
  macro.request(ns, req, cb);

  return this;
};

Remote.prototype.info = function (cb) {
  var ns = 'remote:info';
  var req = this.request('get', '/info');

  debug('(%s)', ns);
  macro.request(ns, req, cb);

  return this;
};

Remote.prototype.images = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts = {};
  if ('object' !== typeof opts) opts = { all: opts };

  var ns = 'images:list';
  var req = this.request('get', '/images/json').query(opts);

  debug('(%s) %j', ns, opts);
  macro.request(ns, req, cb);

  return this;
};

/**
 * ### .pull (opts[, cb])
 *
 * Create an image either by pulling from the
 * registry or by importing it.
 *
 * Method returns an EventEmitter to track
 * the status of of the "pull".
 *
 * ```js
 * var pull = remote.pull('busybox');
 *
 * pull.on('status', function (event) {
 *   var progress = event.progress ? ': ' + event.progress : '';
 *   console.log('%s%s', event.status, progress);
 * });
 *
 * pull.on('error', function (err) {
 *   console.error(err.message);
 * });
 *
 * pull.once('end', function () {
 *   console.log('Pull complete.');
 * });
 * ```
 *
 * Alternatively, a callback can be used.
 *
 * ```js
 * var pull = remote.pull('busybox', function (err) {
 *   if (err) return console.error(err.message);
 *   console.log('Pull complete.');
 * });
 *
 * pull.on('status', function (event) {
 *   var progress = event.progress ? ': ' + event.progress : '';
 *   console.log('%s%s', event.status, progress);
 * });
 * ```
 *
 * Options can either be a string or an object.
 * If it is a string it is assumed the `fromImage`
 * type of pull. Otherwise, specify the type as part
 * of the object according to the Docker documentation.
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
  var req = this.request('post', '/images/create').query(opts);

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

  var self = this;
  var ns = 'containers:create';
  var req = this.request('post', '/containers/create');

  req.expectCode = 201;
  req.send(opts);

  debug('(%s) %j', ns, opts);
  macro.request(ns, req, function(err, obj) {
    if (err) return cb(err);
    cb(null, new Container(self, obj.Id));
  });

  return this;
};

Remote.prototype.container = function (id) {
  return new Container(this, name);
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
