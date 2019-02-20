module.exports = function(App) {
  App.cacheFunctions = {
    initialize() {
      App.cache.pull = function (key, callback) {
        if(typeof this.get(key) !== 'undefined') {
          return this.get(key);
        }

        if(typeof this.get(key) === 'undefined') {
          return null;
        }

        this.set(key, callback.call());

        return this.get(key);
      }
    },
  }
};
