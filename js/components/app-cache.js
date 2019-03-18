module.exports = function(App) {
  /**
   * Cach functions helper class
   */
  App.cacheFunctions = {
    initialize() {
      /**
       * Get stored value or define method to store the value
       */
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
    }
  }
};
