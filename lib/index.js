// XXX: add semver check and warning
if (process.__carbonLog) {
  modeul.exports = process.__carbonLog
} else {
  modeul.exports = process.__carbonLog = require('./logging')
}
