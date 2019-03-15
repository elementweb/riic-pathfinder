module.exports = function(App) {
  App.objects = {
    /**
     * Perform initial processing of object data
     */
    initialProcessing(objects, timestamp, offset) {
      var count = 0;

      return _.map(objects, function(object, key) {
        var reference = App.astrodynamics.constants.timestamp_mjd2000,
            [cartesian] = App.astrodynamics.L1cartesianAtUnix(object, timestamp, reference);

        return {
          id: ++count,
          name: key,
          title: _.startCase(key),
          kepler: object,
          mercator: App.conversion.cartesianToScopedMercator(cartesian[0], cartesian[1], cartesian[2], offset),
          schedule: 1,
        };
      });
    },

    propagate(data) {
      return _.map(data, function(object) {
        var [cartesian] = App.astrodynamics.L1cartesianAtUnix(object.kepler, App.pathFinder.data.timestamp, App.astrodynamics.constants.timestamp_mjd2000);

        object.mercator = App.conversion.cartesianToScopedMercator(cartesian[0], cartesian[1], cartesian[2], App.pathFinder.data.offset);

        return object;
      });
    },

    /**
     * Populate objects on highcharts plot
     */
    moveObjectsIntoPlot() {
      // Process data
      App.pathFinder.data.object_series = App.objects.initialProcessing(App.dataManager.storage.objects, App.pathFinder.data.timestamp, App.pathFinder.data.offset);

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
