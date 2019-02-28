module.exports = function(App) {
  App.objects = {
    constants: {
      timestamp_mjd2000: 946728000,
      earth_mjd2000: [1, 0.0167091140000000, 0, 0, 1.79665003808771, -0.0431892049938299, 398600],
      AU: 149600000,
      mass_sun: 1.989e+30,
      mass_earth: 5.974e+24,
    },

    cartesianAtUnix(data, timestamp) {
      return App.conversion.keplerianToCartesianTime(
        data[0] * App.objects.constants.AU,
        data[1],
        data[2],
        data[3],
        data[4],
        data[5],
        timestamp,
        App.objects.constants.timestamp_mjd2000,
        data[6]
      );
    },

    L1cartesianAtUnix(data, timestamp) {
      let SB = App.objects.cartesianAtUnix(data, timestamp);
      let SE = App.objects.cartesianAtUnix(App.objects.constants.earth_mjd2000, timestamp);

      mSE = App.math.norm(SE);
      mEL1 = mSE * App.math.nthRoot(App.objects.constants.mass_earth / (3 * App.objects.constants.mass_sun), 3);

      SL1 = App.math.multiply(App.math.matrix(SE), (mSE - mEL1) / mSE);
      L1B = App.math.subtract(App.math.matrix(SB), SL1);

      mL1B = App.math.norm(L1B);

      return App.math.multiply(L1B, 1 / mL1B)._data;
    },

    cartesianToScopedMercator(x, y, z, offset) {
      let mercator = App.conversion.cartesianToMercator(x, y, z);

      mercator[0] = mercator[0] - 270 + offset;

      return mercator;
    },

    /**
     * Perform initial processing of object data
     */
    initialProcessing(objects, timestamp, offset) {
      var count = 0;

      return _.map(objects, function(object, key) {
        let cartesian = App.objects.L1cartesianAtUnix(object, timestamp);

        return {
          id: ++count,
          name: key,
          title: _.startCase(key),
          kepler: object,
          mercator: App.objects.cartesianToScopedMercator(cartesian[0], cartesian[1], cartesian[2], offset),
        };
      });
    },

    /**
     * Populate objects on highcharts plot
     */
    moveObjectsIntoPlot() {
      // Process data
      App.pathFinder.data.object_series = App.objects.initialProcessing(App.pathFinder.data.objects, App.pathFinder.data.timestamp, App.pathFinder.data.offset);

      App.pathFinder.data.objects_in_view = App.operations.cropX(App.pathFinder.data.object_series, 50 + 10);
      App.pathFinder.setData('Objects', App.objects.prepareDataForPlot(App.pathFinder.data.objects_in_view));
    },

    prepareDataForPlot(data) {
      return _.map(data, function(set) {
        return { name: set.title, x: set.mercator[0], y: set.mercator[1] };
      });
    }
  }
};
