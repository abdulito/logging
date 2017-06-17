var assert = require('assert')

var _ = require('lodash')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var o = require('@carbon-io/atom').o(module)
var testtube = require('@carbon-io/test-tube')

var carbonLog = require('../lib')

__(function() {
  module.exports = o.main({
    _type: testtube.Test,
    name: 'basicConfigTests',
    tests: [
      o({
        _type: testtube.Test,
        name: 'SimpleBasicConfigTest',
        setup: function() {
          this.stream = new carbonLog.streams.StringIO()
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          carbonLog.basicConfig('foo', {
            level: 'WARN',
            stream: this.stream
          })
          var logger1 = carbonLog.createLogger({
            name: 'foo.bar'
          })
          var logger2 = carbonLog.createLogger({
            name: 'bar.baz',
          })
          assert.equal(logger1.level(), carbonLog.levels.WARN)
          assert.equal(logger1.stream.stream, this.stream)
          assert.equal(logger2.level(), carbonLog.levels.INFO)
          assert(logger1.stream.stream != logger2.stream.stream)
        }
      }),
      o({
        _type: testtube.Test,
        name: 'SimpleBasicConfigWithConfigureTest',
        setup: function() {
          this.stream = new carbonLog.streams.StringIO()
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          carbonLog.basicConfig('', {
            level: 'WARN',
            stream: this.stream
          })
          var logger1 = carbonLog.createLogger({
            name: 'foo.bar'
          })
          var logger2 = carbonLog.createLogger({
            name: 'bar.baz',
          })
          var logger3 = carbonLog.createLogger({
            name: 'bar.yaz'
          })
          carbonLog.configure({
            'foo.*': {
              level: 'TRACE'
            },
            'bar': {
              level: 'DEBUG'
            },
            'bar.*': {
              level: 'INFO'
            },
            'bar.yaz': {
              // add exception to 'bar.*' overlay
            }
          })
          assert.equal(logger1.level(), carbonLog.levels.TRACE)
          assert.equal(logger2.level(), carbonLog.levels.INFO)
          assert.equal(logger3.level(), carbonLog.levels.WARN)
        }
      })
    ]
  })
})


