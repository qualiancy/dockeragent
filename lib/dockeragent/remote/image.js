/*!
 * DockerAgent - Remote Image
 * Copyright(c) 2013 Jake Luer <jake@datalabs.io>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var debug = require('sherlock')('dockeragent:remote-image');

/*!
 * Local dependencies
 */

var macro = require('./macros');

/*!
 * Primary export
 */

module.exports = Image;

function Image(remote, id) {
  this.id = id;
  this.remote = remote;
}

Image.prototype.inspect = function(cb) {
  var ns = 'image:inspect';
  var hook = this.remote._hook(ns, cb);
  var url = '/images/' + this.id + '/json';
  var req = this.remote.request('get', url);

  debug('(%s) #%s', ns, this.id);
  macro.request(ns, req, hook);

  return this;
};

Image.prototype.remove = function(cb) {
  var ns = 'image:remove';
  var hook = this.remote._hook(ns, cb);
  var url = '/images/' + this.id;
  var req = this.remote.request('delete', url);

  debug('(%s) #%s', ns, this.id);
  macro.request(ns, req, hook);

  return this;
};

Image.prototype.history = function(cb) {
  var ns = 'image:history';
  var hook = this.remote._hook(ns, cb);
  var url = '/images/' + this.id + '/history';
  var req = this.remote.request('get', url);

  debug('(%s) #%s', ns, this.id);
  macro.request(ns, req, hook);

  return this;
};
