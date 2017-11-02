var assert = require('assert')
var util = require('util')

var _ = require('lodash')
var bunyan = require('bunyan')

var _o = require('@carbon-io/bond')._o(module)
var ejson = require('@carbon-io/ejson')
var o = require('@carbon-io/atom').o(module)
var oo = require('@carbon-io/atom').oo(module)

var errors = require('./errors')
var lutil = require('./util')

/**
 * core fields:
 *  - v
 *  - level
 *  - name
 *  - hostname
 *  - pid
 *  - time
 *  - msg
 *  - src
 *
 * XXX: what about event emitter interface?
 * XXX: add mode to ensure single line output?
 */
var Logger = oo({
  /**
   *
   */
  _C: function() {
    this._logger = undefined
    this._config = undefined
    this._mergedConfig = undefined

    this._logging = _o('./logging')
    // XXX: expose this
    this._inspectDepth = 2

    this.config = undefined
    this.parent = undefined
  },

  /**
   *
   */
  _init: function() {
    if (_.isNil(this.config)) {
      // {name: '...'} is the bare minimum requirement
      throw new errors.CarbonLogError('Logger requires a config')
    }
    this._config = this.config
    Object.defineProperty(this, 'config', {
      configurable: false,
      enumerable: true,
      get: function() {
        return this._config
      }
    })
    this.reconfig()
  },

  /**
   *
   */
  name: {
    $property: {
      get: function() {
        return this._config.name
      }
    }
  },

  /**
   *
   */
  addSerializers: function() {
    this._logger.addSerializers.apply(this._logger, arguments)
  },

  /**
   *
   */
  addStream: function() {
    this._logger.addStream.apply(this._logger, arguments)
  },

  /**
   * caveat: if the "stream" shortcut is present in this._config and config
   *         contains "streams", "stream" will be omitted from the merged
   *         config
   * @throws
   */
  reconfig: function(config) {
    if (_.isNil(config)) {
      config = this._config
    }
    config = _.clone(config)
    if (_.isNil(config.name)) {
      config.name = this._config.name
    }
    config.name = lutil.getName(config.name)
    this.parent = this._parent(this.parent, config)
    var childName = undefined
    if (!_.isNil(this.parent) &&
        !config.name.startsWith(this.parent.name + '.')) {
      // if parent is present and this.name is not prefixed by parent.name
      // then update this.name to reflect the hierarchy
      config.name = this.parent.name + '.' + config.name
      config = _.assignIn({}, this.parent.config, config)
    }
    var match = function(name, map_, prefixMatch) {
      var match_ = undefined
      var matchLength = 0
      var matchTree = undefined
      var key_ = key
      for (var key in map_) {
        key_ = key
        matchTree = key.endsWith('.*') || key === '*' || key === ''
        if (matchTree) {
          key = key.slice(0, key.length - 2)
        }
        matchTree = matchTree ? matchTree : prefixMatch
        if (matchTree && name.startsWith(key) && name != key || name === key) {
          if (_.isNil(match_) || key.length > matchLength) {
            match_ = key_
            matchLength = key.length
          }
        }
      }
      return match_
    }
    var defaultsKey = match(
      config.name, this._logging._getConfig().defaults, true)
    var loggersKey = match(
      config.name, this._logging._getConfig().loggers)
    var mergedConfig = _.assignIn(
      _.omit(_.get(this._logging._getConfig().defaults, defaultsKey, {}), 'name'),
      _.clone(config),
      _.omit(_.get(this._logging._getConfig().loggers, loggersKey, {}), 'name'))
    if ('stream' in config && 'streams' in mergedConfig) {
      delete mergedConfig.stream
    } else if ('streams' in config && 'stream' in mergedConfig) {
      delete mergedConfig.streams
    }
    if (_.isEqual(this._mergedConfig, mergedConfig)) {
      return
    }
    this._config = config
    this._mergedConfig = mergedConfig
    Logger._validateConfig(this._mergedConfig)
    this._logger = bunyan.createLogger(this._mergedConfig)
    if (!_.isNil(this.parent) &&
        !(this._config.name in this._logging._getLoggers())) {
      // if parent, then update registry
      this._logging._getLoggers()[this._config.name] = this
    }
  },

  /*
   * calling styles:
   *  - log(obj)
   *    - pretty print obj and stuff in "msg"
   *    - stuff obj in the underlying record under "data"
   *  - log(obj, str)
   *    - merge str in obj as msg
   *    - if a Template stream is present, it will render str using obj
   *      as context
   *  - log(str)
   *    - stuff str in "msg"
   *  - log(str, ...)
   *    - str will be formatted via util.format and stuffed in "msg"
   */

  /**
   *
   */
  _args: function(args) {
    args = Array.prototype.slice.call(args)
    try {
      if (_.isString(args[0])) {
        if (args.length > 1) {
          // log(str, <arg>, ...)
          args = [util.format.apply(undefined, args)]
        } // else log(str)
      } else if (args.length === 1 && args[0] instanceof Error) {
        // bunyan should handle errors passed as the first argument gracefully,
        // so just pass on
      } else if (_.isObjectLike(args[0])) {
        if (_.keys(args[0]).length != 1 || _.isNil(args[0]['data'])) {
          args[0] = {data: args[0]}
        }
        if (args.length > 1) {
          // log(obj, str)
          if (args.length != 2) {
            throw new TypeError(
              util.format('Invalid call signature (expected: [obj, str]): %j', args))
          }
        } else {
          try {
            args[0] = ejson.stringify(args[0].data)
          } catch (e) {
            args[0] = util.inspect(args[0].data, {depth: this._inspectDepth})
          }
        }
      } else {
        throw new TypeError(util.format('Unrecognized first argument: %j', args[0]))
      }
    } catch (e) {
      // XXX: bunyan should handle this gracefully, but do something different
      //      here
      this.error(e)
    }
    return args
  },

  /**
   *
   */
  fatal: function() {
    return this._logger.fatal.apply(this._logger, this._args(arguments))
  },

  /**
   *
   */
  error: function() {
    return this._logger.error.apply(this._logger, this._args(arguments))
  },

  /**
   *
   */
  warn: function() {
    return this._logger.warn.apply(this._logger, this._args(arguments))
  },

  /**
   *
   */
  info: function() {
    return this._logger.info.apply(this._logger, this._args(arguments))
  },

  /**
   *
   */
  debug: function() {
    return this._logger.debug.apply(this._logger, this._args(arguments))
  },

  /**
   *
   */
  trace: function() {
    return this._logger.trace.apply(this._logger, this._args(arguments))
  },

  /**
   *
   */
  level: function() {
    return this._logger.level.apply(this._logger, arguments)
  },

  /**
   *
   */
  levels: function() {
    return this._logger.levels.apply(this._logger, arguments)
  },

  /**
   *
   */
  stream: {
    $property: {
      get: function() {
        return this.streams.length > 0 ? this.streams[0] : undefined
      }
    }
  },

  /**
   *
   */
  streams: {
    $property: {
      get: function() {
        return this._logger.streams
      }
    }
  },

  /**
   *
   */
  serializers: {
    $property: {
      get: function() {
        return this._logger.serializers
      }
    }
  },

  /**
   *
   */
  src: {
    $property: {
      get: function() {
        return this._logger.src
      },
      set: function(src) {
        this.src = src
      }
    }
  },

  /**
   *
   */
  fields: {
    $property: {
      get: function() {
        return this._logger.fields
      }
    }
  },

  _parent: function(parent, config) {
    if (_.isNil(parent) || parent instanceof Logger) {
      return parent
    }
    config = _.omit(config, 'name')
    return this._logging.getLogger(parent, config)
  },

  /**
   * @throws
   */
  child: function(name, config) {
    var _config = _.clone(this._config)
    name = lutil.getName(name)
    _config.name = _config.name + '.' + name
    if (!_.isNil(config)) {
      _config = _.assignIn(_config, config)
    }
    var child = this._logging.getLogger(_config.name, _config)
    child.parent = this
    return child
  },

  /**
   *
   */
  transient: function(fields) {
    return this._logger.child({transient: fields})
  }
})

/**
 * Validate logger config.
 * @static
 * @protected
 * @function _validateConfig
 * @returns {object}
 * @throws
 */
Logger._validateConfig = function(config, name) {
  // XXX: fully implement me
  if (!_.isUndefined(name)) {
    if (_.isNil(config.name)) {
      config = _.clone(config)
      config.name = name
    } else {
      assert.equal(config.name, name)
    }
  }
  assert(!_.isNil(config.name))
  return config
}

module.exports = Logger
