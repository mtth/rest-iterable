/* jshint node: true, mocha: true */

(function () {
  'use strict';

  var express = require('express'),
      assert = require('assert'),
      http = require('http'),
      url = require('url'),
      Sieste = require('./');

  var port = 3456;

  describe('Sieste', function () {

    var server;

    before(function (done) {

      server = setupEndpoint(done);

    });

    after(function (done) {

      server.close(done);

    });

    it('Returns the first element by default.', function (done) {

      var iterable = new Iterable();

      iterable.reset({}, function (err, elem) {
        assert.equal(elem, 1);
        done();
      });

    });

    it('Returns the correct first element if specified.', function (done) {

      var iterable = new Iterable();

      iterable.reset({}, 1, function (err, elem) {
        assert.equal(elem, 2);
        done();
      });

    });

    it('Can be forward-iterated over.', function (done) {

      var iterable = new Iterable();

      iterable.reset({}, function () {
        iterable.next(function (err, elem) {
          assert.equal(elem, 2);
          done();
        });
      });

    });

    // Basic implementation.
    function Iterable() {

      Sieste.call(this);

      this._fetch = function (limit, offset, params, cb) {

        var loc = url.format({
          protocol: 'http',
          hostname: 'localhost',
          port: port,
          query: {limit: limit, offset: offset}
        });
        http.get(loc, function (res) {
          var data = '';
          var obj;
          res
            .on('data', function (chunk) { data += chunk; })
            .on('end', function () {
              try {
                obj = JSON.parse(data);
              } catch (err) {
                cb(err);
                return;
              }
              cb(null, obj);
            });
        });

      };

    }

  });

  // Helpers.

  function setupEndpoint(cb) {

    var app = express();
    app.get('/', function (req, res) {
      res.json([1,2,3]);
    });
    return app.listen(port, cb);

  }

})();
