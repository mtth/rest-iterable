/* jshint browser: true, node: true */

(function (root) {
  'use strict';

  /**
   * Bidirectional lazy loader.
   *
   * This class exposes a very simple API (`reset`, `next`, and `prev`) via
   * which we can iterate (lazily and in both directions!) over a traditional
   * REST endpoint (with limit and offset parameters).
   *
   * @param `opts` Options to configure laziness and batch size.
   *
   */
  function Sieste(opts) {

    opts = opts || {};
    var _lowWaterMark = opts.lowWaterMark || 2;
    var _highWaterMark = opts.highWaterMark || 5;

    var self = this;
    var _exhausted = false;
    var _fetchingNext = false;
    var _fetchingPrev = false;
    var _fetchCb = null;
    var _data, _offset, _index, _params;

    /**
     * Change parameters.
     *
     * @param `params` Updated parameters. If unspecified, the viewer ID will
     * default to the same as the viewee. The index will default to 0 if
     * unspecified.
     * @param `index` Index to start from.
     * @param `cb(err, data)` Function called with the retrieved
     * element. This can be `null` if no element exists at this index.
     *
     */
    this.reset = function (params, index, cb) {

      if (typeof index == 'function' && !cb) {
        cb = index;
        index = null;
      }

      _params = params;
      _index = index || 0;
      _data = [];
      _offset = Math.max(0, _index - Math.floor(_highWaterMark / 2));
      _fetchingNext = _fetchingPrev = true;
      _fetchCb = function (err) {
        if (err) {
          cb(err);
          return;
        }
        if (_index < _data.length) {
          cb(null, _data[_index]);
        } else {
          cb(null, null);
        }
      };
      fetch(_offset, _offset + _highWaterMark);

    };

    /**
     * Get next element.
     *
     * @param `cb(err, elem)` Function called with the retrieved
     * element. The element will be `null` if out of bounds.
     *
     */
    this.next = function (cb) {

      if (_exhausted) {
        setTimeout(function () {
          cb(null, _index < _data.length - 1 ? _data[++_index] : null);
        }, 0);
      } else if (_index >= _data.length - 1) {
        // Out of data.
        fetchNext(function (err, n) {
          if (err) {
            cb(err);
            return;
          }
          cb(null, n ? _data[++_index] : null);
        });
      } else {
        // Pre-emptive fetch if necessary.
        if (++_index >= _data.length - _lowWaterMark) {
          fetchNext();
        }
        setTimeout(function () {
          cb(null, _data[_index]);
        }, 0);
      }

      function fetchNext(cb) {

        _fetchCb = cb;
        if (!_fetchingNext) {
          _fetchingNext = true;
          _fetchingPrev = false;
          fetch(_data.length, _index + _highWaterMark + 1);
        }

      }

    };

    /**
     * Get previous element.
     *
     * @param `cb(err, elem)` Function called with the retrieved
     * element. The element will be `null` if out of bounds.
     *
     */
    this.prev = function (cb) {

      if (!_index) {
        setTimeout(function () {
          cb(null, null);
        }, 0);
      } else if (_index <= _offset) {
        // Out of data.
        fetchPrev(function (err) {
          if (err) {
            cb(err);
            return;
          }
          cb(null, _data[--_index]);
        });
      } else {
        if (--_index < _offset + _lowWaterMark && _offset) {
          // Preemptive fetch.
          fetchPrev();
        }
        setTimeout(function () {
          cb(null, _data[_index]);
        }, 0);
      }

      function fetchPrev(cb) {

        _fetchCb = cb;
        if (!_fetchingPrev) {
          _fetchingNext = false;
          _fetchingPrev = true;
          fetch(Math.max(0, _index - _highWaterMark), _offset);
        }

      }

    };

    /**
     * Function to be overridden.
     *
     * This function will be called internally by the iterator. It is
     * guaranteed to be called at most once per direction at one time.
     *
     * @param `limit` Total of elements to fetch.
     * @param `offset` Start offset.
     * @param `params` Parameters passed to `reset`.
     * @param `cb(err, data)` Function to be called with the retrieved data,
     * (`data` should be an array), or an eventual error.
     *
     */
    this._fetch = function (limit, offset, params, cb) {

      cb(new Error('Not implemented.'));

    };

    // Helper.

    function fetch(start, end) { // Start inclusive, end exclusive.

      self._fetch(end - start, start, _params, function (err, data) {

        var cb = _fetchCb;
        _fetchingNext = _fetchingPrev = false;
        _fetchCb = null;

        if (err) {
          if (cb) {
            cb(err);
          }
          return;
        }

        var n = data.length;
        _exhausted = n < end - start;
        var i;
        for (i = 0; i < n; i++) {
          _data[start + i] = data[i];
        }
        if (start < _offset) {
          _offset = start;
        }
        if (cb) {
          cb(null, n);
        }

      });

    }

  }

  root.exports = Sieste;

})(module || this);
