Sieste
======

REST, lazily: transform any `(limit, offset)` resource interface into an
asynchronous iterable.


Installation
------------

```bash
$ npm install sieste
```


API
---

### new Sieste([opts])

+ `opts` {Object} Pre-fetching configuration. Two keys are available:
  `lowWaterMark` (number of cached items when to send a pre-fetch request) and
  `highWaterMark` (maximum number of items cached at one time in one
  direction).

Instantiate a new iterable. Note that this class shouldn't be instantiated
directly but first sub-classed to override the `_fetch` method (see below).

#### sieste.reset(params, [index], cb)

+ `params` {Object} Passed to `_fetch`.
+ `index` {Number} Optional start index.
+ `cb(err, item)` {Function}

#### sieste.next(cb)

+ `cb(err, item)` {Function}

Retrieve next element. Will be `null` if end of iterable.

#### sieste.prev(cb)

+ `cb(err, item)` {Function}

Retrieve previous element. Will be `null` if end of iterable.

#### sieste.\_fetch(limit, offset, params, cb)

+ `limit` {Number}
+ `offset` {Number}
+ `params` {Object} Passed from `reset`.
+ `cb(err, item)` {Function}

The function to be implemented. `Sieste` doesn't make any assumptions on how
your underlying resource is served and will simply take care of calling this
method appropriately (handling pre-fetching and caching for you).


Examples
--------

Sample implementations for a standard REST resource.

### jQuery AJAX

```javascript
// Assuming $ and Sieste available on the global object.

function AjaxIterable(opts) {

  Sieste.call(this, opts);

  this._fetch = function (limit, offset, params, cb) {

    $.ajax({
      url: params.protocol + '//' + params.hostname + '/' + params.pathname,
      data: {limit: limit, offset: offset},
      type: 'GET'
    }).done(function (data) { cb(null, data); })
    }).fail(function (xhr) { cb(xhr); });

  };

}
```

### node.js

```javascript
var http = require('http'),
    url = require('url'),
    Sieste = require('sieste');

function NodeIterable(opts) {

  Sieste.call(this, opts);

  this._fetch = function (limit, offset, params, cb) {

    var formattedUrl = url.format({
      protocol: 'http',
      hostname: params.hostname,
      port: params.port,
      pathname: params.pathname,
      query: {limit: limit, offset: offset}
    });
    http.get(formattedUrl, function (res) {
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
```
