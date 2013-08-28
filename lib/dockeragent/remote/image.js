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

function Image(remote, name) {
  if (!(this instanceof Image)) return new Image(remote, name);
  this.name = name;
  this.remote = remote;
}

Image.prototype.inspect = function(cb) {
  var ns = 'image:inspect';
  var url = '/images/' + this.name + '/json';
  var req = this.remote.request('get', url);

  debug('(%s) #%s', ns, this.name);
  macro.request(ns, req, cb);

  return this;
};

Image.prototype.remove = function(cb) {
  var ns = 'image:remove';
  var url = '/images/' + this.name;
  var req = this.remote.request('delete', url);

  debug('(%s) #%s', ns, this.name);
  macro.request(ns, req, cb);

  return this;
};
