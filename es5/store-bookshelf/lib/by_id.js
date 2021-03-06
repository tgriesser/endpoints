'use strict';

exports.__esModule = true;

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports['default'] = byId;

var _Kapow = require('kapow');

var _Kapow2 = _interopRequireDefault(_Kapow);

function byId(model, id, relations) {
  return model.collection().query(function (qb) {
    return qb.where({ id: id });
  }).fetchOne({
    withRelated: relations
  })['catch'](TypeError, function (e) {
    // A TypeError here most likely signifies bad
    // relations passed into withRelated
    throw _Kapow2['default'](404, 'Unable to find relations');
  });
}

module.exports = exports['default'];