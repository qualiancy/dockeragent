module.exports = function(remote) {
  remote.hook('container:top', require('./container.top'));
  return remote;
};
