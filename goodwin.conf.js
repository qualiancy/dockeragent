module.exports = function(config) {
  config.set({
    globals: {
      dockeragent: require('./index.js'),
      noErr: function(fn) {
        return function () {
          var args = [].slice.call(arguments);
          should.not.exist(args[0]);
          args.shift();
          if (!args.length) return fn();
          fn.apply(null, args);
        }
      }
    },
    tests: [
      'test/*.js'
    ]
  });
}
