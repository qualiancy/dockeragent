module.exports = function(remote) {
  remote.addHook('container:top', require('./container.top'));
  return remote;
};
