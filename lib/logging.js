var assert = require('assert')

var _ = require('lodash')
var bunyan = require('bunyan')

var _o = require('@carbon-io/bond')._o(module)
var o = require('@carbon-io/atom').o(module)

var Logger = require('./Logger')

// XXX: check for logging environment variable and call config if it exists?

/**
 *
 */
var _loggers = {}


/**
 * Logger configuration object.
 *
 * Config precedence (highest to lowest):
 *  - Logger.*()
 *  - config()
 *  - basicConfig()
 *  - createLogger()
 *
 * @property {object} loggers -- Logger configuration to be laid over 
 *                               programmatic configuration
 * @property {object} defaults -- Default namespaced logger configuration 
 */
var _config = {
  loggers: {
  },
  defaults: {
  }
}

/**
 *
 */
function _getLoggers() {
  return _loggers
}

/**
 *
 */
function _getConfig() {
  return _config
}

/**
 *
 */
function _reset() {
  _loggers = {}
  _config = {
    loggers: {
    },
    defaults: {
    }
  }
}

/**
 * Create a logger instance.
 *
 * @function createLogger
 * @param {object} config -- The logger config.
 * @param {string} config.name -- Logger name
 * @param {level name or number} [config.level] -- 
 * @param {node.js stream} [config.stream] -- 
 * @param {Object[]} [config.streams] --
 * @param {node.js stream} [config.streams[]] --
 * @param {serializers mapping} [config.serializers] -- 
 * @param {boolean} [config.src] -- 
 */
function createLogger(config) {
  if (_.isNil(_loggers[config.name])) {
    _loggers[config.name] = o({
      _type: Logger,
      config: config
    })
  }
  return _loggers[config.name]
}

/**
 * Get a logger instance.
 *
 * If config is provided and a logger with "name" does not exist, it will be 
 * created and returned.
 *
 * XXX: should this return the existing logger with "name" even if config is
 *      passed and fall back to createLogger only if it doesn't exist?
 *
 * @function getLogger
 * @param {string} name --
 * @param {object} [config] -- See {@link createLogger}
 * @returns
 * @throws
 */
function getLogger(name, config) {
  if (!_.isNil(config)) {
    if (!('name' in config)) {
      config.name = name
    }
    return createLogger(config)
  }
  return _loggers[name]
}

/**
 * Get a list of current loggers.
 *
 * @function getLoggerNames
 * @returns
 */
function getLoggerNames() {
  return _.keys(_loggers)
}

/**
 * Validate logger configs.
 * @throws
 */
function _validateLoggersConfig(loggersConfig) {
  for (var name in loggersConfig) {
    loggersConfig[name] = Logger._validateConfig(loggersConfig[name], name)
  }
  return loggersConfig
}

/**
 * Update a logger instance to reflect the latest config.
 * @throws
 */
function _configLogger(logger) {
  logger.reconfig()
}

/**
 * Update logger instances to reflect the latest config.
 * @throws
 */
function _configLoggers() {
  for (var name in _loggers) {
    _configLogger(_loggers[name])
  }
}

/**
 * Set configuration that will be applied to any existing loggers and any new loggers.
 *
 * @param {object} config -- Config object
 * @param {object} config.<fully qualified name> -- Configuration to be applied
 *                                                  individual loggers matching 
 *                                                  <fully qualified name> or to
 *                                                  a tree of loggers using the *
 *                                                  wildcard (only valid as the
 *                                                  last component in a namespace)
 * @param {boolean} replace -- replace the configuration instead of merging
 * @throws
 */
function configure(loggersConfig, replace) {
  _validateLoggersConfig(loggersConfig)  
  if (replace) {
    _config.loggers = loggersConfig
  } else {
    _.assignIn(_config.loggers, loggersConfig)
  }
  _configLoggers()
}

/**
 * Add basic config template for any new loggers falling under this namespace.
 *
 * @param {string} namespace -- the namespace that this basicConfig will be
 *                              applied to
 * @param {object} config -- see {@link createLogger}
 * @throws
 */
function basicConfig(namespace, config) {
  _config.defaults[namespace] = _validateConfig(config, namespace)
  return _config.defaults[namespace]
}

var levels = {
  TRACE: bunyan.TRACE,
  DEBUG: bunyan.DEBIG,
  INFO: bunyan.INFO,
  WARN: bunyan.WARN,
  ERROR: bunyan.ERROR,
  FATAL: bunyan.FATAL,
}

module.exports = {
  createLogger: createLogger,
  getLogger: getLogger,
  getLoggerNames: getLoggerNames,
  configure: configure,
  basicConfig: basicConfig,
  Logger: Logger,
  levels: levels,
  errors: _o('./errors'),
  _getLoggers: _getLoggers,
  _getConfig: _getConfig,
  _configLogger: _configLogger,
  _configLoggers: _configLoggers,
  _reset: _reset
}
