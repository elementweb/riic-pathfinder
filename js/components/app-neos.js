module.exports = function(App) {
  App.neos = {
    exoplanet_type: 2,

    settings: {
      scheduler: {
        threshold: 60,
        offscope_min: 10,
        offscope_max: 1000,
      },

      scan_enabled: true,

      limiting_by: 1, // 1 - integration time, 2 - visual magnitude
      vmag_limit: 20,
      int_time_limit: 180*60, // seconds

      // Allow spectroscopy to be performed for single target more than once?
      // allow_multiple_spectroscopies: true,

      // Minimum delay between NEO spectroscopies in seconds.
      // min_delay_between_specs: 10368000, // 4 months = 4*30*24*3600

      scan_method: 2, // 1 - delay between scans, 2 - scan only once

      scan_delay: 30, // days
    },

    data: {
      close_approaches: [
        '2019 CM4', '2019 DH', '2019 EE1', '2019 DJ1', '2013 EG68', '2012 VZ19', '2019 ES', '2019 DH1', '2019 CL2',
        '2019 CD5', '2019 DS', '2019 EN', '2016 GE1', '2014 UR', '2016 GW221', '2012 XO134', '2016 JP', '2018 KK1',
      ],
    },

    initialize() {
      // Compute angle threshold for Sun → Asteroid
      // App.neos.settings.scheduler.threshold = App.neos.computeSunBodyAngleThreshold();
    },

    /**
     * Compute visual magnitudes of given set of data
     */
    computeIntegrationTimes(data) {
      return _.map(data, function(object) {
        object.data.vmag = App.spectroscopy.computeVisualMagnitude(object.data.mag, object.obs2ast, object.sun2ast),
        object.data.integration_time = App.spectroscopy.integrationTime(object.data.vmag);

        return object;
      });
    },

    attemptNewTargetSelection() {
      if(!App.neos.settings.scan_enabled || App.pathFinder.isSpacecraftInCooldownMode() || App.pathFinder.data.target_selected) {
        return;
      }

      var neo_target = App.neos.feasibleTargetSelector(App.pathFinder.data.neos_in_scope, App.pathFinder.data.timestamp);

      return neo_target ? App.neos.selectByTargetById(neo_target.id) : false;
    },

    attemptTargetDeselection() {
      // Checking if currently selected exoplanet has exceeded integration time
      var current_target = App.neos.getTarget(App.pathFinder.data.target.id);

      if(!current_target) {
        return;
      }

      var condition = App.pathFinder.data.timestamp > App.pathFinder.data.target.time_selected + current_target.data.integration_time;

      if(condition) {
        current_target.spect_num++;
        current_target.last_spectroscopy = App.pathFinder.data.timestamp;

        App.statistics.angleChangeAOCS(App.arithmetics.angleBetweenCartesianVectors(
          current_target.slew.initial_position,
          current_target.slew.last_position,
        ));

        App.output.operationCompleted(
          App.targeting.target_types.neo,
          App.pathFinder.data.target.time_selected,
          App.pathFinder.data.timestamp,
          App.neos.prepareForOutput(current_target),
        );

        App.statistics.logOperationTime(App.targeting.target_types.neo, App.pathFinder.data.timestamp - App.pathFinder.data.target.time_selected);
        App.statistics.logIntegrationTime(App.targeting.target_types.neo, current_target.data.integration_time);

        var data_produced = App.spectroscopy.dataProduced(current_target.data.integration_time);

        App.statistics.determineMaxSlewRate(current_target.slew.max);
        App.statistics.dataProduced(data_produced);

        current_target.slew = App.neos.slewDefault();

        App.statistics.incrementCounter('neos_scanned');
        App.statistics.incrementIntegrationTime(current_target.data.integration_time);
        App.comms.addData(data_produced);
        App.targeting.discardTarget();

        App.spectroscopy.enterCooldownPeriod();
      }
    },

    /**
     * Select NEO by given ID
     */
    selectByTargetById(id) {
      var target = App.neos.getTarget(id);

      if(target.length <= 0) {
        return false;
      }

      App.pathFinder.data.target_type = App.targeting.target_types.neo;
      App.pathFinder.data.target.id = target.id;
      App.UI.targetSelected('neo', target);
      App.targeting.setNEOTarget(target);
      App.pathFinder.data.target.time_selected = App.pathFinder.data.timestamp;
      App.pathFinder.data.target_selected = true;

      return true;
    },

    getTarget(id) {
      return App.pathFinder.data.neos_series.find(el => el.id === id);
    },

    /**
     * Select new NEO target
     */
    feasibleTargetSelector(data, timestamp) {
      // Filter out all NEO targets that we can not observe due to integration time being larger than that of transit
      data = _.filter(data, function(object) {
        // limiting by integration time
        if(App.neos.settings.limiting_by == 1) {
          return object.data.integration_time < App.neos.settings.int_time_limit;
        }

        // limiting by visual magnitude
        return object.data.vmag < App.neos.settings.vmag_limit;
      });
      
      // Do we allow multiple NEO spectroscopies?
      data = _.filter(data, function(object) {
        // We allow multiple spectroscopies
        if(App.neos.settings.scan_method == 1) {
          return timestamp > object.last_spectroscopy + App.neos.settings.scan_delay*24*3600;
        }

        // We do not allow multiple NEO spectroscopies
        return object.spect_num <= 0;
      });

      // If we do allow multiple NEO spectroscopies, let's bring those with least measurements to the front
      if(App.neos.settings.scan_method == 1) {
        data = _.filter(data, function(object) {
          return timestamp > object.last_spectroscopy + App.neos.settings.scan_delay*24*3600;
        });

        data = _.orderBy(data, function(object) {
          return object.spect_num;
        }, ['asc']);
      } else {
        data = _.filter(data, function(object) {
          return object.spect_num <= 0;
        });
      }

      // Filter out all targets that will fall out of scope or enter Earth's exclusion zone during integration
      data = _.filter(data, function(object) {
        // We know integration time, we can check where the object will end up being at at the end of scan
        var [cartesian] = App.astrodynamics.L1cartesianAtUnix(object.kepler, timestamp + object.data.integration_time, object.reference),
            offset_delta = App.conversion.secondsToAngle(object.data.integration_time),
            new_offset = App.arithmetics.wrapTo360(App.pathFinder.data.offset + offset_delta);

        var mercator = App.conversion.cartesianToScopedMercator(cartesian[0], cartesian[1], cartesian[2], new_offset),
            exclusion = App.targeting.settings.earth_exclusion_deg,
            exclusion_center = [0, 0];

        return App.targeting.isWithinScope(mercator)
            && !App.arithmetics.isInCollision(object.mercator[0], object.mercator[1], mercator[0], mercator[1], exclusion_center[0], exclusion_center[1], exclusion);
      });

      // Filter out objects that we don't have any more data storage left to scan
      data = _.filter(data, function(object) {
        return App.comms.approveIntegrationTime(object.data.integration_time);
      });

      // Prioritise those without SMASS or Tholen class flag
      data = _.orderBy(data, function(object) {
        return !!object.data.smass || !!object.data.tholen ? 1 : 0;
      }, ['asc']);

      if(data.length <= 0) {
        return false;
      }

      // Return first "feasible" target
      return _.first(data);
    },

    /**
     * Perform initial processing of NEO data
     */
    initialProcessing(objects, timestamp, offset) {
      var count = 0;

      // Filter out objects with no absolute magnitude provided (since we need it to compute visual magnitudes)
      objects = _.filter(objects, function(object) {
        return !!object.H;
      });

      // Modify object array
      return _.map(objects, function(object) {
        var reference = App.conversion.MJD2Timestamp(object.epoch_mjd);

        var keplerian = [
          object.a * 1,
          object.e * 1,
          App.conversion.deg2rad(object.i),
          App.conversion.deg2rad(object.om),
          App.conversion.deg2rad(object.w),
          App.conversion.deg2rad(object.ma),
          object.GM.length > 0 ? object.GM : 0,
        ];

        var [cartesian, cartesian_ref, mL1B, mSB] = App.astrodynamics.L1cartesianAtUnix(keplerian, timestamp, reference);

        var vmag = App.spectroscopy.computeVisualMagnitude(object.H, mL1B, mSB),
            integration_time = App.spectroscopy.integrationTime(vmag);

        return {
          id: ++count,
          data: {
            nid: object.id,
            pdes: object.pdes,
            spkid: object.spkid,
            name: object.name,
            full_name: object.full_name.replace(/[()]/g,''),
            albedo: object.albedo,
            pha: object.pha == 'Y' ? 1 : 0,
            mag: object.H,
            vmag,
            integration_time,
            smass: object.spec_B,
            tholen: object.spec_T,
          },
          reference,
          kepler: keplerian,
          mercator: App.conversion.cartesianToScopedMercator(cartesian[0], cartesian[1], cartesian[2], offset),
          schedule: 1,
          obs2ast: mL1B,
          sun2ast: mSB,
          spect_num: 0,
          last_spectroscopy: 0,
          slew: App.neos.slewDefault(),
        };
      });
    },

    slewDefault() {
      return JSON.parse(JSON.stringify({
        initial_time: 0,
        initial_position: [],
        last_time: 0,
        last_position: [],
        current: 0,
        max: 0,
      }));
    },

    /**
     * Populate NEOs on highcharts plot
     */
    moveNEOsIntoPlot() {
      // Process data
      App.pathFinder.data.neos_series = App.neos.initialProcessing(App.dataManager.storage.neos, App.pathFinder.data.timestamp, App.pathFinder.data.offset);

      // console.log(App.pathFinder.data.neos_series.find(el => el.data.nid === 'a0000001').mercator, App.pathFinder.data.timestamp, App.pathFinder.data.offset);

      App.pathFinder.data.neos_in_view = App.operations.cropX(App.pathFinder.data.neos_series, 50 + 10);

      App.pathFinder.setData('NEOs', App.neos.prepareDataForPlot(App.pathFinder.data.neos_in_view));
    },

    prepareDataForPlot(data) {
      return _.map(data, function(set) {
        // if(set.data.nid == 'a0000001' || App.neos.data.close_approaches.includes(set.data.full_name)) {
        //   return { name: set.data.full_name, x: set.mercator[0], y: set.mercator[1] };
        // }
        
        return set.mercator;
      });
    },

    propagationScheduler(position) {
      var reference = App.astrodynamics.data.SL1.toArray(),
          angle = App.arithmetics.angleBetweenCartesianVectors(reference, position);

      if(angle < App.neos.settings.scheduler.threshold) {
        return 1;
      }

      var absence_angle = angle - App.neos.settings.scheduler.threshold,
          max_angle = 180 - App.neos.settings.scheduler.threshold,
          schedule_max = App.neos.settings.scheduler.offscope_max - App.neos.settings.scheduler.offscope_min;

      return _.round(absence_angle * (schedule_max / max_angle) + App.neos.settings.scheduler.offscope_min);
    },

    computeSunBodyAngleThreshold(reference) {
      var SE = App.astrodynamics.constants.AU,
          EL1 = App.astrodynamics.constants.EL1_km;

      return App.math.atan((EL1 / SE) * App.math.tan(App.conversion.deg2rad(reference)));
    },

    prepareForOutput(neo) {
      return {
        nid: neo.data.nid,
        spkid: neo.data.spkid,
        designation: neo.data.pdes,
        name: neo.data.name,
        full_name: neo.data.full_name,
        integration_time: _.round(neo.data.integration_time),
        mag: _.round(neo.data.mag, 3),
        vmag: _.round(neo.data.vmag, 3),
        pha: neo.data.pha,
        smass: neo.data.smass,
        tholen: neo.data.tholen,
        spect_num: neo.data.spect_num,
        slew_max: _.round(neo.slew.max, 2),
      };
    },
  }
};
