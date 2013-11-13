describe('Promise', function() {
  var promise;

  beforeEach(function() {
    promise = new Promise();
  });

  it('should start off pending', function() {
    expect(promise).to.have.a.property('state', 'pending');
  });

  describe('.then()', function() {
    it('should return a new promise', function() {
      var x = promise.then();
      expect(x).to.not.equal(promise);
    });
  });

  describe('.resolve()', function() {
    it('should call its callback', function(done) {
      promise.then(done);
      promise.resolve();
    });

    it('should only call its callback once', function(done) {
      var spy = sinon.spy();
      promise.then(spy).then(function() {
        expect(spy).to.have.been.calledOnce;
        done();
      });
      promise.resolve();
    });

    it('should call its callbacks in order', function(done) {
      var result = [];
      promise.then(function() { result.push(1); });
      promise.then(function() { result.push(2); });
      promise.then(function() { result.push(3); });
      promise.then(function() {
        expect(result).to.eql([1, 2, 3]);
        done();
      });
      promise.resolve();
    });

    it('should only call its callbacks once it is fulfilled', function(done) {
      promise.then(function() {
        expect(promise).to.have.property('state', 'fulfilled');
        done();
      });
      promise.resolve();
    });

    it('should throw an error if previously rejected', function() {
      promise.reject();
      var fn = function() { promise.resolve(); };
      expect(fn).to.throw(Error);
    });

    it('should throw an error if previously resolved', function() {
      promise.resolve();
      var fn = function() { promise.resolve(); };
      expect(fn).to.throw(Error);
    });

    it('should throw an error if resolved with itself', function() {
      var fn = function() { promise.resolve(promise); };
      expect(fn).to.throw(TypeError);
    });

    it('should call its callback with the value passed to resolve', function(done) {
      var rand = Math.random();
      promise.then(function(val) {
        expect(val).to.equal(rand);
        done();
      });
      promise.resolve(rand);
    });

    describe('adopts the state of promises of the same type', function() {
      it('pending', function() {
        var pending = new Promise();
        promise.resolve(pending);
        expect(promise).to.have.property('state', 'pending');
      });

      it('fulfilled', function(done) {
        var resolved = new Promise();
        resolved.resolve();
        resolved.then(function() {
          promise.then(function() {
            expect(promise).to.have.property('state', 'fulfilled');
            done();
          });
          promise.resolve(resolved);
        });
      });

      it('rejected', function(done) {
        var rejected = new Promise();
        rejected.reject();
        rejected.then(undefined, function() {
          promise.then(undefined, function() {
            expect(promise).to.have.property('state', 'rejected');
            done();
          });
          promise.resolve(rejected);
        });
      });
    });

    describe('resolves child promises', function() {
      it('with the resolve value if its callback is undefined', function() {
        var rand = Math.random();
        promise.then().then(function(val) {
          expect(val).to.equal(rand);
          done();
        });
        promise.resolve(rand);
      });

      it('with the callbacks return value', function() {
        var rand = Math.random();
        var rand2 = Math.random();
        promise.then(function() {
          return rand2;
        }).then(function(val) {
          expect(val).to.not.equal(rand);
          expect(val).to.equal(rand2);
          done();
        });
        promise.resolve(rand);
      });
    });

    describe('rejects child promises', function() {
      it('if its callback throws an error', function(done) {
        promise.then(function() {
          throw new Error('should reject');
        }).then(undefined, function(err) {
          expect(err).to.be.an.instanceOf(Error);
          done();
        });
        promise.resolve();
      });
    });

    describe("callback's this", function() {
      it('should be the global object', function(done) {
        promise.then(function() {
          expect(this).to.equal(window);
          done();
        });
        promise.resolve();
      });
      it('should be undefined in strict mode', function(done) {
        'use strict';
        promise.then(function() {
          expect(this).to.be.undefined;
          done();
        });
        promise.resolve();
      });
    });
  });

  describe('.reject()', function() {
    it('should call its errback', function(done) {
      promise.then(undefined, done);
      promise.reject();
    });
    it('should only call its errback once', function(done) {
      var spy = sinon.spy();
      promise.then(undefined, spy).then(undefined, function() {
        expect(spy).to.have.been.calledOnce;
        done();
      });
      promise.reject();
    });
    it('should call its errbacks in order', function(done) {
      var result = [];
      promise.then(undefined, function() { result.push(1); });
      promise.then(undefined, function() { result.push(2); });
      promise.then(undefined, function() { result.push(3); });
      promise.then(undefined, function() {
        expect(result).to.eql([1, 2, 3]);
        done();
      });
      promise.reject();
    });
    it('should throw an error if previously rejected', function() {
      promise.reject();
      var fn = function() { promise.reject(); };
      expect(fn).to.throw(Error);
    });
    it('should throw an error if previously resolved', function() {
      promise.resolve();
      var fn = function() { promise.reject(); };
      expect(fn).to.throw(Error);
    });

    describe("errback's this", function() {
      it('should be the global object', function(done) {
        promise.then(undefined, function() {
          expect(this).to.equal(window);
          done();
        });
        promise.reject();
      });
      it('should be undefined in strict mode', function(done) {
        'use strict';
        promise.then(undefined, function() {
          expect(this).to.be.undefined;
          done();
        });
        promise.reject();
      });
    });
  });

});
