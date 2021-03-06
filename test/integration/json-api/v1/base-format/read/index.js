import _ from 'lodash';
import {expect} from 'chai';

import Agent from '../../../../../app/agent';
import Fixture from '../../../../../app/fixture';

describe('read', function() {

  beforeEach(function() {
    return Fixture.reset();
  });

  describe('documentStructure', function() {

    describe('topLevel', function() {
      it('must respond to a successful request with an object and respond with 200 OK', function() {
        return Agent.request('GET', '/books/1')
          .promise()
          .then(function(res) {
            expect(res.status).to.equal(200);
            expect(res.body)
              // must place primary data under a top-level key named "data"
              .to.have.property('data')
                // must make primary data for a single record an object
                .that.is.a('object');
          });
      });

      it('must respond to an unsuccessful request with a JSON object', function() {
        return Fixture.dropTables()
          .then(function() {
            return Agent.request('GET', '/books/1')
              .promise();
          })
          .then(function(res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.be.an('object');
            expect(res.body.errors).to.be.an('array');
          });
      });

      it('must make primary data for multiple records an array and respond with 200 OK', function() {
        return Agent.request('GET', '/books')
          .promise()
          .then(function(res) {
            expect(res.status).to.equal(200);
            expect(res.body)
              .to.have.property('data')
                .that.is.a('array');
          });
      });
    });

    describe('resourceObjects', function() {

      describe('resourceAttributes', function() {
        it('must not contain a foreign key as an attribute', function() {
          return Agent.request('GET', '/books/1')
            .promise()
            .then(function(res) {
              var dataObj = res.body.data;
              expect(res.status).to.equal(200);
              expect(dataObj).to.be.an('object');
              expect(dataObj).to.not.have.property('author_id');
              expect(dataObj).to.not.have.property('series_id');
            });
        });

        it('must include relations as included resources', function() {
          return Agent.request('GET', '/books/1')
            .promise()
            .then(function(res) {
              var dataObj = res.body.data;
              expect(res.status).to.equal(200);
              expect(dataObj).to.be.an('object');
              expect(dataObj.links).to.have.property('author');
              expect(dataObj.links).to.have.property('series');
            });
        });
      });

      // TODO: DB/ORM test
      // describe('resourceIdentification', function() {
      //   it('must have a unique type and id pair');
      // });

      describe('resourceTypes', function() {
        it('must contain a type', function() {
          return Agent.request('GET', '/books/1')
            .promise()
            .then(function(res) {
              var dataObj = res.body.data;
              expect(res.status).to.equal(200);
              expect(dataObj)
                .to.have.property('type')
                  // must have a string value for type
                  .that.is.a('string');
            });
        });
      });

      describe('resourceIds', function() {
        it('must contain an id', function() {
          return Agent.request('GET', '/books/1')
            .promise()
            .then(function(res) {
              var dataObj = res.body.data;
              expect(res.status).to.equal(200);
              expect(dataObj)
                .to.have.property('id')
                  // must have a string value for type
                  .that.is.a('string');
            });
        });
      });

      describe('links', function() {
        it('must have an object as the value of any links key', function() {
          return Agent.request('GET', '/books/1')
            .promise()
            .then(function(res) {
              var dataObj = res.body.data;
              expect(res.status).to.equal(200);
              expect(dataObj)
                .to.have.property('links')
                  // must have a string value for type
                  .that.is.a('object');
            });
        });
      });

      describe('resourceURLs', function() {
        // OPTIONAL
        // A resource object **MAY** include a URL in its links object,
        // keyed by "self", that identifies the resource represented by
        // the resource object.
        it('may include a string in its links object keyed by "self"', function() {
          return Agent.request('GET', '/books/1')
            .promise()
            .then(function(res) {
              var dataObj = res.body.data;
              expect(res.status).to.equal(200);
              expect(dataObj.links)
                .to.have.property('self')
                  // must have a string value for type
                  .that.is.a('string');
            });
        });

        it('must set the value of "self" to a URL that identifies the resource represented by this object', function() {
          return Agent.request('GET', '/books/1')
            .promise()
            .then(function(res) {
              var dataObj = res.body.data;
              expect(res.status).to.equal(200);
              expect(dataObj.links.self).to.equal('/books/1');
            });
        });

      });

      describe('resourceRelationships', function() {
        // OPTIONAL
        // A resource object MAY contain references to other resource
        // objects ("relationships"). Relationships may be to-one or
        // to-many. Relationships can be specified by including a member
        // in a resource's links object.
        it('may contain references to related objects in the links object', function() {
          return Agent.request('GET', '/books/1')
            .promise()
            .then(function(res) {
              var links = res.body.data.links;
              expect(res.status).to.equal(200);
              expect(links).to.have.property('author');
              expect(links).to.have.property('series');
              expect(links).to.have.property('stores');
              expect(links).to.have.property('author.books');
            });
        });

        // https://github.com/json-api/json-api/commit/6b18a4685692ae260f0ef1e10522b81725f83219
        it('may include a related resource URL in its links object keyed by "related"', function() {
          return Agent.request('GET', '/books/1')
            .promise()
            .then(function(res) {
              var dataObj = res.body.data;
              expect(res.status).to.equal(200);
              expect(dataObj.links.chapters).to.have.property('related');
            });
        });

        it('may include a "linkage" member whose value represents "resource linkage"', function() {
          return Agent.request('GET', '/books/1?include=author')
            .promise()
            .then(function(res) {
              var dataObj = res.body.data;
              expect(res.status).to.equal(200);
              expect(dataObj.links.author).to.have.property('linkage');
            });
        });

        // TODO: unit test - Endpoints should throw if a model has a
        // relation named 'self'
        // it('shall not have a relationship to another object keyed as "self"');

        // The value of a relationship **MUST** be either a string URL
        // or a link object.
        //
        // Endpoints takes the view that to-many relationships may
        // contain numerous records. By default, it returns link objects
        // for to-one references and string URLs for to-many references.
        it('should make to-one references a link object', function() {
          return Agent.request('GET', '/books/1')
            .promise()
            .then(function(res) {
              var links = res.body.data.links;
              expect(res.status).to.equal(200);
              expect(links.author).to.be.an('Object');
              expect(links.series).to.be.an('Object');
            });
        });

        it('should make to-many references a link object', function() {
          return Agent.request('GET', '/books/1')
            .promise()
            .then(function(res) {
              var links = res.body.data.links;
              expect(res.status).to.equal(200);
              expect(links.stores).to.be.an('Object');
              expect(links['author.books']).to.be.an('Object');
            });
        });

        it('should return related resources as the response primary data when a to-One string URL is fetched', function() {
          return Agent.request('GET', '/books/1/author')
            .promise()
            .then(function(res) {
              var dataObj = res.body.data;
              expect(res.status).to.equal(200);
              expect(dataObj.id).to.equal('1');
              expect(dataObj.type).to.equal('authors');
            });
        });

        it('should return related resources as the response primary data when a to-Many string URL is fetched', function() {
          return Agent.request('GET', '/books/1/stores')
            .promise()
            .then(function(res) {
              var dataObj = res.body.data;
              expect(res.status).to.equal(200);
              expect(dataObj.length).to.equal(1);
              expect(dataObj[0].type).to.equal('stores');
            });
        });

        it('should return related resources as the response primary data when a nested string URL through a to-One is fetched', function() {
          return Agent.request('GET', '/chapters/1/book.author')
            .promise()
            .then(function(res) {
              var dataObj = res.body.data;
              expect(res.status).to.equal(200);
              expect(dataObj.id).to.equal('1');
              expect(dataObj.type).to.equal('authors');
            });
        });

        it('should return related resources as the response primary data when a nested string URL through a to-Many is fetched', function() {
          return Agent.request('GET', '/books/1/stores.books')
            .promise()
            .then(function(res) {
              var dataObj = res.body.data;
              expect(res.status).to.equal(200);
              expect(dataObj.length).to.equal(11);
              expect(dataObj[0].type).to.equal('books');
            });
        });

        // TODO: implement
        describe('stringURLRelationship', function() {
          it('must not change related URL even when the resource changes');
        });

        describe('linkObjectRelationship', function() {
          it('must contain either a "self," "related," "linkage", or "meta" property', function() {
            return Agent.request('GET', '/books/1')
              .promise()
              .then(function(res) {
                expect(res.status).to.equal(200);
                var dataObj = res.body.data;
                var includedAuthor = dataObj.links.author;
                var minProp =
                  includedAuthor.self ||
                  includedAuthor.related ||
                  includedAuthor.meta ||
                  includedAuthor.linkage;
                expect(minProp).to.exist;
              });
          });

          it('must include object linkage to resource objects included in the same compound document', function() {
            return Agent.request('GET', '/books/1?include=author')
              .promise()
              .then(function(res) {
                var dataObj = res.body.data;
                expect(res.status).to.equal(200);
                var includedAuthor = dataObj.links.author;

                expect(includedAuthor.linkage).to.exist;
              });
          });

          it('must express object linkages as type and id for all relationship types', function() {
            return Agent.request('GET', '/books/1?include=author,series')
              .promise()
              .then(function(res) {
                var dataObj = res.body.data;
                var links = dataObj.links;
                expect(res.status).to.equal(200);
                expect(links.author.linkage).to.have.property('type');
                expect(links.author.linkage).to.have.property('id');
                expect(links.series.linkage).to.have.property('type');
                expect(links.series.linkage).to.have.property('id');
              });
          });

          // We don't do heterogeneous to-many relationships
          // it('must express object linkages as a data member whose value is an array of objects containing type and id for heterogeneous to-many relationships');
        });
      });
    });

    describe('compoundDocuments', function() {
      // An endpoint **MAY** return resources included to the primary data
      // by default.
      //
      // Endpoints handles this by allowing the API implementer to set
      // default includes in the router. Endpoints will not include
      // included resources by default.
      //
      // An endpoint MAY also support custom inclusion of included
      // resources based upon an include request parameter.
      it('must include included resources as an array of resource objects in a top level `included` member', function() {
        return Agent.request('GET', '/books/1?include=author')
          .promise()
          .then(function(res) {
            var dataObj = res.body.data;
            expect(res.status).to.equal(200);
            var includedAuthorLinkage = dataObj.links.author.linkage;
            expect(res.body.included).to.be.a('array');
            expect(res.body.included[0].type).to.equal(includedAuthorLinkage.type);
            expect(res.body.included[0].id).to.equal(includedAuthorLinkage.id);
          });
      });

      it('must not include more than one resource object for each type and id pair', function() {
        return Agent.request('GET', '/books?include=author')
          .promise()
          .then(function(res) {
            expect(res.status).to.equal(200);
            expect(res.body.included.length).to.equal(2);
          });
      });
    });

    it('must not include other resource objects in the included section when the client specifies an include parameter', function() {
      return Agent.request('GET', '/books/1?include=series')
        .promise()
        .then(function(res) {
          expect(res.status).to.equal(200);
          var includedTypes = _.pluck(res.body.included, 'type');
          expect(includedTypes.indexOf('series')).to.equal(0);
          expect(includedTypes.length).to.equal(1);
        });
    });

    it('must have the identical relationship name as the key in the links section of the parent resource object', function() {
      return Agent.request('GET', '/books/1?include=author,series,stores,author.books')
        .promise()
        .then(function(res) {
          var linksTypes = Object.keys(res.body.data.links);
          expect(res.status).to.equal(200);
          expect(linksTypes.indexOf('author')).to.be.at.least(0);
          expect(linksTypes.indexOf('series')).to.be.at.least(0);
          expect(linksTypes.indexOf('stores')).to.be.at.least(0);
          expect(linksTypes.indexOf('author.books')).to.be.at.least(0);
        });
    });

    // TODO: Meta object not currently used by endpoints
    describe('metaInformation', function() {
      it('must be an object value');
    });

    describe('topLevelLinks', function() {
      it('should not include members other than self, resource, and pagination links if necessary');
    });
  });

  // These tests have been moved above to 'compoundDocuments'
  // describe('inclusionOfincludedResources', function() {
  // });

  describe('fetchingData', function() {

    it('must require an ACCEPT header specifying the JSON API media type', function() {
      return Agent.request('GET', '/books/1')
        .accept('')
        .promise()
        .then(function(res) {
          expect(res.status).to.equal(406);
        });
    });

    describe('fetchingResources', function() {
      it('must support fetching resource for URLs provided as a `self` link in a links object', function() {
        return Agent.request('GET', '/books/1')
          .promise()
          .then(function(res) {
            var links = res.body.data.links;
            expect(res.status).to.equal(200);
            return Agent.request('GET', links.chapters.self).promise();
          })
          .then(function(res) {
            expect(res.status).to.equal(200);
            expect(res.body.data.length).to.equal(22);
            expect(res.body.data[0]).to.have.property('id');
            expect(res.body.data[0]).to.have.property('type');
            expect(res.body.data[0]).to.not.have.property('title');
            expect(res.body.data[0]).to.not.have.property('ordering');
          });
      });

      it('must support fetching resource for URLs provided as a `related` link as part of a link object', function() {
        return Agent.request('GET', '/books/1')
          .promise()
          .then(function(res) {
            var links = res.body.data.links;
            expect(res.status).to.equal(200);
            return Agent.request('GET', links.chapters.related).promise();
          })
          .then(function(res) {
            expect(res.status).to.equal(200);
            expect(res.body.data.length).to.equal(22);
            expect(res.body.data[0]).to.have.property('id');
            expect(res.body.data[0]).to.have.property('type');
            expect(res.body.data[0]).to.have.property('title');
            expect(res.body.data[0]).to.have.property('ordering');
          });
      });

      describe('responses', function() {
        describe('200Ok', function() {
          // TESTED ABOVE under "Top Level"
          // it('must respond to a successful request to fetch an individual resource or collection with a 200 OK response');
          // it('must respond to a successful request to fetch a resource collection with an array as the document\'s primary data');
          it('must respond to a request to fetch a resource that does not exist with null as the document\'s primary data', function() {
            return Agent.request('GET', '/books/11/series')
              .promise()
              .then(function(res) {
                expect(res.status).to.equal(200);
                expect(res.body)
                  .to.have.property('data')
                    .that.is.null;
              });
          });
        });

        describe('404NotFound', function() {
          it('must return 404 Not Found when processing a request to fetch a resource that does not exist', function() {
            return Agent.request('GET', '/books/9999')
              .promise()
              .then(function(res) {
                expect(res.status).to.equal(404);
              });
          });
        });
      });
    });

    describe('fetchingRelationships', function() {
      it('must support fetching relationship data for every relationship URL provided as a self link as part of a link object with 200 OK', function() {
        return Agent.request('GET', '/books/1/links/author')
          .promise()
          .then(function(res) {
            var dataObj = res.body.data;
            var linksObj = res.body.links;
            expect(res.status).to.equal(200);
            expect(linksObj.self).to.equal('/books/1/links/author');
            expect(linksObj.related).to.equal('/books/1/author');
            expect(dataObj.type).to.equal('authors');
            expect(dataObj.id).to.equal('1');
          }
        );
      });

      describe('responses', function() {
        describe('200Ok', function() {
          // TESTED ABOVE
          // it('must respond to a successful request to fetch a relationship with a 200OK response');
          // it('must have a primary data consisting of null, an object of type and id members, an array');
        });

        describe('404NotFound', function() {
          it('must return 404 Not Found when processing a request to fetch a relationship URL that does not exist', function() {
            return Agent.request('GET', '/books/1/links/bees')
              .promise()
              .then(function(res) {
                expect(res.status).to.equal(404);
              }
            );
          });
        });
      });
    });

    describe('sparseFieldsets', function() {
      it('should support returning **only** specific fields in the response on a per-type basis by including a fields[TYPE] parameter', function() {
        return Agent.request('GET', '/books/?fields[books]=id,title')
          .promise()
          .then(function(res) {
            var dataObj = res.body.data[0];
            expect(dataObj).to.have.property('id');
            expect(dataObj).to.have.property('title');
            expect(dataObj).to.not.have.property('date_published');
          });
      });
    });

    describe('sorting', function() {
      it('should support requests to sort collections with a sort query parameter', function() {
        return Agent.request('GET', '/books/?sort=+title')
          .promise()
          .then(function(res) {
            expect(res.body.data[0].title).to.equal('Harry Potter and the Chamber of Secrets');
          });
      });

      // TODO: Support sorting by nested relations
      // https://github.com/endpoints/endpoints/issues/63
      it.skip('should support sorting by nested relationship attributes', function() {
        return Agent.request('GET', '/books/?sort=+author.name')
          .promise()
          .then(function(res) {
            expect(res.body.data[0].title).to.equal('Harry Potter and the Philosopher\'s Stone');
          });
      });

      it('should sort multiple criteria using comma-separated fields in the order specified', function() {
        return Agent.request('GET', '/books/?sort=-date_published,+title')
          .promise()
          .then(function(res) {
            expect(res.body.data[0].title).to.equal('Harry Potter and the Deathly Hallows');
          });
      });

      it('must sort ascending or descending based on explicit sort order using "+" or "-"', function() {
        return Agent.request('GET', '/books/?sort=-title')
          .promise()
          .then(function(res) {
            expect(res.body.data[0].title).to.equal('The Two Towers');
          });
      });
    });

    // TODO: Pagination
    describe('pagination', function() {
      it('should limit the number of resources returned in a response to a subset of the whole set available');
      it('should provide links to traverse a paginated data set');
      it('must put any pagination links on the object that corresponds to a collection');
      it('must only use "first," "last," "prev," and "next" as keys for pagination links');
      it('must omit or set values to null for links that are unavailable');
      it('must remain consistent with the sorting rules');
    });

    describe('filtering', function() {
      it('must only use the filter query parameter for filtering data', function() {
        return Agent.request('GET', '/books/?filter[date_published]=2000-07-08,1937-09-21')
          .promise()
          .then(function(res) {
            expect(res.body.data.length).to.equal(2);
            expect(res.body.data[0].id).to.equal('7');
            expect(res.body.data[1].id).to.equal('11');
          });
      });
    });
  });
});
