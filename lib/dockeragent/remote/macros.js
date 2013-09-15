/*!
 * DockerAgent - Remote Macros
 * Copyright(c) 2013 Jake Luer <jake@datalabs.io>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var debug = require('sherlock')('dockeragent:request');
var EventEmitter = require('events').EventEmitter;
var PassThrough = require('stream').PassThrough;
var Readable = require('stream').Readable;
var transmute = require('transmute');

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

exports.request = function (ns, req, cb) {
  cb = cb || function () {};
  var code = req.expectCode || 200;

  // TODO: refactor
  function error (res) {
    var msg = res.text && res.text.length ? res.text : 'bad response';
    var err = new Error(msg);
    debug('(%s) error: %s', ns, err.message);
    cb(err);
  }

  debug('(%s) > %s %s', ns, req.method, req.url)
  req.end(function (res) {
    debug('(%s) < %d %s', ns, res.status, req.url);
    if (code !== res.status) return error(res);

    // dotcloud/docker#1625
    if (res.text && res.text.length
    && res.header['content-type'] !== 'application/json') {
      var json = res.text;
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
 * Streamable response.
 *
 * @param {String} namespace
 * @param {Request} request
 * @return {String} readable
 * @api public
 */

exports.stream = function(ns, req) {
  var code = req.expectCode || 200;
  var finished = false;
  var stream = new PassThrough;

  function done(err) {
    if (finished) return;
    finished = true;
    stream.emit('error', err);
  }

  debug('(%s) > %s %s', ns, req.method, req.url)
  req.buffer(false);
  req.end(function(_res) {
    var res = new Readable().wrap(_res);
    debug('(%s) < %d %s', ns, _res.status, req.url);
    if (code === _res.status) {
      res.pipe(stream);
      // TODO: this is hackish
      stream.destroy = function () {
        _res.destroy();
      };
    } else {
      var err = '';
      res.on('readable', function() { err += (res.read() || ''); });
      res.once('end', function() { done(new Error(err)) });
    }
  });

  return stream;
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

exports.status = function (ns, req, cb) {
  var emitter = new EventEmitter;
  var finished = false

  if (cb && 'function' === typeof cb) {
    emitter.once('end', cb);
  }

  function parse () {
    var ev = this.read();
    if (!ev) return;

    if (ev.error) {
      debug('(%s) error: %s', ns, ev.error);
      var err = new Error(ev.error);
      done(err);
    } else if (ev.status) {
      debug('(%s) status: %s', ns, ev.status);
      emitter.emit('status', ev);
    }
  }

  function done (err) {
    if (finished) return;
    finished = true;

    if (err && cb && 'function' === typeof cb) {
      debug('(%s) [cb] error: %s', ns, err.message);
      cb(err);
    } else if (err) {
      debug('(%s) [emit] error: %s', ns, err.message);
      emitter.emit('error', err);
    } else {
      debug('(%s) [emit] end', ns);
      emitter.emit('end');
    }
  }

  var stream = exports.stream(ns, req);
  var stat = transmute({
      readable: { objectMode: true, highWaterMark: 1 }
    , transform: function(chunk, enc, cb) {
        try { var json = JSON.parse(chunk.toString()); }
        catch (ex) { return cb(ex); }
        cb(null, json);
      }
  });

  stream.pipe(stat);
  stat.on('readable', parse);
  stat.on('error', done);
  stat.on('end', done);

  return emitter;
};
