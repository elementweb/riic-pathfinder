module.exports = function(App) {
  App.exoplanets = {
    settings: {
      scan_enabled: true,
      allow_time_before_transit: 3600, // seconds
      scan_method: 2, // 1 - delay between scans, 2 - scan only once
      scan_delay: 60, // days
      limiting_frequency: 3, // times
      limiting_timeframe: 24, // hours
    },

    data: {
      last_scan: 0, // seconds
    },

    /**
     * Compute next transit timestamps for array of objects
     */
    computeNextTransits(data, timestamp) {
      return _.map(data, function(object) {
        return App.exoplanets.computeNextTransit(object, timestamp);
      });
    },

    scanningFrequencySeconds() {
      return App.exoplanets.settings.limiting_timeframe * 3600 / App.exoplanets.settings.limiting_frequency;
    },

    /**
     * Compute next transit timestamps for a single object
     */
    computeNextTransit(object, timestamp) {
      object.next_transit = App.exoplanets.nextTransit(object.pl_tranmid, object.period, timestamp);
      object.next_transit_start = object.next_transit - _.round(object.transit_duration / 2);

      return object;
    },

    /**
     * Compute earliest transit from given reference timestamp
     */
    nextTransit(trans_ref, period, timestamp) {
      return _.round(_.floor((timestamp - trans_ref) / period) * period + period) + trans_ref;
    },

    /**
     * Compute transit duration of exoplanet passing in front of a star
     */
    transitDuration(period_days, stellar_radius_sr, planet_radius_sr, semimajor_au, impact_param) {
      var semimajor_sr = App.conversion.AU2SolarRadii(semimajor_au);

      return _.round((period_days / Math.PI)
       * Math.asin(Math.sqrt(Math.pow(stellar_radius_sr + planet_radius_sr, 2)
       - Math.pow(impact_param * stellar_radius_sr, 2)) / semimajor_sr), 4);
    },

    /**
     * Select new exoplanet target allowing some time before transit
     */
    feasibleTargetSelector(data, timestamp) {
      // Filter out all exoplanet targets that we can not observe due to integration time being larger than that of transit
      data = _.filter(data, function(object) {
        return object.integration_time < object.transit_duration;
      });

      // Filter out all targets that will fall out of scope during integration
      data = _.filter(data, function(object) {
        return object.mercator[0] < (25 - App.conversion.secondsToAngle(object.integration_time + (object.next_transit_start - timestamp)));
      });

      // Filter out all targets that will fall out of scope or enter Earth's exclusion zone during integration
      data = _.filter(data, function(object) {
        var primary = object.mercator[0],
            secondary = primary + App.conversion.secondsToAngle(object.integration_time + (object.next_transit_start - timestamp)),
            vertical = object.mercator[1],
            exclusion = App.targeting.settings.earth_exclusion_deg,
            exclusion_center = [0, 0];

        // If we are limiting to the outside of Sun exclusion zone
        if(App.targeting.settings.limiting == 2) {
          return App.targeting.isExoplanetOutsideExclusionZones(object.mercator);
        }

        if(primary === secondary && App.arithmetics.isWithinCircle(primary, vertical, exclusion)) {
          return false;
        }

        return !App.arithmetics.isInCollision(primary, vertical, secondary, vertical, exclusion_center[0], exclusion_center[1], exclusion);
      });
      
      // Order all targets bringing all exoplanets to the front of transits happening soonest
      data = _.orderBy(data, function(object) {
        return object.next_transit_start;
      }, ['asc']);
      
      // Do we allow multiple exoplanet spectroscopies?
      data = _.filter(data, function(object) {
        // We allow multiple spectroscopies
        if(App.exoplanets.settings.scan_method == 1) {
          return timestamp > object.last_spectroscopy + App.exoplanets.settings.scan_delay*24*3600;
        }

        // We do not allow multiple exoplanet spectroscopies
        return object.spect_num <= 0;
      });

      // Do we need to wait longer than `allow_time_before_transit`? If yes, do not consider those planets as targets yet and move on
      data = _.filter(data, function(object) {
        return timestamp > object.next_transit_start - App.exoplanets.settings.allow_time_before_transit
      });

      if(data.length <= 0) {
        return false;
      }

      // Return first "feasible" target
      return _.first(data);
    },

    recalculateIntegrationTimes() {
      _.each(App.pathFinder.data.exoplanet_series, function(object) {
        return App.exoplanets.transmissionIntegration(object);
      });
    },

    transmissionIntegration(object) {
      object.integration_time = App.spectroscopy.integrationTime(object.st_optmag);

      /**
       * Transit duration
       */
      // Default required transition duration will be the integration time. This is in case there's not enough data provided to compute transition duration 
      object.transit_duration = object.integration_time;
      // If enough data is provided, compute the transition duration
      if(object.pl_orbper !== null && object.st_rad !== null && object.pl_rads !== null && object.pl_orbsmax !== null && object.pl_imppar !== null) {
        object.transit_duration = App.conversion.daysToSeconds(App.exoplanets.transitDuration(object.pl_orbper, object.st_rad, object.pl_rads, object.pl_orbsmax, object.pl_imppar));
      } else if(object.pl_trandur !== null) {
        object.transit_duration = App.conversion.daysToSeconds(object.pl_trandur);
      }

      return object;
    },

    /**
     * Perform initial processing of exoplanet data
     */
    initialProcessing(data, timestamp) {
      var count = 0;

      return _.map(data, function(object) {
        /**
         * General data
         */
        object.id = ++count;
        object.cartesian = App.conversion.equatorialToCartesian(object.ra, object.dec);
        object.initial = App.conversion.cartesianToMercator(object.cartesian[0], object.cartesian[1], object.cartesian[2]);
        object.mercator = JSON.parse(JSON.stringify(object.initial));

        object = App.exoplanets.transmissionIntegration(object);

        /**
         * Convert transmission time JD → Unix
         */
        object.pl_tranmid = App.conversion.julianToTimestamp(object.pl_tranmid);

        /**
         * Compute orbital periods in seconds
         */
        object.period = App.conversion.daysToSeconds(object.pl_orbper);

        /**
         * Compute next transits
         */
        object = App.exoplanets.computeNextTransit(object, timestamp);

        /**
         * Set up spectroscopy scan flags
         */
        object.spect_num = 0;
        object.last_spectroscopy = 0;

        /**
         * Setup slew rate object
         */
        object.slew = App.exoplanets.slewDefault();
        
        return object;
      });
    },

    /**
     * Populate exoplanets on highcharts plot
     */
    moveExoplanetsIntoPlot() {
      // Process exoplanet data
      App.pathFinder.data.exoplanet_series = App.exoplanets.initialProcessing(App.dataManager.storage.exoplanets, App.pathFinder.data.timestamp);

      // Crop data vertically
      // App.pathFinder.data.exoplanet_series = App.operations.cropY(App.pathFinder.data.exoplanet_series, 50+10);

      // Zero-center data
      App.operations.zeroData(App.pathFinder.data.exoplanet_series);

      // Shift data into position
      // App.UI.setDate(App.pathFinder.data.timestamp);
      // App.astrodynamics.propagateL1(App.pathFinder.data.timestamp, true);
      // App.pathFinder.data.offset = App.astrodynamics.propagatedSL1Offset();
      App.operations.shiftData(App.pathFinder.data.exoplanet_series, App.pathFinder.data.offset);

      App.pathFinder.data.exoplanets_in_view = App.operations.cropX(App.pathFinder.data.exoplanet_series, 50 + 10);
      App.pathFinder.data.exoplanets_in_scope = App.operations.crop(App.pathFinder.data.exoplanets_in_view, 50, 50);
      App.pathFinder.setData('Exoplanets', App.exoplanets.prepareDataForPlot(App.pathFinder.data.exoplanets_in_view));

      // Update UI exoplanet indicator
      App.UI.updateExoplanetsScope(App.pathFinder.data.exoplanets_in_scope.length);

      // Load observation scope
      App.targeting.addObservationRectangle();
      // Load Early Warning scan limits
      App.targeting.addEarlyWarningScopeLimits();

      // Load target window
      App.targeting.loadTargetWindow();
      App.targeting.setTargetEarth();

      // Load Earth exclusion zone indicator
      App.targeting.loadEarthExclusionIndicator();
    },

    getTarget(id) {
      return App.pathFinder.data.exoplanet_series.find(el => el.id === id);
    },

    /**
     * Select exoplanet by given ID
     */
    selectExoplanetTargetById(id) {
      var target = App.exoplanets.getTarget(id);

      if(target.length <= 0) {
        return false;
      }

      App.pathFinder.data.target_type = App.targeting.target_types.exoplanet;
      App.pathFinder.data.target.id = target.id;
      App.UI.targetSelected('exoplanet', target);
      App.targeting.setCelestialTarget(target.initial[0], target.initial[1]);
      App.pathFinder.data.target.time_selected = App.pathFinder.data.timestamp;
      App.pathFinder.data.target_selected = true;

      target.slew.initial_time = App.pathFinder.data.timestamp;
      target.slew.initial_position = JSON.parse(JSON.stringify(target.mercator));

      return true;
    },

    resolveCatalogStatus(status) {
      switch(status*1) {
        case 0: return 'retracted';
        case 1: return 'announced';
        case 2: return 'submitted';
        case 3: return 'accepted';
        default: return 'unknown';
      }
    },

    prepareDataForPlot(data) {
      return _.map(data, function(set) {
        return set.mercator;
      });
    },

    attemptNewTargetSelection() {
      if(!App.exoplanets.settings.scan_enabled || App.pathFinder.isSpacecraftInCooldownMode() || App.pathFinder.data.target_selected) {
        return;
      }

      if(App.pathFinder.data.timestamp - App.exoplanets.data.last_scan <= App.exoplanets.scanningFrequencySeconds()) {
        return;
      }

      var exoplanet_target = App.exoplanets.feasibleTargetSelector(App.pathFinder.data.exoplanet_series, App.pathFinder.data.timestamp);

      return exoplanet_target ? App.exoplanets.selectExoplanetTargetById(exoplanet_target.id) : false;
    },

    attemptTargetDeselection() {
      // Checking if currently selected exoplanet has exceeded integration time
      var current_target = App.exoplanets.getTarget(App.pathFinder.data.target.id);

      if(!current_target) {
        return;
      }

      var condition = App.pathFinder.data.timestamp > App.pathFinder.data.target.time_selected + current_target.integration_time;

      if(condition) {
        current_target.spect_num++;
        current_target.last_spectroscopy = App.pathFinder.data.timestamp;

        var total_angle_change = App.arithmetics.angleBetweenMercatorVectors(
          current_target.slew.initial_position,
          current_target.mercator,
        );

        App.exoplanets.data.last_scan = App.pathFinder.data.timestamp;

        App.statistics.angleChangeAOCS(total_angle_change);

        App.output.operationCompleted(
          App.targeting.target_types.exoplanet,
          App.pathFinder.data.target.time_selected,
          App.pathFinder.data.timestamp,
          App.exoplanets.prepareForOutput(current_target),
        );

        App.statistics.logOperationTime(App.targeting.target_types.exoplanet, App.pathFinder.data.timestamp - App.pathFinder.data.target.time_selected);
        App.statistics.logIntegrationTime(App.targeting.target_types.exoplanet, current_target.integration_time);

        var time_delta = (App.pathFinder.data.timestamp - current_target.slew.initial_time) / 3600,
            slew_rate = total_angle_change / time_delta,
            data_produced = App.spectroscopy.dataProduced(current_target.integration_time);

        App.statistics.determineMaxSlewRate(slew_rate);
        App.statistics.dataProduced(data_produced);

        current_target.slew = App.neos.slewDefault();

        App.statistics.incrementCounter('exoplanets_scanned');
        App.statistics.incrementIntegrationTime(current_target.integration_time);
        App.targeting.discardTarget();

        App.spectroscopy.enterCooldownPeriod();
      }
    },

    slewDefault() {
      return JSON.parse(JSON.stringify({
        initial_time: 0,
        initial_position: [],
      }));
    },

    prepareForOutput(exoplanet) {
      return {
        name: exoplanet.pl_name,
        host: exoplanet.pl_hostname,
        period: exoplanet.period,
        transit_duration: exoplanet.transit_duration,
        optmag: exoplanet.st_optmag,
        spect_num: exoplanet.spect_num,
      };
    },
  }
};
