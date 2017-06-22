var stream = require('stream')

var _ = require('lodash')

var oo = require('@carbon-io/atom').oo(module)

/*******************************************************************************
 * bunyan stream fields:
 *  - type
 *    - <file>
 *      - path -- type is implied
 *    - <stream>
 *      - stream -- type is implied
 *    - <rotating-file>
 *      - path -- type is not implied
 *      - period
 *      - count
 *    - <raw>
 *      - stream -- type is not implied
 *  - name
 *  - level
 *  - reemitErrorEvents
 *    - XXX
 */
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
    // bunyan makes a shallow copy of the stream object. setting stream to this
    // allows this instance to persist and to appropriately intercept writes to
    // the underlying stream
    Object.defineProperty(this, '_stream', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: this.stream
    })
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
