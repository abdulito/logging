var assert = require('assert')
var stream = require('stream')

var _ = require('lodash')
var handlebars = require('handlebars')

var oo = require('@carbon-io/atom').oo(module)

// XXX: use function constructor instead

var Template = oo({
  _C: function() {
    this.type = 'raw'
    this.template = '{{msg}}'
    this.level = undefined
    this.stream = process.stdout
    this._stream = undefined
    this._templateCache = {
    }
  },

  _init: function() {
    this.template = handlebars.compile(this.template)
    if (this.stream instanceof stream.Writable) {
      if(!this.stream.writable) {
        throw new TypeError('stream is not writable: ' + this.stream.toString())
      }
    } else {
      if (_.isNil(this.stream.write)) {
        throw new TypeError('stream has no write method: ' + this.stream.toString())
      }
    }
    this._stream = this.stream
    this.stream = this
  },

  write: function(rec) {
    // XXX: look for msgTemplate and render msg to that if present
    this._stream.write(this.template(rec))
  }
})

module.exports = Template
