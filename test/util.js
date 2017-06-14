var util = require('util')

var stream = require('stream')

function StringIO() {
  stream.PassThrough.call(this)
}

util.inherits(StringIO, stream.PassThrough)

StringIO.prototype.getValue = function() {
  return JSON.parse(this.read().toString())
}

module.exports = {
  StringIO: StringIO
}
