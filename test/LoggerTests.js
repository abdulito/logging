var assert = require('assert')
var util = require('util')

var _ = require('lodash')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var o = require('@carbon-io/atom').o(module)
var testtube = require('@carbon-io/test-tube')

var logging = require('../lib')

__(function() {
  module.exports = o.main({
    _type: testtube.Test,
    name: 'LoggerTests',
    tests: [
      o({
        _type: testtube.Test,
        name: 'LoggerChildTest',
        setup: function() {
          this.stream = new logging.streams.StringIO()
        },
        teardown: function() {
          logging._reset()
        },
        doTest: function() {
          assert.equal(_.keys(logging._getLoggers()).length, 0)
          var logger = logging.createLogger({
            name: 'foo',
            stream: this.stream
          })
          assert.equal(_.keys(logging._getLoggers()).length, 1)
          var childLogger = logger.child('bar')
          assert.equal(_.keys(logging._getLoggers()).length, 2)
          assert.deepEqual(
            _.keys(logging._getLoggers()).sort(),
            ['foo', 'foo.bar']
          )
          logger.info('foo')
          childLogger.info('foo.bar')
          var records = this.stream.getValue()
          assert.equal(records[0].name, 'foo')
          assert.equal(records[0].msg, 'foo')
          assert.equal(records[1].name, 'foo.bar')
          assert.equal(records[1].msg, 'foo.bar')
          var grandchildLogger = childLogger.child('baz')
          assert.equal(_.keys(logging._getLoggers()).length, 3)
          assert('foo.bar.baz' in logging._getLoggers())
          var siblingLogger = logger.child('baz')
          assert.equal(_.keys(logging._getLoggers()).length, 4)
          assert('foo.baz' in logging._getLoggers())
        }
      }),
      o({
        _type: testtube.Test,
        name: 'LoggerChildConfigTest',
        setup: function() {
          this.stream1 = new logging.streams.StringIO()
          this.stream2 = new logging.streams.StringIO()
        },
        teardown: function() {
          logging._reset()
        },
        doTest: function() {
          var logger = logging.createLogger({
            name: 'foo',
            level: 'INFO',
            stream: this.stream1
          })
          var childLogger = logger.child('bar', {
            level: 'WARN',
            streams: [{stream: this.stream2}]
          })
          logger.info('foo')
          logger.warn('bar')
          childLogger.info('baz')
          childLogger.warn('yaz')
          var records1 = this.stream1.getValue()
          var records2 = this.stream2.getValue()
          assert.equal(records1.length, 2)
          assert.equal(records2.length, 1)
        }
      }),
      o({
        _type: testtube.Test,
        name: 'LoggerTransientTest',
        setup: function() {
          this.stream = new logging.streams.StringIO()
        },
        teardown: function() {
          logging._reset()
        },
        doTest: function() {
          var logger = logging.createLogger({
            name: 'foo',
            level: 'INFO',
            stream: this.stream
          })
          assert.equal(logging.getLoggerNames().length, 1)
          var transientLogger = logger.transient({id: 1234})
          assert.equal(logging.getLoggerNames().length, 1)
          logger.info('foo')
          transientLogger.warn('bar')
          var records = this.stream.getValue()
          assert.equal(records.length, 2)
          assert(!('transient' in records[0]))
          assert.equal(records[0].msg, 'foo')
          assert('transient' in records[1])
          assert.equal(records[1].transient.id, 1234)
          assert.equal(records[1].msg, 'bar')
        }
      }),
      o({
        _type: testtube.Test,
        name: 'logObjectTest',
        setup: function() {
          this.stream = new logging.streams.StringIO()
          this.stream.raw = true
        },
        teardown: function() {
          logging._reset()
        },
        doTest: function() {
          var logger = logging.createLogger({
            name: 'foo',
            level: 'INFO',
            stream: this.stream
          })
          logger.info({foo: 'bar'})
          // test ejson serialization
          assert.equal(this.stream.getValue()[0].msg, '{"foo":"bar"}')
          function Foo() {
            this.foo = 'bar'
            this.bar = this
          }
          // test fallback to util.format('%j')
          logger.info(new Foo())
          assert.equal(this.stream.getValue()[0].msg, 'Foo { foo: \'bar\', bar: [Circular] }')
        }
      }),
      o({
        _type: testtube.Test,
        name: 'childNameUsingModuleTest',
        setup: function() {
          this.stream = new logging.streams.StringIO()
          this.stream.raw = true
        },
        teardown: function() {
          logging._reset()
        },
        doTest: function() {
          var logger = logging.createLogger({
            name: 'foo',
            level: 'INFO',
            stream: this.stream
          })
          var childLogger = logger.child(module)
          assert.equal(childLogger.name, 'foo.LoggerTests')
        }
      }),
      o({
        _type: testtube.Test,
        name: 'childNameUsingObjectTest',
        setup: function() {
          this.stream = new logging.streams.StringIO()
          this.stream.raw = true
        },
        teardown: function() {
          logging._reset()
        },
        doTest: function() {
          var logger = logging.createLogger({
            name: 'foo',
            level: 'INFO',
            stream: this.stream
          })
          function Foo() {
            this.foo = 'foo'
          }
          util.inherits(Foo, Object)
          var foo = new Foo()
          var childLogger = logger.child(new Foo())
          assert.equal(childLogger.name, 'foo.Foo')
        }
      }),
      o({
        _type: testtube.Test,
        name: 'instantiationViaParentObjTest',
        setup: function() {
          this.stream = new logging.streams.StringIO()
          this.stream.raw = true
        },
        teardown: function() {
          logging._reset()
        },
        doTest: function() {
          var parent = logging.createLogger({
            name: 'foo',
            level: 'INFO',
            stream: this.stream
          })
          var child = o({
            _type: logging.Logger,
            parent: parent,
            config: {
              name: 'bar',
              level: 'WARN'
            }
          })
          assert.equal(child.name, 'foo.bar')
          assert.equal(parent.streams[0].level, logging.levels.INFO)
          var grandchild = o({
            _type: logging.Logger,
            parent: child,
            config: {
              name: 'baz',
              level: 'ERROR'
            }
          })
          assert.equal(grandchild.name, 'foo.bar.baz')
          assert.equal(child.streams[0].level, logging.levels.WARN)

          grandchild.error('foo')
          assert.equal(this.stream.getValue()[0].msg, 'foo')
          grandchild.warn('foo')
          assert.equal(this.stream.getValue(), null)
          child.warn('foo')
          assert.equal(this.stream.getValue()[0].msg, 'foo')
          child.info('foo')
          assert.equal(this.stream.getValue(), null)
          parent.info('foo')
          assert.equal(this.stream.getValue()[0].msg, 'foo')
          parent.debug('foo')
          assert.equal(this.stream.getValue(), null)
        }
      }),
      o({
        _type: testtube.Test,
        name: 'instantiationViaParentNameTest',
        setup: function() {
          this.stream = new logging.streams.StringIO()
          this.stream.raw = true
        },
        teardown: function() {
          logging._reset()
        },
        doTest: function() {
          var parent = logging.createLogger({
            name: 'foo',
            level: 'INFO',
            stream: this.stream
          })
          var child = o({
            _type: logging.Logger,
            parent: 'foo',
            config: {
              name: 'bar',
              level: 'WARN'
            }
          })
          assert.equal(child.name, 'foo.bar')
          assert.equal(parent.streams[0].level, logging.levels.INFO)
          var grandchild = o({
            _type: logging.Logger,
            parent: 'foo.bar',
            config: {
              name: 'baz',
              level: 'ERROR'
            }
          })
          assert.equal(grandchild.name, 'foo.bar.baz')
          assert.equal(child.streams[0].level, logging.levels.WARN)

          grandchild.error('foo')
          assert.equal(this.stream.getValue()[0].msg, 'foo')
          grandchild.warn('foo')
          assert.equal(this.stream.getValue(), null)
          child.warn('foo')
          assert.equal(this.stream.getValue()[0].msg, 'foo')
          child.info('foo')
          assert.equal(this.stream.getValue(), null)
          parent.info('foo')
          assert.equal(this.stream.getValue()[0].msg, 'foo')
          parent.debug('foo')
          assert.equal(this.stream.getValue(), null)
        }
      }),
      o({
        _type: testtube.Test,
        name: 'instantiateParentViaChildTest',
        setup: function() {
          this.stream = new logging.streams.StringIO()
          this.stream.raw = true
        },
        teardown: function() {
          logging._reset()
        },
        doTest: function() {
          var child = o({
            _type: logging.Logger,
            parent: 'foo',
            config: {
              name: 'bar',
              level: 'WARN',
              stream: this.stream
            }
          })
          var parent = logging.getLogger('foo')
          assert.equal(child.name, 'foo.bar')
          assert.equal(parent.name, 'foo')
          assert.equal(parent.level(), logging.levels.WARN)
          assert.equal(parent.streams[0].level, logging.levels.WARN)
          parent.warn('foo')
          assert.equal(this.stream.getValue()[0].msg, 'foo')
        }
      }),
    ]
  })
})

