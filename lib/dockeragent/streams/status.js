var Transform = require('stream').Transform
  , inherits = require('util').inherits;

module.exports = JsonStream;

function JsonStream () {
  Transform.call(this);
  this._readableState.highWaterMark = 1;
  this._readableState.objectMode = true;
}

inherits(JsonStream, Transform);

JsonStream.prototype._transform = function (chunk, enc, next) {
  var json;

  try {
    json = JSON.parse(chunk.toString());
    console.log(json);
  } catch (ex) {
    return next(ex);
  }

  if (json) this.push(json);
  next();
};
