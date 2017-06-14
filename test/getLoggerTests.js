var assert = require('assert')

var _ = require('lodash')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var o = require('@carbon-io/atom').o(module)
var testtube = require('@carbon-io/test-tube')

var util = require('./util')

var carbonLog = require('../lib')

__(function() {
  module.exports = o.main({
    _type: testtube.Test,
    name: 'getLoggerTests',
    tests: [
      o({
        _type: testtube.Test,
        name: 'SimpleGetLoggerTest',
        setup: function() {
          this.logger = carbonLog.createLogger({
            name: 'foo',
            level: 'INFO',
            stream: new util.StringIO()
          })
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          assert.equal(this.logger, carbonLog.getLogger('foo'))
        }
      }),
      o({
        _type: testtube.Test,
        name: 'SimpleGetLoggerCreateTest',
        setup: function() {
          this.stream = new util.StringIO()
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          var logger = carbonLog.getLogger('foo')
          assert(_.isNil(logger))
          assert.equal(_.keys(carbonLog._getLoggers()).length, 0)
          logger = carbonLog.getLogger('foo', {
            level: 'INFO',
            stream: this.stream
          })
          assert.equal(_.keys(carbonLog._getLoggers()).length, 1)
          assert('foo' in carbonLog._getLoggers())
        }
      })
    ]
  })
})
