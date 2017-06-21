var stream = require('stream')

var _ = require('lodash')

var oo = require('@carbon-io/atom').oo(module)

var Stream = oo({
  _C: function() {
    this.type = 'stream'
    this.name = undefined
    this.level = undefined
    this.stream = process.stderr
    this._stream = undefined
  },
  _init: function() {
    if (this.stream instanceof stream.Writable) {
      if(!this.stream.writable) {
        throw new TypeError('stream is not writable: ' + this.stream.toString())
      }
    } else {
      if (_.isNil(this.stream.write)) {
        throw new TypeError('stream has no write method: ' + this.stream.toString())
      }
    }
    // intercept call to write on this.stream
    this._stream = this.stream
    this.stream = this
  },
  // provide access to the underlying stream
  rawStream: {
    $property: {
      get: function() {
        return this._stream
      }
    }
  },
  write: function() {
    this._stream.write.apply(this._stream, arguments)
  }
})

module.exports = Stream
