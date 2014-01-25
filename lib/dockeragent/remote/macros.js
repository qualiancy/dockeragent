/*!
 * DockerAgent - Remote Macros
 * Copyright(c) 2013 Jake Luer <jake@datalabs.io>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var debug = require('sherlock')('dockeragent:request');

var Readable = require('stream').Readable;
var Roundabout = require('roundabout');
var transmute = require('transmute');

var merge = require('tea-merge');
var request = require('request');

var noop = function() {};

exports.api = function(_spec) {
  return function() {
    var self = this.remote || this;
    var args = [].slice.call(arguments);
    var argv = {};
    var cb = 'function' === typeof args[args.length - 1] ? args.pop() : noop;
    var spec = merge({}, _spec);

    if (this.id) {
      spec.req.path = spec.req.path.replace('{id}', this.id);
    }

    if (spec.args) {
      Object.keys(spec.args).forEach(function(key, i) {
        argv[key] = merge({}, spec.args[key], args[i]);
      });
    }

    var req = exports.buildRequest(self, {}, spec.req.path);
    req.method = spec.req.method.toUpperCase();
    req.qs = spec.req.qs ? trim(argv[spec.req.qs]) : {};

    var type = spec.res && spec.res.type ? spec.res.type : null;

    if ('JSONStream' === type) {
      debug('creating json stream');
      return exports.createJSONStream(req, spec.res || {}, cb);
    } else {
      debug('creating request');
      exports.request(req, spec.res || {}, cb);
    }

    return this;
  }
};

exports.buildRequest = function(remote, opts, path) {
  switch (remote.get('mode')) {
    case 'socket':
      opts.socketPath = remote.get('socket');
      opts.path = path;
      opts.url = 'http://localhost' + path;
      break;
    case 'http':
      var addr = remote.enabled('secure') ? 'https://': 'http://';
      addr += remote.get('host') + ':' + remote.get('port') + path;
      opts.url = addr;
      break;
  }

  return opts;
}

/**
 * HTTP request/response pair implementation.
 *
 * @param {String} namespace
 * @param {Request} request
 * @param {Function} callback
 * @cb {Error|null} if error
 * @cb {Object|null} response (if present)
 * @api public
 */

exports.request = function (req, opts, cb) {
  var code = opts.statusCode || 200;

  // TODO: refactor
  function error (res) {
    var msg = res.text && res.text.length ? res.text : 'bad response';
    var err = new Error(msg);
    debug('error: %s', err.message);
    cb(err);
  }

  debug('> %s %s', req.method, req.url)
  request(req, function(err, res, body) {
    debug('< %d %s', res.statusCode, req.url);
    if (code !== res.statusCode) return error(res);

    if (res.body && res.body.length && 'object' !== typeof res.body) {
      var json = res.body;
      try { json = JSON.parse(json); }
      catch (ex) { return error(ex); }
      res.body = json;
    }

    if (!res.body) return cb(null);
    if ('object' === typeof res.body) {
      var keys = Object.keys(res.body);
      if (!keys.length) return cb(null);
      cb(null, res.body);
    }
  });
};

/**
 * Extension to streamable response that parses
 * each incoming chunk (line) as a JSON object.
 *
 * @param {String} namespace
 * @param {Request} request
 * @param {Function} callback (on error or end)
 * @return {EventEmitter}
 * @api public
 */

exports.createJSONStream = function(req, opts, cb) {
  var stat = transmute({
    readable: { objectMode: true, highWaterMark: 1 },
    transform: function(chunk, enc, next) {
      try { var json = JSON.parse(chunk.toString()); }
      catch (ex) { return cb(ex); }
      next(null, json);
    }
  });

  request(req).pipe(stat);

  var reader = new Readable().wrap(stat);
  reader._readableState.objectMode = true;
  reader._readableState.highWaterMark = 1;

  return reader;
};

function trim(obj) {
  var res = {};

  Object.keys(obj).forEach(function(key) {
    if (obj[key]) res[key] = obj[key];
  });

  return res;
}
