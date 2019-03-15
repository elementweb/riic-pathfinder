let highcharts = require('highcharts');

module.exports = function(App) {
  App.pathFinder = {
    chart: {},

    data: {
      object_series: [],
      objects_in_view: [],
      exoplanet_series: [],
      exoplanets_in_view: [],
      exoplanets_in_scope: [],
      neos_series: [],
      neos_in_view: [],
      neos_in_scope: [],
      transiting_exoplanets: [],
      horizontal_obs_angle: 50,
      vertical_obs_angle: 50,
      interval_id: null,
      initialized: false,
      reference_timestamp: null,
      timestamp: null,
      offset: null,
      scope_loaded: false,
      scope_size: [3, 3],
      target_selected: false,
      target_type: 0, // 0 - none, 1 - exoplanet, 2 - neo
      target: {
        id: null,
        coordinates: [0, 0],
        translate: false,
        time_selected: null
      },
      simulation: {
        timestep_sec: 360,
        delay: 0,
      },
      scan_cooldown: false,
      cooms_cooldown: false,
      ew_cooldown: false,
      translation_counter: 0,
      refresh_rate: 1,
      perform_early_warning_scans: true,
      targetting_priorities: {
        neo: 0.7,
        exo: 0.3
      },
      iterations: 0,
      iteration_reference: 0,
      visualisation_enabled: true,
      lifetime_days: 30,
      stop_at_the_end: true,
      lifetime_exceeded: false,
    },

    /**
     * Main simulation loop
     */
    loop() {
      // Increment timestamp
      App.pathFinder.data.timestamp = App.pathFinder.data.timestamp*1 + App.pathFinder.data.simulation.timestep_sec;

      // Set date at the top of the plot
      App.UI.setDate(App.pathFinder.data.timestamp);

      // Propagate L1 (point of reference)
      App.astrodynamics.propagateL1(App.pathFinder.data.timestamp);

      // Calculate offset
      App.pathFinder.data.offset = App.astrodynamics.propagatedSL1Offset();

      // Shift X-axis
      App.operations.shiftData(App.pathFinder.data.exoplanet_series, App.pathFinder.data.offset);

      // Process exoplanets
      App.pathFinder.data.exoplanets_in_view = App.operations.cropX(App.pathFinder.data.exoplanet_series, 50 + 10);
      App.pathFinder.data.exoplanets_in_scope = App.operations.crop(App.pathFinder.data.exoplanets_in_view, 50, 50);
      App.pathFinder.data.exoplanets_in_scope = App.exoplanets.computeNextTransits(App.pathFinder.data.exoplanets_in_scope, App.pathFinder.data.timestamp);

      // Update UI exoplanet indicator
      App.UI.updateExoplanetsScope(App.pathFinder.data.exoplanets_in_scope.length);

      // Propagate orbits of Solar planets
      App.pathFinder.data.object_series = App.objects.propagate(App.pathFinder.data.object_series);

      /**
       * Propagate orbits of NEOs
       */
      App.pathFinder.data.neos_series = _.map(App.pathFinder.data.neos_series, function(object) {
        object.schedule = object.schedule - 1;
        
        if(object.schedule >= 1) {
          return object;
        }

        var [cartesian, sun_ref_cartesian, mL1B, mSB] = App.astrodynamics.L1cartesianAtUnix(object.kepler, App.pathFinder.data.timestamp, object.reference);

        object.mercator = App.conversion.cartesianToScopedMercator(cartesian[0], cartesian[1], cartesian[2], App.pathFinder.data.offset);
        object.schedule = App.neos.propagationScheduler(sun_ref_cartesian);
        object.obs2ast = mL1B;
        object.sun2ast = mSB;

        // if(object.data.nid == 'a0000001') {
        //   console.log(object.mercator, App.pathFinder.data.timestamp, App.pathFinder.data.offset);
        // }

        if(App.pathFinder.data.target_type == App.targeting.target_types.neo && object.id == App.pathFinder.data.target.id) {
          if(_.isEmpty(object.slew.initial_position)) {
            object.slew.initial_position = cartesian;
            object.slew.last_position = cartesian;
            object.slew.initial_time = App.pathFinder.data.timestamp;
            object.slew.last_time = App.pathFinder.data.timestamp;
          }

          var time_delta = (App.pathFinder.data.timestamp - object.slew.initial_time) / 3600;

          // Current
          object.slew.current = App.arithmetics.angleBetweenCartesianVectors(object.slew.initial_position, cartesian) / time_delta;

          // Compute max
          if(!isFinite(object.slew.max) || object.slew.current > object.slew.max) {
            object.slew.max = object.slew.current;
          }

          object.slew.last_position = cartesian;
          object.slew.last_time = App.pathFinder.data.timestamp;
        }

        return object;
      });
      App.pathFinder.data.neos_in_view = App.operations.crop(App.pathFinder.data.neos_series, 50+10, 50+10);
      App.pathFinder.data.neos_in_scope = App.operations.crop(App.pathFinder.data.neos_in_view, 50, 50);
      App.pathFinder.data.neos_in_scope = App.neos.computeIntegrationTimes(App.pathFinder.data.neos_in_scope, App.pathFinder.data.timestamp);

      /**
       * Shift all data points on the plot
       */
      App.pathFinder.updatePlot();

      /**
       * Targeting decisions happens here (after all orbits propagated and plot updated)
       */
      if(!App.pathFinder.data.target_selected) {
        // Let's check if we need to make contact with Earth already
        App.comms.shallWeEnterCommsMode();

        // Should we now perform Early-Warning scan?
        App.earlyWarning.shallWeScanNow();

        // Can we select NEO for scan?
        App.neos.attemptNewTargetSelection();

        // Can we select exoplanet for scan?
        App.exoplanets.attemptNewTargetSelection();
      }

      /**
       * However, if we have selected target, find out when do we have to stop tracking the target
       */
      if(App.pathFinder.data.target_selected) {
        if(App.pathFinder.data.target_type == App.targeting.target_types.earth_comms) {
          // Here we check if we have been in this operation mode long enough
          App.comms.canWeNowExitCommsMode();
        }

        if(App.pathFinder.data.target_type == App.targeting.target_types.early_warning_scan) {
          // Here we check if we have been performing early warning long enough
          App.earlyWarning.canWeNowStopScanning();
        }

        if(App.pathFinder.data.target_type == App.targeting.target_types.neo) {
          // Can we stop observing NEO now?
          App.neos.attemptTargetDeselection();
        }

        if(App.pathFinder.data.target_type == App.targeting.target_types.exoplanet) {
          // Can we stop observing exoplanet now?
          App.exoplanets.attemptTargetDeselection();
        }
      }

      /**
       * If we still have the target selected
       */
      if(App.pathFinder.data.target_selected) {
        if(App.pathFinder.data.target_type != App.targeting.target_types.earth_comms && App.pathFinder.data.target_type != App.targeting.target_types.early_warning_scan) {
          // Update target coordinates
          App.pathFinder.data.target.coordinates = App.targeting.getCurrentTarget().mercator;
          
          // Translate target
          App.targeting.translateTarget();

          // Is NEO being targeted?
          if(App.pathFinder.data.target_type == App.targeting.target_types.neo) {
            // Update UI NEO data
            App.UI.updateNEODetails(App.neos.getTarget(App.pathFinder.data.target.id));
          }
        }
      }

      /**
       * Performance indicator
       */
      App.UI.performanceCounter();

      /**
       * Debug
       */
      App.debug.loopInjection();
    },

    isSpacecraftInCooldownMode() {
      return App.spectroscopy.isInCooldown() || App.comms.isInCooldown() || App.earlyWarning.isInCooldown();
    },

    updatePlot() {
      // Increment refresh counter
      App.pathFinder.data.translation_counter++;

      if(App.pathFinder.data.translation_counter > App.pathFinder.data.refresh_rate) {
        // Update Exoplanets
        App.pathFinder.setData('Exoplanets', App.exoplanets.prepareDataForPlot(App.pathFinder.data.exoplanets_in_view));

        // Update Solar object positions
        App.pathFinder.setData('Objects', App.objects.prepareDataForPlot(App.pathFinder.data.object_series));

        // Update NEOs
        App.pathFinder.setData('NEOs', App.neos.prepareDataForPlot(App.pathFinder.data.neos_in_view));

        // Update counter
        App.pathFinder.data.translation_counter = 0;
      }
    },

    /**
     * Start simulation
     */
    start() {
      // Stop in case not already initialized or not all data has been loaded
      if(App.pathFinder.data.interval_id !== null
        || !App.pathFinder.data.initialized
        || !App.UI.allSubjectsLoaded()) {
        return;
      }

      // Schedule iterations
      App.pathFinder.data.interval_id = setInterval(function() {
        App.pathFinder.loop();
      }, App.pathFinder.data.simulation.delay);

      // Update UI
      App.UI.simulationStarted();
    },

    /**
     * Stop simulation
     */
    stop() {
      // Stop in case not already initialized or not all data has been loaded
      if(App.pathFinder.data.interval_id === null
        || !App.pathFinder.data.initialized
        || !App.UI.allSubjectsLoaded()) {
        return;
      }

      // Stop iterations and set interval_id to null
      clearInterval(App.pathFinder.data.interval_id);
      App.pathFinder.data.interval_id = null;

      // Update UI
      App.UI.simulationStopped();
    },

    /**
     * Initialize RIIC Pathfinder
     */
    initialize() {
      App.pathFinder.data.reference_timestamp = JSON.parse(JSON.stringify(App.pathFinder.data.timestamp));

      // $("#simulation-start-date").datepicker("setDate", App.pathFinder.data.reference_timestamp);
      // $("#simulation-start-date").datepicker("getDate");

      // App.UI.setDate(App.pathFinder.data.timestamp);
      // App.astrodynamics.propagateL1(App.pathFinder.data.timestamp);
      // App.pathFinder.data.offset = App.astrodynamics.propagatedSL1Offset();

      // App.neos.initialize();

      // // Resolve timestamp
      // App.pathFinder.data.timestamp = App.pathFinder.data.timestamp*1;

      // // Set date at the top of the plot
      // App.UI.setDate(App.pathFinder.data.timestamp);

      // // Propagate L1 (point of reference)
      // App.astrodynamics.propagateL1(App.pathFinder.data.timestamp, true);

      // // Calculate offset
      // App.pathFinder.data.offset = App.astrodynamics.propagatedSL1Offset();

      App.pathFinder.chart = highcharts.chart(
        'chart-container',
        App.chartSettings
      );

      // $("#simulation-start-date").val(App.UI.moment(App.pathFinder.data.reference_timestamp*1000).format("D-MMM-YYYY"));

      $("#simulation-start-date").datepicker({
        dateFormat: 'd MM yy',
        firstDay: 1,
        onSelect: function(date) {
          var timestamp = App.UI.moment(date, "D MMM YYYY").unix();

          App.pathFinder.data.reference_timestamp = timestamp;
          App.pathFinder.data.timestamp = timestamp;
        }
      });

      // $("#simulation-start-date").datepicker('setDate', App.UI.moment(App.pathFinder.data.reference_timestamp*1000).toDate());

      // $("#simulation-start-date").datepicker("setDate", App.UI.moment(App.pathFinder.data.reference_timestamp*1000).toDate());
    },

    /**
     * Set data to highchart series
     */
    setData(name, data) {
      if(!App.pathFinder.data.visualisation_enabled) {
        return;
      }

      App.pathFinder.chart.series.find(
        el => el.name === name
      ).setData(data);
    },

    /**
     * Initialize exoplanet/NEO/solar series
     */
    initializePlot() {
      // Stop if already initialized
      if(App.pathFinder.data.initialized) {
        return;
      }

      // Add exoplanet series
      App.pathFinder.chart.addSeries({
        name: 'Exoplanets',
        color: 'rgba(0, 174, 0, .2)',
        animation: { duration: 0 },
        // If the following was left unset while initializing, this would break the plot later (weird)
        // So setting to some random value instead that will later be overriden by the actual data 
        data: [[104.23, 82.75]], // Sun's North pole (Z-axis) pointing
        zIndex: 930,
      });

      // Add Earth as a separate series
      App.pathFinder.chart.addSeries({
        name: 'Stationary',
        color: 'rgba(0, 78, 236, .5)',
        animation: { duration: 0 },
        data: [{ name: 'Earth', x: 0, y: 0 }], // Earth's position on the plot (center)
        dataLabels: {
          format: "{point.name}",
          enabled: true,
          style: {"color": "#276EFF", "fontSize": "10x", "fontFamily": "Calibri", "textOutline": "1px contrast" },
          padding: 7,
          allowOverlap: true,
          overflow: 'crop',
        },
        zIndex: 950,
      });

      // Add Solar system planets
      App.pathFinder.chart.addSeries({
        name: 'Objects',
        color: 'rgba(0, 78, 236, .5)',
        dataLabels: {
          format: "{point.name}",
          enabled: true,
          style: {"color": "#276EFF", "fontSize": "10x", "fontFamily": "Calibri", "textOutline": "1px contrast" },
          padding: 7,
          allowOverlap: true,
          overflow: 'crop',
        },
        animation: { duration: 0 },
        data: [[0, 89]], // Some random point at the top of the map
        zIndex: 940,
      });

      // Add NEO series
      App.pathFinder.chart.addSeries({
        name: 'NEOs',
        color: 'rgba(120, 120, 120, .5)',
        animation: { duration: 0 },
        marker: {
          radius: 2,
          symbol: 'circle',
        },
        // dataLabels: {
        //   format: "{point.name}",
        //   enabled: true,
        //   style: {"color": "#999999", "fontSize": "10x", "fontFamily": "Calibri", "textOutline": "1px contrast" },
        //   padding: 7,
        //   allowOverlap: true,
        //   overflow: 'crop',
        // },
        data: [[0, 89]], // Some random point at the top of the map
        zIndex: 945,
      });
      
      // Update UI indicators
      App.UI.initializePerformanceIndicator();
      App.UI.initialized();
    },
  }
};
