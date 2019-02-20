module.exports = function(App) {
  App.arithmetics = {
    wrapTo360(n) {
      while (n < 0) {
        n = n + 360;
      }

      while (n >= 360) {
        n = n - 360;
      }

      return n;
    }
  }
};
