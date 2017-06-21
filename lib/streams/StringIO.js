var stream = require('stream')

var _ = require('lodash')

var oo = require('@carbon-io/atom').oo(module)

var Stream = require('./Stream')

var StringIO = oo({
  _type: Stream,
  _C: function() {
    this.stream = new stream.PassThrough()
    this.raw = undefined
  },
  _init: function() {
    Stream.prototype._init.call(this)
    this.raw = _.isNil(this.raw) ? true : this.raw
  },
  getValue: function() {
    var records = this._stream.read()
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
})

module.exports = StringIO
