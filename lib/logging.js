var assert = require('assert')

var _ = require('lodash')
var bunyan = require('bunyan')

var _o = require('@carbon-io/bond')._o(module)
var o = require('@carbon-io/atom').o(module)

var Logger = require('./Logger')

// XXX: check for logging environment variable and call config if it exists?

/**
 * Predefined logging levels.
 *
 * @static
 */
var levels = {
  TRACE: bunyan.TRACE,
  DEBUG: bunyan.DEBUG,
  INFO: bunyan.INFO,
  WARN: bunyan.WARN,
  ERROR: bunyan.ERROR,
  FATAL: bunyan.FATAL,
}

/**
 * Map of logger names to logger instances.
 * @protected
 * @static
 */
var _loggers = {}


/**
 * Logger configuration object.
 *
 * Config precedence (highest to lowest):
 *  - Logger.*()
 *  - config()
 *  - createLogger()
 *  - basicConfig()
 *
 * @protected
 * @static
 * @property {object} loggers -- Logger configuration overlay (see 
 *                               precedence above)
 * @property {object} defaults -- Default namespaced logger configuration 
 *                                (basicConfig)
 */
var _config = {
  loggers: {
  },
  defaults: {
  }
}

/**
 * Internal function to get private `_loggers` isntance.
 *
 * @protected
 * @function _getLoggers
 */
function _getLoggers() {
  return _loggers
}

/**
 * Internal function to get private `_config` isntance.
 * 
 * @protected
 * @function _getConfig
 */
function _getConfig() {
  return _config
}

/**
 * Internal function to reset logging module state (used in tests).
 * 
 * @protected
 * @function _reset
 */
function _reset() {
  _loggers = {}
  _config = {
    loggers: {
    },
    defaults: {
    }
  }
  basicConfig('carbon-io', carbonioBasicConfig)
}

/**
 * Create a logger instance.
 *
 * If an instance with the same "name" exists, it will be returned and the
 * config will be ignored (XXX: may want to change these semantics).
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
 * @returns {carbonLog.Logger}
 * @throws
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
 * @function getLogger
 * @param {string} name -- The {@link carbonLog.Logger} name
 * @param {object} [config] -- See {@link createLogger}
 * @returns {carbonLog.Logger}
 * @throws
 */
function getLogger(name, config) {
  if (!_.isNil(_loggers[name])) {
    return _loggers[name]
  } else if (!_.isNil(config)) {
    if (!('name' in config)) {
      config = _.assignIn(_.clone(config), {name: name})
    }
    return createLogger(config)
  }
  return undefined
}

/**
 * Get a list of current loggers.
 *
 * @function getLoggerNames
 * @returns {string[]}
 */
function getLoggerNames() {
  return _.keys(_loggers)
}

/**
 * Validate logger configs.
 *
 * @protected
 * @function _validateLoggersConfig
 * @param {object} loggersConfig -- A map of logger names to configs.
 * @returns {object}
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
 *
 * @protected
 * @function _configLogger
 * @param {carbonLog.Logger} logger -- A logger instance.
 * @throws
 */
function _configLogger(logger) {
  logger.reconfig()
}

/**
 * Update logger instances to reflect the latest config.
 *
 * @protected
 * @function _configLoggers
 * @throws
 */
function _configLoggers() {
  for (var name in _loggers) {
    _configLogger(_loggers[name])
  }
}

/**
 * Set configuration that will be applied to any existing loggers and any 
 * new loggers.
 *
 * @function configure
 * @param {object} config -- Config object
 * @param {object} config.<name> -- Configuration to be applied a logger 
 *                                  matching a <name> or to a tree of loggers 
 *                                  using the "*" wildcard (only valid as the 
 *                                  last component in a name)
 * @param {boolean} replace -- Replace the configuration instead of merging
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
 * @param {string} namespace -- The namespace that this basicConfig will be
 *                              applied to (a namespace is simply a prefix in
 *                              the logger hierarchy, e.g., "foo.bar" would match
 *                              "foo.bar(.<name>)*").
 * @param {object} config -- See {@link carbonLog.createLogger}
 * @throws
 */
function basicConfig(namespace, config) {
  _config.defaults[namespace] = 
    _.omit(Logger._validateConfig(config, namespace), 'name')
}

/**
 * Basic config to be used across carbon-io modules.
 * 
 * @var carbonioBasicConfig
 */
var carbonioBasicConfig = {
  name: 'carbon-io',
  level: 'WARN',
  streams: [
    o({
      _type: './streams/Template',
      stream: process.stderr,
      template: '[{{{time}}}] <{{{hostname}}}> {{{level}}}:{{{name}}}: {{{msg}}}\n',
      formatters: {
        time: 'time.iso',
        level: 'level.name'
      }
    })
  ]
}
// XXX: do we want to do this here?
basicConfig('carbon-io', carbonioBasicConfig)

module.exports = {
  Logger: Logger,
  basicConfig: basicConfig,
  carbonioBasicConfig: carbonioBasicConfig,
  configure: configure,
  createLogger: createLogger,
  errors: _o('./errors'),
  getLogger: getLogger,
  getLoggerNames: getLoggerNames,
  levels: levels,
  serializers: _o('./serializers'),
  streams: _o('./streams'),
}

var protectedProps = [
  _getLoggers, 
  _getConfig, 
  _configLogger, 
  _configLoggers, 
  _reset
]

protectedProps.forEach(function(protectedProp) {
  Object.defineProperty(module.exports, protectedProp.name, {
    configurable: false,
    enumerable: false,
    value: protectedProp,
    writable: false
  })
})


