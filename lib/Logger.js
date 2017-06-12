var bunyan = require('bunyan')

/**
 *
 */
class Logger {
  /**
   *
   */
  constructor(config, _config) {
    this._originalConfig = config

    this._config = undefined
    this._logger = undefined
  }

  /**
   *
   */
  reconfig(config) {
  }

  /**
   *
   */
  fatal() {
  }

  /**
   *
   */
  error() {
  }

  /**
   *
   */
  warn() {
  }

  /**
   *
   */
  info() {
  }

  /**
   *
   */
  debug() {
  }

  /**
   *
   */
  trace() {
  }

  /**
   *
   */
  level() {
  }

  /**
   *
   */
  levels() {
  }

  /**
   *
   */
  child(name) {
  }

  /**
   *
   */
  transient(id) {
    // call child on the underlying instance, but ignore hierarchy
    // keep a WeakMap of instances
  }
}
