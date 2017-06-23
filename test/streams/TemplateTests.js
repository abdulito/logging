var assert = require('assert')

var _ = require('lodash')
var sinon = require('sinon')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var o = require('@carbon-io/atom').o(module)
var testtube = require('@carbon-io/test-tube')

var carbonLog = require('../../lib')

__(function() {
  module.exports = o.main({
    _type: testtube.Test,
    name: 'TemplateStreamTests',
    tests: [
      o({
        _type: testtube.Test,
        name: 'SimpleTemplateWriteTest',
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          var logger = carbonLog.createLogger({
            name: 'foo',
            streams: [o({
              _type: carbonLog.streams.Template,
              stream: o({
                _type: carbonLog.streams.StringIO,
                raw: false
              })
            })]
          })
          logger.info('foo')
          assert.equal(logger.streams[0].stream._stream.getValue(), 'foo')
        }
      }),
      o({
        _type: testtube.Test,
        name: 'SimpleTemplateWriteCustomLogTemplateTest',
        setup: function() {
          this.sb = sinon.sandbox.create({
            useFakeTimers: true
          })
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          var logger = carbonLog.createLogger({
            name: 'foo',
            hostname: 'foo.bar',
            streams: [o({
              _type: carbonLog.streams.Template,
              level: 'INFO',
              template: '[{{time}}] <{{hostname}}> {{level}}: {{msg}}',
              formatters: {
                time: carbonLog.streams.Template.formatters.time.iso,
                level: carbonLog.streams.Template.formatters.level.name
              },
              stream: o({
                _type: carbonLog.streams.StringIO,
                raw: false
              })
            })]
          })
          logger.info({foo: 'hello', bar: 'world'}, '{{foo}} {{bar}}')
          assert.equal(
            logger.streams[0].stream._stream.getValue(), 
            '[1970-01-01T00:00:00.000Z] <foo.bar> INFO: hello world')
          this.sb.clock.tick(1000)
          logger.info({foo: 'hello', bar: 'world'}, '{{foo}} {{bar}}')
          assert.equal(
            logger.streams[0].stream._stream.getValue(), 
            '[1970-01-01T00:00:01.000Z] <foo.bar> INFO: hello world')
        }
      }),
      o({
        _type: testtube.Test,
        name: 'SimpleTemplateWriteCustomLogTemplateFormattersStringsTest',
        setup: function() {
          this.sb = sinon.sandbox.create({
            useFakeTimers: true
          })
        },
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          var logger = carbonLog.createLogger({
            name: 'foo',
            hostname: 'foo.bar',
            streams: [o({
              _type: carbonLog.streams.Template,
              level: 'INFO',
              template: '[{{time}}] <{{hostname}}> {{level}}: {{msg}}',
              formatters: {
                time: 'time.iso',
                level: 'level.name'
              },
              stream: o({
                _type: carbonLog.streams.StringIO,
                raw: false
              })
            })]
          })
          logger.info({foo: 'hello', bar: 'world'}, '{{foo}} {{bar}}')
          assert.equal(
            logger.streams[0].stream._stream.getValue(), 
            '[1970-01-01T00:00:00.000Z] <foo.bar> INFO: hello world')
          this.sb.clock.tick(1000)
          logger.info({foo: 'hello', bar: 'world'}, '{{foo}} {{bar}}')
          assert.equal(
            logger.streams[0].stream._stream.getValue(), 
            '[1970-01-01T00:00:01.000Z] <foo.bar> INFO: hello world')
        }
      }),
      o({
        _type: testtube.Test,
        name: 'SimpleTemplateCacheTest',
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          var logger = carbonLog.createLogger({
            name: 'foo',
            streams: [o({
              _type: carbonLog.streams.Template,
              cacheSize: 2,
              stream: o({
                _type: carbonLog.streams.StringIO,
                raw: false
              })
            })]
          })
          logger.info('foo')
          assert.equal(logger.streams[0].stream._cache.length, 1)
          logger.info('foo')
          assert.equal(logger.streams[0].stream._cache.length, 1)
          logger.info('bar')
          assert.equal(logger.streams[0].stream._cache.length, 2)
          logger.info('baz')
          assert.equal(logger.streams[0].stream._cache.length, 2)
          assert(_.isNil(logger.streams[0].stream._cache.get('foo')))
          assert(!_.isNil(logger.streams[0].stream._cache.get('bar')))
          assert(!_.isNil(logger.streams[0].stream._cache.get('baz')))
        }
      }),
    ]
  })
})

