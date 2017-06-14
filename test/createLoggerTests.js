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
    name: 'createLoggerTests',
    tests: [
      o({
        _type: testtube.Test,
        name: 'SimpleCreateLoggerTest',
        setup: function() {
          this.stream = new util.StringIO()
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          var logger = carbonLog.createLogger({
            name: 'foo',
            level: 'INFO',
            stream: this.stream
          })
          assert('foo' in carbonLog._getLoggers())
          assert(carbonLog._getLoggers()['foo'] instanceof carbonLog.Logger)
          logger.info('foo bar baz')
          var logRecords = this.stream.getValue()
          assert.equal(logRecords.length, 1)
          assert.equal(logRecords[0].name, 'foo')
          assert.equal(logRecords[0].msg, 'foo bar baz')
        }
      }),
      o({
        _type: testtube.Test,
        name: 'CreateLoggerMultipleStreamsTest',
        setup: function() {
          this.stream1 = new util.StringIO()
          this.stream2 = new util.StringIO()
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          var logger = carbonLog.createLogger({
            name: 'foo',
            streams: [
              {
                level: 'WARN',
                stream: this.stream1
              },
              {
                level: 'TRACE',
                stream: this.stream2
              },
            ]
          })
          logger.trace('foo')
          logger.debug('bar')
          logger.info('baz')
          logger.warn('foo')
          logger.error('bar')
          logger.fatal('baz')
          var logRecords1 = this.stream1.getValue()
          var logRecords2 = this.stream2.getValue()
          assert.equal(logRecords1.length, 3)
          assert.equal(logRecords2.length, 6)
          var msgs = ['foo', 'bar', 'baz']
          msgs.forEach(function(msg, index) {
            assert.equal(logRecords1[index].msg, msg)
          })
          msgs = ['foo', 'bar', 'baz', 'foo', 'bar', 'baz']
          msgs.forEach(function(msg, index) {
            assert.equal(logRecords2[index].msg, msg)
          })
        }
      }),
      o({
        _type: testtube.Test,
        name: 'CreateLoggerMultipleStreamsAndLoggerLevelTest',
        setup: function() {
          this.stream1 = new util.StringIO()
          this.stream2 = new util.StringIO()
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          var logger = carbonLog.createLogger({
            name: 'foo',
            level: 'ERROR',
            streams: [
              {
                level: 'WARN',
                stream: this.stream1
              },
              {
                level: 'TRACE',
                stream: this.stream2
              },
            ]
          })
          logger.trace('foo')
          logger.debug('bar')
          logger.info('baz')
          logger.warn('foo')
          logger.error('bar')
          logger.fatal('baz')
          var logRecords1 = this.stream1.getValue()
          var logRecords2 = this.stream2.getValue()
          assert.equal(logRecords1.length, 3)
          assert.equal(logRecords2.length, 6)
          var msgs = ['foo', 'bar', 'baz']
          msgs.forEach(function(msg, index) {
            assert.equal(logRecords1[index].msg, msg)
          })
          msgs = ['foo', 'bar', 'baz', 'foo', 'bar', 'baz']
          msgs.forEach(function(msg, index) {
            assert.equal(logRecords2[index].msg, msg)
          })
        }
      }),
      o({
        _type: testtube.Test,
        name: 'SimpleCreateLoggerTest',
        setup: function() {
          this.stream = new util.StringIO()
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          var logger1 = carbonLog.createLogger({
            name: 'foo',
            level: 'INFO',
            stream: this.stream
          })
          var logger2 = carbonLog.createLogger({
            name: 'bar',
            level: 'ERROR',
            stream: this.stream
          })
          var logger3 = carbonLog.createLogger({
            name: 'baz',
            level: 'FATAL',
            stream: this.stream
          })
          assert.equal(_.keys(carbonLog._getLoggers()).length, 3)
        }
      })
    ]
  })
})

