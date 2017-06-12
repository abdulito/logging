var _ = require('lodash')

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
 *  - Logger.set*()
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
 * Create a logger instance.
 *
 * @function createLogger
 * @param {object} [config] -- The logger config.
 * @param {string} [config.name] -- 
 * @param {level name or number} [config.level] -- 
 * @param {node.js stream} [config.stream] -- 
 * @param {Object[]} [config.streams] --
 * @param {node.js stream} config.streams[] --
 * @param {serializers mapping} config.serializers -- 
 * @param {boolean} config. src -- 
 */
function createLogger(config) {
  _validateLoggerConfig(config)
  return _loggers[config.name] ? _loggers[config.name] ? new Logger(config, _config)
}


/**
 * Get a logger instance.
 *
 * If config is provided and a logger with "name" does not exist, it will be 
 * created and returned.
 *
 * @function getLogger
 * @param {string} name --
 * @param {object} [config] -- See {@link createLogger}
 * @returns
 * @throws
 */
function getLogger(name, config) {
  if (!_.isUndefined(config)) {
    if (name != config.name) {
      throw new CarbonLogError(name + ' != ' + config.name)
    }
    return createLogger(name, config)
  }
  return _loggers[name]
}

/**
 * Validate logger config.
 * @throws
 */
function _validateLoggerConfig(config, name) {
  // XXX: fully implement me
  try {
  } catch (e) {
    // XXX: clean up error message
    throw new CarbonLogError(e.toString())
  }
  return config
}

/**
 * Validate logger configs.
 * @throws
 */
function _validateLoggersConfig(loggersConfig) {
  for (var name in loggersConfig) {
    if (!_.isUndefined(loggersConfig[name].name)) {
      loggersConfig[name].name = name
    }
    _validateLoggerConfig(loggersConfig[name])
  }
  return loggersConfig
}

/**
 * Update a logger instance to reflect the latest config.
 * @throws
 */
function _configLogger(logger) {
  logger.reconfig(logger, _config.loggers[logger.name])
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
 *                                                  loggers matching <fully
 *                                                  qualified name>
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
  _config.defaults[namespace] = _validateConfig(config)
}

module.exports = {
  createLogger: createLogger,
  getLogger: getLogger,
  getLoggers: getLoggers,
  config: config,
  basicConfig: basicConfig,
  _loggers: _loggers,
  _config: _config,
  _configLogger: _configLogger,
  _configLoggers: _configLoggers,
}
