var stream = require('stream')
var util = require('util')

var _ = require('lodash')

function StringIO(raw) {
  stream.PassThrough.call(this)
  this.raw = _.isNil(raw) ? true : raw
}

util.inherits(StringIO, stream.PassThrough)

StringIO.prototype.getValue = function() {
  var records = this.read()
  if (records) {
    try {
      if (this.raw) {
        records = 
          '[' + 
          _.trimEnd(records.toString().split('\n').join(','), ',') + 
          ']'
        records = JSON.parse(records)
      } else {
        records = records.toString()
      }
    } catch (e) {
      // XXX: do something smarter here
    }
  }
  return records
}

module.exports = StringIO
