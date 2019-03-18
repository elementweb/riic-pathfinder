module.exports = function(App) {
  /**
   * Arithmetics class - helper in dealing with mathematical conversions
   */
  App.arithmetics = {
    /**
     * Center the angle within 360 degrees (2 PI) range
     */
    wrapTo360(n) {
      while (n < 0) {
        n = n + 360;
      }

      while (n >= 360) {
        n = n - 360;
      }

      return n;
    },

    /**
     * Center the angle within 2 PI range
     */
    wrapTo2PI(n) {
      while (n < 0) {
        n = n + 2*Math.PI;
      }

      while (n >= 2*Math.PI) {
        n = n - 2*Math.PI;
      }

      return n;
    },

    /**
     * Center the angle within 180 degrees (PI) range
     */
    wrapTo180(n) {
      while (n < -180) {
        n = n + 360;
      }

      while (n >= 180) {
        n = n - 360;
      }

      return n;
    },

    /**
     * Center the angle within 90 degrees range
     */
    wrapTo90(n) {
      while (n < -90) {
        n = n + 180;
      }

      while (n >= 90) {
        n = n - 180;
      }

      return n;
    },

    /**
     * Constrain angle within field of view
     */
    constrainToFOV(angle, span) {
      let halfspan = span / 2;

      if(angle < -halfspan) {
        return -halfspan;
      }

      if(angle > halfspan) {
        return halfspan;
      }

      return angle;
    },

    /**
     * Check whether coordinates fall under the circle of given radius
     */
    isWithinCircle(x, y, r) {
      return Math.pow(x, 2) + Math.pow(y, 2) <= Math.pow(r, 2);
    },

    /**
     * Check whether a line is in collision with circle of given coordinates and radius
     */
    isInCollision(ax, ay, bx, by, cx, cy, r) { 
      P1 = [ax, ay];
      P2 = [bx, by];
      C  = [cx, cy];
      R  = r;

      P12 = [
        P2[0] - P1[0],
        P2[1] - P1[1]
      ];

      mag = Math.sqrt(Math.pow(P12[0], 2) + Math.pow(P12[1], 2))
      
      N = [
        P12[0] / mag,
        P12[1] / mag
      ];

      P1C = [
        C[0] - P1[0],
        C[1] - P1[1]
      ];

      v = Math.abs(N[0] * P1C[1] - N[1] * P1C[0]);

      return v <= R;
    },

    /**
     * Compute angle between two vectors given in mercator representation
     */
    angleBetweenMercatorVectors(reference, position) {
      var ref = [reference[0] + 180, reference[1]],
          pos = [position[0] + 180, position[1]];

      ref = App.conversion.mercatorToCartesian(ref[0], ref[1]);
      pos = App.conversion.mercatorToCartesian(pos[0], pos[1]);

      return App.arithmetics.angleBetweenCartesianVectors(ref, pos);
    },

    /**
     * Compute angle between two cartesian vectors
     */
    angleBetweenCartesianVectors(reference, position) {
      return Math.acos(App.math.dot(reference, position) / (App.math.norm(reference) * App.math.norm(position))) * 180 / Math.PI;
    },
  }
};
