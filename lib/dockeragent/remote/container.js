
var debug = require('sherlock')('dockeragent:remote-container');
var macro = require('./macros');

module.exports = Container;

function Container(remote, id) {
  if (!(this instanceof Container)) return new Container(remote, id);
  this.id = id;
  this.remote = remote;
}

Container.prototype.inspect = function(cb) {
  var ns = 'container:inspect';
  var hook = this.remote.prepareHook(ns, cb);
  var url = '/containers/' + this.id + '/json';
  var req = this.remote.request('get', url);

  debug('(%s) #%s', ns, this.id);
  macro.request(ns, req, hook);

  return this;
};

Container.prototype.start = function(opts, cb) {
  if ('function' === typeof opts) cb = opts, opts = {};

  var ns = 'container:start';
  var url = '/containers/' + this.id + '/start';
  var req = this.remote.request('post', url);
  req.query(opts);
  req.expectCode = 204;

  debug('(%s) #%s %j', ns, this.id, opts);
  macro.request(ns, req, cb);

  return this;
};

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

Container.prototype.kill = function(cb) {
  var ns = 'container:kill';
  var url = '/containers/' + this.id + '/kill';
  var req = this.remote.request('post', url);
  req.expectCode = 204;

  debug('(%s) #%s', ns, this.id);
  macro.request(ns, req, cb);

  return this;
};

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

Container.prototype.top = function(args, cb) {
  if ('function' === typeof args) cb = args, args = '';

  var ns = 'container:top';
  var hook = this.remote.prepareHook(ns, cb);
  var url = '/containers/' + this.id + '/top';
  var req = this.remote.request('get', url);
  req.query({ ps_args: args });

  debug('(%s) [%s] #%s', ns, args, this.id);
  macro.request(ns, req, hook);

  /*
  function(err, raw) {
    if (err) return cb(err);
    if (raw['Processes'] === null) return cb(null, []);

    var cols = raw['Titles'];
    var procs = raw['Processes'];
    var res = [];

    cols = cols.map(function(col) {
      return col.replace('%', '').toLowerCase();
    });

    procs.forEach(function(proc) {
      var obj = {};
      var i = 0;
      var key;

      for (; i < cols.length; i++) {
        key = cols[i];
        obj[key] = proc[i];
      }

      if (proc.length - 1 >= i) {
        for (; i < proc.length; i++) {
          obj[key] += ' ' + proc[i];
        }
      }

      res.push(obj);
    });

    cb(null, res);
  });
  */

  return this;
};

Container.prototype.changes = function(opts, cb) {

};
