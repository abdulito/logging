var util = require('util')

function CarbonLogError(message) {
  Error.captureStackTrace(this, CarbonLogError)
  this.name = this.constructor.name
  this.message = message
}

util.inherits(CarbonLogError, Error)

function CarbonLogConfigError(message) {
  Error.captureStackTrace(this, CarbonLogConfigError)
  this.name = this.constructor.name
  this.message = message
}

util.inherits(CarbonLogConfigError, CarbonLogError)

module.exports = {
  CarbonLogError: CarbonLogError
}
