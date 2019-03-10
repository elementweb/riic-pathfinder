module.exports = function(App) {
  App.neos = {
    settings: {
      scheduler: {
        threshold: 45, // depends on scope size!
        offscope_min: 10,
        offscope_max: 1000,
      }
    },

    /**
     * Perform initial processing of NEO data
     */
    initialProcessing(objects, timestamp, offset) {
      var count = 0;

      return _.map(objects, function(object) {
        var reference = App.conversion.MJD2Timestamp(object.epoch_mjd),
            keplerian = [
              object.a * 1,
              object.e * 1,
              App.conversion.deg2rad(object.i),
              App.conversion.deg2rad(object.om),
              App.conversion.deg2rad(object.w),
              App.conversion.deg2rad(object.ma),
              object.GM.length > 0 ? object.GM : 0,
            ],
            cartesian = App.astrodynamics.L1cartesianAtUnix(keplerian, timestamp, reference);

        return {
          id: ++count,
          data: {
            nid: object.id,
            pdes: object.pdes,
            spkid: object.spkid,
            name: object.name,
            full_name: object.full_name,
            albedo: object.albedo,
            pha: object.pha == 'Y' ? 1 : 0,
            mag: object.H,
            smass: object.spec_B,
            tholen: object.spec_T,
          },
          reference,
          kepler: keplerian,
          mercator: App.conversion.cartesianToScopedMercator(cartesian[0], cartesian[1], cartesian[2], offset),
        };
      });
    },

    /**
     * Populate NEOs on highcharts plot
     */
    moveNEOsIntoPlot() {
      // Process data
      App.pathFinder.data.neos_series = App.neos.initialProcessing(App.dataManager.storage.neos, App.pathFinder.data.timestamp, App.pathFinder.data.offset);

      App.pathFinder.data.neos_in_view = App.operations.cropX(App.pathFinder.data.neos_series, 50 + 10);
      App.pathFinder.setData('NEOs', App.neos.prepareDataForPlot(App.pathFinder.data.neos_in_view));
    },

    prepareDataForPlot(data) {
      return _.map(data, function(set) {
        return set.mercator;
        // return { name: set.title, x: set.mercator[0], y: set.mercator[1] };
      });
    },

    propagationScheduler(position) {
      var reference = App.astrodynamics.data.L1E.toArray(),
          angle = App.arithmetics.angleBetweenCartesianVectors(reference, position);

      if(angle < App.neos.settings.scheduler.threshold) {
        return 1;
      }

      var absence_angle = angle - App.neos.settings.scheduler.threshold,
          max_angle = 180 - App.neos.settings.scheduler.threshold,
          schedule_max = App.neos.settings.scheduler.offscope_max - App.neos.settings.scheduler.offscope_min;

      return absence_angle * (schedule_max / max_angle) + App.neos.settings.scheduler.offscope_min;
    },
  }
};
