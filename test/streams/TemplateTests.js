var assert = require('assert')

var _ = require('lodash')

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
        name: 'SimpleLoggerWriteTest',
        teardown: function() {
          carbonLog._reset()
        },
        doTest: function() {
          var logger = carbonLog.createLogger({
            name: 'foo',
            streams: [o({
              _type: carbonLog.streams.Template,
              stream: new carbonLog.streams.StringIO()
            })]
          })
          logger.info('foo')
          assert.equal(logger.streams[0]._stream.getValue(), 'foo')
        }
      })
    ]
  })
})

