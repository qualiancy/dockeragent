var debug = require('sherlock')('dockeragent:request');
var EventEmitter = require('events').EventEmitter;
var Readable = require('stream').Readable;

var StatusStream = require('../streams/status');

exports.request = function (ns, req, cb) {
  cb = cb || function () {};
  var code = req.expectCode || 200;

  function error (res) {
    var err = new Error('bad response');
    debug('(%s) error: %s', err.message);
    cb(err);
  }

  debug('(%s) > %s %s', ns, req.method, req.url)
  req.end(function (res) {
    debug('(%s) < %d %s', ns, res.status, req.url);
    if (code !== res.status) return error(res);
    cb(null, res.body);
  });
};

exports.status = function (ns, req, cb) {
  var code = req.expectCode || 200;
  var emitter = new EventEmitter;
  var finished = false

  if (cb && 'function' === typeof cb) {
    emitter.once('end', cb);
  }

  function parse () {
    var event = this.read();
    if (!event) return;

    if (event.error) {
      debug('(%s) [parse] error: %s', ns, event.error);
      var err = new Error(event.error);
      done(err);
    } else if (event.status) {
      debug('(%s) [parse] status: %j', ns, event);
      emitter.emit('status', event);
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

  debug('(%s) > %s %s', ns, req.method, req.url)
  req.buffer(false);
  req.end(function (_res) {
    var res = new Readable().wrap(_res);
    console.log(_res);
    debug('(%s) < %d %s', ns, _res.status, req.url);
    if (code === _res.status) {
      var status = new StatusStream;
      status.on('readable', parse);
      status.on('error', done);
      status.once('end', done);
      res.pipe(status);
    } else {
      var err = '';
      res.on('readable', function () { err += (res.read() || ''); });
      res.once('end', function () { done(new Error(err)) });
    }
  });

  return emitter;
};
