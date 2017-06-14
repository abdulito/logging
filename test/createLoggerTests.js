var assert = require('assert')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var o = require('@carbon-io/atom').o(module)
var testtube = require('@carbon-io/test-tube')

var util = require('./util')

var carbonLog = require('../lib')

__(function() {
  module.exports = o.main({
    _type: testtube.Test,
    name: 'createLoggerTests',
    tests: [
      o({
        _type: testtube.Test,
        setup: function() {
          var stream = require('stream')
          this.stream = new util.StringIO()
        },
        doTest: function() {
          var logger = carbonLog.createLogger({
            name: 'foo',
            level: 'INFO',
            stream: this.stream
          })
          assert('foo' in carbonLog._loggers)
          assert(carbonLog._loggers['foo'] instanceof carbonLog.Logger)
          logger.info('foo bar baz')
          var logRecord = this.stream.getValue()
          assert.equal(logRecord.name, 'foo')
          assert.equal(logRecord.msg, 'foo bar baz')
        }
      })
    ]
  })
})

