var assert = require('assert')

var _ = require('lodash')
var bunyan = require('bunyan')

var _o = require('@carbon-io/bond')._o(module)
var o = require('@carbon-io/atom').o(module)
var oo = require('@carbon-io/atom').oo(module)

var errors = require('./errors')

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
    
    this.config = undefined
  },

  /**
   *
   */
  _init: function() {
    if (_.isNil(this.config)) {
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
  },

  /**
   *
   */
  fatal: function() {
    return this._logger.fatal.apply(this._logger, arguments)
  },

  /**
   *
   */
  error: function() {
    return this._logger.error.apply(this._logger, arguments)
  },

  /**
   *
   */
  warn: function() {
    return this._logger.warn.apply(this._logger, arguments)
  },

  /**
   *
   */
  info: function() {
    return this._logger.info.apply(this._logger, arguments)
  },

  /**
   *
   */
  debug: function() {
    return this._logger.debug.apply(this._logger, arguments)
  },

  /**
   *
   */
  trace: function() {
    return this._logger.trace.apply(this._logger, arguments)
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
        return this._logger.serializers
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

  /**
   * @throws
   */
  child: function(name, config) {
    var _config = _.clone(this._config)
    _config.name = _config.name + '.' + name
    if (!_.isNil(config)) {
      _config = _.assignIn(_config, config)
    }
    
    var logger = o({
      _type: Logger,
      config: _config
    })
    this._logging._getLoggers()[_config.name] = logger
    return logger
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
