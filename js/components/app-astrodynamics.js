module.exports = function(App) {
  App.astrodynamics = {
    constants: {
      timestamp_mjd2000: 946728000,
      earth_mjd2000: [1, 0.0167091140000000, 0, 0, 1.79665003808771, -0.0431892049938299, 398600],
      AU: 149600000,
      mass_sun: 1.989e+30,
      mass_earth: 5.974e+24,
    },

    data: {
      SL1: [],
      L1E: [],
      propagation_reference: 0,
    },

    cartesianAtUnix(data, timestamp, reference) {
      return App.conversion.keplerianToCartesianTime(
        data[0] * App.astrodynamics.constants.AU,
        data[1],
        data[2],
        data[3],
        data[4],
        data[5],
        timestamp,
        reference,
        data[6]
      );
    },

    /**
     * Propagate L1 position used to compute positions of all other objects
     */
    propagateL1(timestamp) {
      if(timestamp == App.astrodynamics.data.propagation_reference) {
        return;
      }

      App.astrodynamics.data.propagation_reference = timestamp;

      var SE = App.astrodynamics.cartesianAtUnix(App.astrodynamics.constants.earth_mjd2000, timestamp, App.astrodynamics.constants.timestamp_mjd2000),
          mSE = App.math.norm(SE),
          mEL1 = mSE * App.math.nthRoot(App.astrodynamics.constants.mass_earth / (3 * App.astrodynamics.constants.mass_sun), 3);

      App.astrodynamics.data.SL1 = App.math.multiply(App.math.matrix(SE), (mSE - mEL1) / mSE);
      App.astrodynamics.data.L1E = App.math.subtract(SE, App.astrodynamics.data.SL1);
    },

    L1cartesianAtUnix(data, timestamp, reference) {
      App.astrodynamics.propagateL1(App.pathFinder.data.timestamp);

      var SB = App.astrodynamics.cartesianAtUnix(data, timestamp, reference),
          L1B = App.math.subtract(App.math.matrix(SB), App.astrodynamics.data.SL1),
          mL1B = App.math.norm(L1B);

      return App.math.multiply(L1B, 1 / mL1B).toArray();
    },

    propagatedSL1Offset() {
      var SL1 = App.astrodynamics.data.SL1.toArray(),
          offset = App.math.atan2(SL1[1], SL1[0]);

      return App.arithmetics.wrapTo360(App.conversion.rad2deg(offset - Math.PI));
    },
  }
};


    