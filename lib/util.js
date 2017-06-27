var Module = require('module')
var assert = require('assert')
var path = require('path')
var util = require('util')

var _ = require('lodash')

function getName(obj) {
  if (obj instanceof Module) {
    obj = path.basename(obj.filename).split('.')
    // XXX
    assert.equal(obj[obj.length - 1].toLowerCase(), 'js')
    obj = obj.slice(0, obj.length - 1).join('.')
  } else if (_.isObjectLike(obj)) {
    if(obj.constructor.name) {
      obj = obj.constructor.name
    }
  } else if (obj.name) {
    // should handle type function
    obj = obj.name
  }
  // XXX: es6 classes?
  if (!_.isString(obj) || obj.length === 0) {
    throw new TypeError('Invalid object used to determine name: ' + util.inspect(obj))
  }
  return obj
}

module.exports = {
  getName: getName
}
