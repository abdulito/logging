// XXX: add semver check and warning
if (process.__carbonLog) {
  module.exports = process.__carbonLog
} else {
  module.exports = process.__carbonLog = require('./logging')
}
