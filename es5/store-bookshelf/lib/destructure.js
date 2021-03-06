'use strict';

exports.__esModule = true;

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

// FIXME: this needs to be destructured to support other api formats, or
// be moved wholesale into the request handler.

var _import = require('lodash');

var _import2 = _interopRequireDefault(_import);

var _bPromise = require('bluebird');

var _bPromise2 = _interopRequireDefault(_bPromise);

var _Kapow = require('kapow');

var _Kapow2 = _interopRequireDefault(_Kapow);

function sanitize(data) {
  delete data.type;
  delete data.links;
  return data;
}

exports['default'] = function (model, params) {
  if (!params) {
    return _bPromise2['default'].resolve({});
  }

  var relations = params.links;
  var toManyRels = [];

  if (relations) {
    return _bPromise2['default'].reduce(Object.keys(relations), function (result, key) {
      if (!model.related(key)) {
        throw _Kapow2['default'](404, 'Unable to find relation "' + key + '"');
      }

      var fkey;
      var relation = relations[key].linkage;
      var relatedData = model.related(key).relatedData;
      var relationType = relatedData.type;

      // toOne relations
      if (relationType === 'belongsTo' || relationType === 'hasOne') {
        fkey = relatedData.foreignKey;

        return relatedData.target.collection().query(function (qb) {
          if (relation === null) {
            return qb;
          }
          return qb.where({ id: relation.id });
        }).fetchOne().then(function (model) {
          if (model === null) {
            throw _Kapow2['default'](404, 'Unable to find relation "' + key + '" with id ' + relation.id);
          }
          params[fkey] = relation === null ? relation : relation.id;
          return params;
        });
      }

      // toMany relations
      if (relationType === 'belongsToMany' || relationType === 'hasMany') {
        return _bPromise2['default'].map(relation, function (rel) {
          return relatedData.target.collection().query(function (qb) {
            return qb.where({ id: rel.id });
          }).fetchOne().then(function (model) {
            if (model === null) {
              throw _Kapow2['default'](404, 'Unable to find relation "' + key + '" with id ' + rel.id);
            }
            return params;
          });
        }).then(function () {
          toManyRels.push({
            name: key,
            id: _import2['default'].pluck(relation, 'id')
          });
          return params;
        });
      }
    }, params).then(function (params) {
      return {
        data: sanitize(params),
        toManyRels: toManyRels
      };
    });
  }

  return _bPromise2['default'].resolve({
    data: sanitize(params),
    toManyRels: toManyRels
  });
};

module.exports = exports['default'];