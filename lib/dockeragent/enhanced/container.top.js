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
