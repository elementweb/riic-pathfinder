module.exports = function(App) {
  /**
   * Astrodynamics class
   */
  App.astrodynamics = {
    /**
     * Define constants
     */
    constants: {
      timestamp_mjd2000: 946728000,
      earth_mjd2000: [1, 0.0167091140000000, 0, 0, 1.79665003808771, -0.0431892049938299, 398600],
      AU: 149600000,
      EL1_km: 1.5e+6, 
      mass_sun: 1.989e+30,
      mass_earth: 5.974e+24,
    },

    /**
     * Data storage object
     */
    data: {
      SL1: [],
      L1E: [],
      propagation_reference: 0,
    },

    /**
     * Convert km to AU
     */
    km2AU(km) {
      return km / App.astrodynamics.constants.AU;
    },

    /**
     * Convert km to L1E units (number of lenghts between Earth and L1)
     */
    km2L1E(km) {
      return km / App.astrodynamics.constants.EL1_km;
    },

    /**
     * Compute cartesian vector at given time and time reference
     */
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
    propagateL1(timestamp, initial = false) {
      if(!initial && timestamp == App.astrodynamics.data.propagation_reference) {
        return;
      }

      App.astrodynamics.data.propagation_reference = timestamp;

      var SE = App.astrodynamics.cartesianAtUnix(App.astrodynamics.constants.earth_mjd2000, timestamp, App.astrodynamics.constants.timestamp_mjd2000),
          mSE = App.math.norm(SE),
          mEL1 = mSE * App.math.nthRoot(App.astrodynamics.constants.mass_earth / (3 * App.astrodynamics.constants.mass_sun), 3);

      App.astrodynamics.data.SL1 = App.math.multiply(App.math.matrix(SE), (mSE - mEL1) / mSE);
      App.astrodynamics.data.L1E = App.math.subtract(SE, App.astrodynamics.data.SL1);
    },

    /**
     * Compute position of given object with respect to L1 at given time and time reference
     */
    L1cartesianAtUnix(data, timestamp, reference) {
      App.astrodynamics.propagateL1(App.pathFinder.data.timestamp);

      var SB = App.math.matrix(App.astrodynamics.cartesianAtUnix(data, timestamp, reference)),
          mSB = App.math.norm(SB),
          L1B = App.math.subtract(SB, App.astrodynamics.data.SL1),
          mL1B = App.math.norm(L1B);

      return [
        App.math.multiply(L1B, 1 / mL1B).toArray(),
        App.math.multiply(SB, 1 / mSB).toArray(),
        mL1B,
        mSB,
      ];
    },

    /**
     * Compute offset - angle on ecliptical plan
     */
    propagatedSL1Offset() {
      var SL1 = App.astrodynamics.data.SL1.toArray(),
          offset = App.math.atan2(SL1[1], SL1[0]) - Math.PI;

      return App.arithmetics.wrapTo360(App.conversion.rad2deg(offset));
    },
  }
};


    