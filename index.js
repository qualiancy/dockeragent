module.exports = process.env.docker_COV
  ? require('./lib-cov/docker')
  : require('./lib/docker');
