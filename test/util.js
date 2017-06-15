var stream = require('stream')
var util = require('util')

var _ = require('lodash')

function StringIO() {
  stream.PassThrough.call(this)
}

util.inherits(StringIO, stream.PassThrough)

StringIO.prototype.getValue = function() {
  var records = this.read()
  if (records) {
    records = 
      '[' + 
      _.trimEnd(records.toString().split('\n').join(','), ',') + 
      ']'
    return JSON.parse(records)
  }
  return records
}

module.exports = {
  StringIO: StringIO
}
