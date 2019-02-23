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
    },

    wrapTo180(n) {
      while (n < -180) {
        n = n + 360;
      }

      while (n >= 180) {
        n = n - 360;
      }

      return n;
    },

    wrapTo90(n) {
      while (n < -90) {
        n = n + 180;
      }

      while (n >= 90) {
        n = n - 180;
      }

      return n;
    },

    constrainToFOV(angle, span) {
      let halfspan = span / 2;

      if(angle < -halfspan) {
        return -halfspan;
      }

      if(angle > halfspan) {
        return halfspan;
      }

      return angle;
    }
  }
};
