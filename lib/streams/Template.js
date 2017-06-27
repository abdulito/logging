var assert = require('assert')
var stream = require('stream')

var _ = require('lodash')
var handlebars = require('handlebars')
var lru = require('lru-cache')

var _o = require('@carbon-io/bond')._o(module)
var oo = require('@carbon-io/atom').oo(module)

var Stream = require('./Stream')

// XXX: use function constructor instead

var Template = oo({
  _type: Stream,

  _C: function() {
    Object.defineProperty(this, 'type', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: 'raw'
    })

    this.template = '{{{msg}}}'
    this.formatters = {
      time: 'time.iso',
      level: 'level.name'
    }
    this.cacheSize = 50
    this._cache = undefined
  },

  _init: function() {
    Stream.prototype._init.call(this)

    Object.defineProperty(this, 'template', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: handlebars.compile(this.template)
    })
    Object.defineProperty(this, 'formatters', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: this.formatters
    })
    Object.defineProperty(this, 'cacheSize', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: this.cacheSize
    })
    // XXX: should this be a static member?
    Object.defineProperty(this, '_cache', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: lru(this.cacheSize)
    })
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
    var template = function() {
      return msg
    }
    if ('data' in rec) {
      template = this._cache.get(msg)
      if (_.isNil(template)) {
        template = handlebars.compile(msg)
        this._cache.set(msg, template)
      }
    }
    try {
      rec.msg = template(rec.data)
      original = this._format(rec)
      Stream.prototype.write.call(this, this.template(rec))
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
      // get the name if it exists and return the custom level otherwise
      return _.get(getLevelNames(), level, level)
    }
  }
}

module.exports = Template
