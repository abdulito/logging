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
    var match = function(name, map_) {
      var match_ = undefined
      var matchLength = 0
      var matchTree = undefined
      var key_ = key
      for (var key in map_) {
        key_ = key
        matchTree = key.endsWith('.*')
        if (matchTree) {
          key = key.slice(0, key.length - 2)
        }
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
      config.name, this._logging._getConfig().defaults)
    var loggersKey = match(
      config.name, this._logging._getConfig().loggers)
    var mergedConfig = _.assignIn(
      _.clone(config), 
      _.omit(_.get(this._logging._getConfig().defaults, defaultsKey, {}), 'name'),
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
    this._logger.fatal.apply(this._logger, arguments)
  },

  /**
   *
   */
  error: function() {
    this._logger.error.apply(this._logger, arguments)
  },

  /**
   *
   */
  warn: function() {
    this._logger.warn.apply(this._logger, arguments)
  },

  /**
   *
   */
  info: function() {
    this._logger.info.apply(this._logger, arguments)
  },

  /**
   *
   */
  debug: function() {
    this._logger.debug.apply(this._logger, arguments)
  },

  /**
   *
   */
  trace: function() {
    this._logger.trace.apply(this._logger, arguments)
  },

  /**
   *
   */
  level: function() {
    this._logger.level.apply(this._logger, arguments)
  },

  /**
   *
   */
  levels: function() {
    this._logger.levels.apply(this._logger, arguments)
  },

  /**
   *
   */
  child: function(name) {
    var config = _.clone(this._config)
    config.name = config.name + '.' + name
    var logger = o({
      _type: Logger,
      config: config
    })
    this._logging._getLoggers()[config.name]
    return logger
  },

  /**
   *
   */
  transient: function(info) {
    return this._logger.child({transientLogger: info})
  }
})

/**
 * Validate logger config.
 * @throws
 */
Logger._validateConfig = function(config, name) {
  // XXX: use CarbonLogConfigError
  var assert = require('assert')
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
