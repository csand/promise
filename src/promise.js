(function() {
  "use strict";

  var root = this;

  function extend(dest, src) {
    for (var key in src) {
      if (src.hasOwnProperty(key) && !dest[key]) {
        dest[key] = src[key];
      }
    }
  }

  function cleanContext(fn) {
    if (root.setTimeout) {
      root.setTimeout(fn, 0);
    }
  }

  function _resolve(origin, z) {
    cleanContext(function() {
      origin.zVal = z;
      var i, l, p, resVal;
      while (origin._promises.length) {
        resVal = undefined;
        p = origin._promises.shift();
        if (typeof p[0] === 'function') {
          try {
            resVal = p[0].call(undefined, z);
            p[2].resolve(resVal !== undefined ? resVal : z);
          } catch (e) {
            p[2].reject(e);
          }
        } else {
          p[2].resolve(z);
        }
      }
    });
  }

  function _reject(origin, z) {
    cleanContext(function() {
      origin.zVal = z;
      var p, resVal;
      while (origin._promises.length) {
        resVal = undefined;
        p = origin._promises.shift();
        if (typeof p[1] === 'function') {
          try {
            resVal = p[1].call(undefined, z);
            if (resVal !== undefined) {
              p[2].resolve(resVal);
            } else {
              p[2].reject(z);
            }
          } catch (e) {
            p[2].reject(e);
          }
        } else {
          p[2].resolve(z);
        }
      }
    });
  }

  var Promise = function Promise() {
    this.state = 'pending';
    this._promises = [];
  };

  extend(Promise.prototype, {
    then: function(callback, errback) {
      var promise = new Promise();
      this._promises.push([callback, errback, promise]);
      if (this.state === 'fulfilled') {
        _resolve(this, this._zVal);
      } else if (this.state === 'rejected') {
        _reject(this, this._zVal);
      }
      return promise;
    },

    resolve: function(x) {
      if (this.state !== 'pending') {
        throw new Error('Promise has already been ' + this.state +
                        ', cannot resolve');
      }
      if (this === x) {
        throw new TypeError('Cannot resolve a Promise with itself');
      }
      if (x instanceof Promise) {
        // If x is one of our Promises, assume its state
        (function(origin) {
          x.then(function(y) {
            origin.resolve(y);
          }, function(e) {
            origin.reject(e);
          });
        })(this);
      } else if (typeof x === 'function' || typeof x === 'object') {
        // If x is an object or a function, look for x.then
        var then;
        try {
          then = x.then;
        } catch (e) {
          // Must reject if access to x.then triggers an error
          this.reject(e);
        }
        if (typeof then === 'function') {
          // once is a flag used to make sure that only resolvePromise or
          // rejectPromise is called, and all future calls to either are
          // ignored
          var once = false;
          try {
            then.call(this, function resolvePromise(y) {
              if (!once) {
                once = true;
                this.resolve(y);
              }
            }, function rejectPromise(r) {
              if (!once) {
                once = true;
                this.reject(r);
              }
            });
          } catch (e) {
            // Reject only if reject/resolvePromise have not been called yet
            if (!once) {
              this.reject(e);
            }
          }
        } else {
          _resolve(this, x);
        }
      } else {
        // Normal resolution process
        this.state = 'fulfilled';
        _resolve(this, x);
      }
    },

    reject: function(err) {
      if (this.state !== 'pending') {
        throw new Error('Promise has already been ' + this.state +
                        ', cannot reject');
      }
      this.state = 'rejected';
      _reject(this, err);
    }
  });

  if (root.define && root.define.amd) {
    root.define(function() { return Promise; });
  } else {
    var oldPromise = root.Promise;
    root.Promise = Promise;
    Promise.noConflict = function() {
      root.Promise = oldPromise;
      return this;
    };
  }

}.call(window));
