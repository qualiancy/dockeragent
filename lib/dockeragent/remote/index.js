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

var macro = require('./macros');

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

var Remote = exports.Remote = function Remote(address) {
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
}

Remote.prototype = {

  constructor: Remote,

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

  version: macro.api({
    req: {
      method: 'GET',
      path: '/version'
    }
  }),

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

  info: macro.api({
    req: {
      method: 'GET',
      path: '/info'
    }
  }),

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

  pullStream: macro.api({
    args: {
      opts: {
        fromImage: null,
        fromSrc: null,
        repo: null,
        tag: null,
        registry: null
      }
    },
    req: {
      method: 'POST',
      path: '/images/create',
      qs: 'opts'
    },
    res: {
      type: 'JSONStream'
    }
  }),

  pull: function(opts, cb) {
    cb = cb || function() {};

    var stream = this.pullStream(opts);
    var id = null;

    stream.on('error', cb);

    stream.on('readable', function() {
      var line = this.read();
      if (!line) return;
      id = line.id;
    });

    stream.on('end', function() {
      cb(null, id);
    });

    return this;
  },

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

  images: macro.api({
    req: {
      method: 'GET',
      path: '/images/json'
    }
  }),

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

  image: function(name) {
    return new Image(this, name);
  },

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

  create: function(opts, cb) {
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
  },

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

  containers: function(opts, cb) {
    if ('function' === typeof opts) cb = opts, opts = {};
    if ('object' !== typeof opts) opts = { all: opts };

    var ns = 'containers:list';
    var hook = this._hook(ns, cb);
    var req = this.request('get', '/containers/json');
    req.query(opts);

    debug('(%s) %j', ns, opts);
    macro.request(ns, req, hook);

    return this;
  },

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

  container: function(id) {
    return new Container(this, id);
  },

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

  events: function(opts, cb) {
    if ('function' === typeof opts) cb = opts, opts = {};
    if ('object' !== typeof opts) opts = { since: opts };

    var ns = 'events';
    var req = this.request('get', '/events').query(opts);

    debug('(%s) %j', ns, opts);
    var emitter = macro.status(ns, req, cb);
    return emitter;
  }

}

function makeRequest(key) {
  return function() {
    var args = [].slice.call(arguments);
  }
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

