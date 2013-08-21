module.exports = process.env.docker_COV
  ? require('./lib-cov/dockeragent')
  : require('./lib/dockeragent');
