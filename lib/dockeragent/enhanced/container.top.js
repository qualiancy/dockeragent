/*!
 * DockerAgent - hook - container:top
 * Copyright(c) 2013 Jake Luer <jake@datalabs.io>
 * MIT Licensed
 */

/**
 * #### container:top
 *
 * Reformats top results. Returns array
 * of processes which each line being an object
 * of column:value pairs.
 *
 * @param {Object} raw json
 * @param {Function} next
 * @hook `container:top`
 */

module.exports = function hookContainerTop(raw, next) {
  if (raw['Processes'] === null) return next(null, []);

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

  next(null, res);
};
