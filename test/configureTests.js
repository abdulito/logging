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
    name: 'configureTests',
    tests: [
      o({
        _type: testtube.Test,
        name: 'SimpleConfigureTest',
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
          logger.info('foo')
          carbonLog.configure({
            'foo': {
              level: 'WARN'
            }
          })
          logger.info('bar')
          logger.warn('baz')
          var records = this.stream.getValue()
          assert.equal(records.length, 2)
          assert.equal(records[0].level, carbonLog.levels.INFO)
          assert.equal(records[1].level, carbonLog.levels.WARN)
        }
      }),
      o({
        _type: testtube.Test,
        name: 'SimpleConfigureTreeTest',
        setup: function() {
          this.stream1 = new util.StringIO()
          this.stream2 = new util.StringIO()
          this.stream3 = new util.StringIO()
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          var logger1 = carbonLog.createLogger({
            name: 'foo.bar',
            level: 'INFO',
            stream: this.stream1
          })
          var logger2 = carbonLog.createLogger({
            name: 'foo.yaz.baz',
            level: 'WARN',
            stream: this.stream2
          })
          var logger3 = carbonLog.createLogger({
            name: 'bar.foo',
            level: 'INFO',
            stream: this.stream3
          })
          logger1.info('foo')
          logger2.warn('bar')
          logger3.info('baz')
          carbonLog.configure({
            'foo.*': {
              level: 'ERROR'
            }
          })
          logger1.info('bar')
          logger2.warn('baz')
          logger1.error('bar')
          logger2.fatal('baz')
          logger3.info('baz')
          var records1 = this.stream1.getValue()
          var records2 = this.stream2.getValue()
          var records3 = this.stream3.getValue()
          assert.equal(records1.length, 2)
          assert.equal(records2.length, 2)
          assert.equal(records3.length, 2)
          assert.equal(records1[0].level, carbonLog.levels.INFO)
          assert.equal(records1[1].level, carbonLog.levels.ERROR)
          assert.equal(records2[0].level, carbonLog.levels.WARN)
          assert.equal(records2[1].level, carbonLog.levels.FATAL)
          assert.equal(records3[0].level, carbonLog.levels.INFO)
          assert.equal(records3[1].level, carbonLog.levels.INFO)
        }
      }),
      o({
        _type: testtube.Test,
        name: 'ConfigureTest',
        setup: function() {
          this.stream1 = new util.StringIO()
          this.stream2 = new util.StringIO()
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          var logger = carbonLog.createLogger({
            name: 'foo.bar',
            level: 'INFO',
            stream: this.stream1
          })
          logger.info('foo')
          carbonLog.configure({
            'foo.*': {
              level: 'ERROR',
              streams: [
                {
                  level: 'WARN',
                  stream: this.stream2
                }
              ]
            }
          })
          logger.info('bar')
          logger.warn('baz')
          logger.error('yaz')
          var records1 = this.stream1.getValue()
          var records2 = this.stream2.getValue()
          assert.equal(records1.length, 1)
          assert.equal(records2.length, 2)
          assert.equal(records1[0].level, carbonLog.levels.INFO)
          assert.equal(records2[0].level, carbonLog.levels.WARN)
          assert.equal(records2[1].level, carbonLog.levels.ERROR)
        }
      }),
      o({
        _type: testtube.Test,
        name: 'ConfigureTreeEmptyStringTest',
        setup: function() {
          this.stream1 = new util.StringIO()
          this.stream2 = new util.StringIO()
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          var logger1 = carbonLog.createLogger({
            name: 'foo.bar',
            level: 'INFO',
            stream: this.stream1
          })
          var logger2 = carbonLog.createLogger({
            name: 'foo.yaz.baz',
            level: 'WARN',
            stream: this.stream2
          })
          logger1.info('foo')
          logger2.warn('bar')
          carbonLog.configure({
            '': {
              level: 'ERROR'
            }
          })
          logger1.info('bar')
          logger2.warn('baz')
          logger1.error('bar')
          logger2.fatal('baz')
          var records1 = this.stream1.getValue()
          var records2 = this.stream2.getValue()
          assert.equal(records1.length, 2)
          assert.equal(records2.length, 2)
          assert.equal(records1[0].level, carbonLog.levels.INFO)
          assert.equal(records1[1].level, carbonLog.levels.ERROR)
          assert.equal(records2[0].level, carbonLog.levels.WARN)
          assert.equal(records2[1].level, carbonLog.levels.FATAL)
        }
      }),
      o({
        _type: testtube.Test,
        name: 'ConfigureTreeRootWildcardTest',
        setup: function() {
          this.stream1 = new util.StringIO()
          this.stream2 = new util.StringIO()
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          var logger1 = carbonLog.createLogger({
            name: 'foo.bar',
            level: 'INFO',
            stream: this.stream1
          })
          var logger2 = carbonLog.createLogger({
            name: 'foo.yaz.baz',
            level: 'WARN',
            stream: this.stream2
          })
          logger1.info('foo')
          logger2.warn('bar')
          carbonLog.configure({
            '*': {
              level: 'ERROR'
            }
          })
          logger1.info('bar')
          logger2.warn('baz')
          logger1.error('bar')
          logger2.fatal('baz')
          var records1 = this.stream1.getValue()
          var records2 = this.stream2.getValue()
          assert.equal(records1.length, 2)
          assert.equal(records2.length, 2)
          assert.equal(records1[0].level, carbonLog.levels.INFO)
          assert.equal(records1[1].level, carbonLog.levels.ERROR)
          assert.equal(records2[0].level, carbonLog.levels.WARN)
          assert.equal(records2[1].level, carbonLog.levels.FATAL)
        }
      }),
      o({
        _type: testtube.Test,
        name: 'ConfigureReplaceTest',
        setup: function() {
          this.stream1 = new util.StringIO()
          this.stream2 = new util.StringIO()
          this.stream3 = new util.StringIO()
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          carbonLog.configure({
            '*': {
              level: 'ERROR'
            }
          })
          var logger1 = carbonLog.createLogger({
            name: 'foo.bar',
            level: 'INFO',
            stream: this.stream1
          })
          var logger2 = carbonLog.createLogger({
            name: 'foo.yaz.baz',
            level: 'WARN',
            stream: this.stream2
          })
          logger1.info('foo')
          logger2.warn('bar')
          logger1.error('foo')
          logger2.fatal('bar')
          var config = {
            '*': {
              stream: this.stream3
            }
          }
          carbonLog.configure(config, true)
          // test configure does not mutate config parameter
          // XXX
          /*
          assert.deepEqual(config, {
            '*': {
              stream: this.stream3
            }
          })
          */
          assert.deepEqual(carbonLog._getConfig().loggers, {
            '*': {
              name: '*',
              stream: this.stream3
            }
          })
          logger1.info('bar')
          logger2.warn('baz')
          logger1.error('foo')
          logger2.fatal('bar')
          var records1 = this.stream1.getValue()
          var records2 = this.stream2.getValue()
          var records3 = this.stream3.getValue()
          assert.equal(records1.length, 1)
          assert.equal(records2.length, 1)
          assert.equal(records3.length, 4)
          assert.equal(records1[0].msg, 'foo')
          assert.equal(records2[0].msg, 'bar')
          assert.equal(records3[0].msg, 'bar')
          assert.equal(records3[1].msg, 'baz')
          assert.equal(records3[2].msg, 'foo')
          assert.equal(records3[3].msg, 'bar')
        }
      }),
    ]
  })
})


