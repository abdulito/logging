var assert = require('assert')
var stream = require('stream')

var _ = require('lodash')
var handlebars = require('handlebars')
var lru = require('lru-cache')

var _o = require('@carbon-io/bond')._o(module)
var oo = require('@carbon-io/atom').oo(module)

// XXX: use function constructor instead

var Template = oo({
  _C: function() {
    // XXX: make type non-(writable/configurable)
    this.type = 'raw'
    this.template = '{{msg}}'
    this.level = undefined
    this.stream = process.stdout
    this.formatters = {}
    this.cacheSize = 50
    this._stream = undefined
    // XXX: should this be a static member?
    this._cache = undefined
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
    this._cache = lru(this.cacheSize)
  },

  _format: function(rec) {
    var original = {}
    for (var key in this.formatters) {
      original[key] = rec[key]
      var formatter = this.formatters[key]
      if (_.isString(formatter)) {
        formatter = _.get(Template.formatters, formatter, undefined)
        if (_.isNil(formatter)) {
          throw new TypeError('invalid formatter: ' + this.formatters[key])
        }
      }
      rec[key] = formatter(rec[key])
    }
    return original
  },

  _unformat: function(rec, original) {
    for (var key in original) {
      rec[key] = original[key]
    }
    return rec
  },

  write: function(rec) {
    var original = undefined
    var msg = rec.msg
    var template = this._cache.get(msg)
    if (_.isNil(template)) {
      template = handlebars.compile(msg)
      this._cache.set(msg, template)
    }
    try {
      rec.msg = template(rec)
      original = this._format(rec)
      this._stream.write(this.template(rec))
    } finally {
      rec.msg = msg
      rec = this._unformat(rec, original)
    }
  }
})

var _levelNames = undefined
function getLevelNames() {
  if (_.isNil(_levelNames)) {
    _levelNames = _.invert(_o('../logging').levels)
  }
  return _levelNames
}

Template.formatters = {
  time: {
    iso: function(time) {
      return time.toISOString()
    }
  },
  level: {
    name: function(level) {
      return _.get(getLevelNames(), level, level)
    }
  }
}

module.exports = Template
