// FIXME: this needs to be destructured to support other api formats, or
// be moved wholesale into the request handler.

import _ from 'lodash';
import bPromise from 'bluebird';
import Kapow from 'kapow';

function sanitize (data) {
  delete data.type;
  delete data.links;
  return data;
}

export default function (model, params) {
  if (!params) {
    return bPromise.resolve({});
  }

  var relations = params.links;
  var toManyRels = [];

  if (relations) {
    return bPromise.reduce(Object.keys(relations), function(result, key) {
      if (!model.related(key)) {
        throw Kapow(404, 'Unable to find relation "' + key + '"');
      }

      var fkey;
      var relation = relations[key].linkage;
      var relatedData = model.related(key).relatedData;
      var relationType = relatedData.type;

      // toOne relations
      if (relationType === 'belongsTo' || relationType === 'hasOne') {
        fkey = relatedData.foreignKey;

        return relatedData.target.collection().query(function(qb) {
          if (relation === null) {
            return qb;
          }
          return qb.where({id:relation.id});
        }).fetchOne().then(function(model) {
          if (model === null) {
            throw Kapow(404, 'Unable to find relation "' + key + '" with id ' + relation.id);
          }
          params[fkey] = relation === null ? relation : relation.id;
          return params;
        });
      }

      // toMany relations
      if (relationType === 'belongsToMany' || relationType === 'hasMany') {
        return bPromise.map(relation, function(rel) {
          return relatedData.target.collection().query(function(qb) {
            return qb.where({id:rel.id});
          }).fetchOne().then(function(model) {
            if (model === null) {
              throw Kapow(404, 'Unable to find relation "' + key + '" with id ' + rel.id);
            }
            return params;
          });
        }).then(function() {
          toManyRels.push({
            name: key,
            id: _.pluck(relation, 'id')
          });
          return params;
        });
      }
    }, params).then(function(params) {
      return {
        data: sanitize(params),
        toManyRels: toManyRels
      };
    });
  }

  return bPromise.resolve({
    data: sanitize(params),
    toManyRels: toManyRels
  });

}
