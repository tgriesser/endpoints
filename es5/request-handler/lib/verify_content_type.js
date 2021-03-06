'use strict';

exports.__esModule = true;

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _Kapow = require('kapow');

var _Kapow2 = _interopRequireDefault(_Kapow);

var EXPECTED_TYPE = 'application/vnd.api+json';

exports['default'] = function (request) {
  var err;

  var contentType = request.headers['content-type'];

  var isValidContentType = contentType && contentType.toLowerCase().indexOf(EXPECTED_TYPE) === 0;

  if (!isValidContentType) {
    err = _Kapow2['default'](415, 'Content-Type must be "' + EXPECTED_TYPE + '"');
  }

  return err;
};

module.exports = exports['default'];