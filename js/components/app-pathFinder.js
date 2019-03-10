let highcharts = require('highcharts');

module.exports = function(App) {
  App.pathFinder = {
    chart: {},

    data: {
      object_series: [],
      exoplanet_series: [],
      neos_series: [],
      exoplanets_in_view: [],
      objects_in_view: [],
      neos_in_view: [],
      exoplanets_in_scope: [],
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
      target: {
        id: null,
        coordinates: [0, 0],
        translate: false,
        time_selected: null
      },
      simulation: {
        timestep_sec: 3600*2,
        delay: 0,
      },
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
      App.pathFinder.data.object_series = _.map(App.pathFinder.data.object_series, function(object) {
        var cartesian = App.astrodynamics.L1cartesianAtUnix(object.kepler, App.pathFinder.data.timestamp, App.astrodynamics.constants.timestamp_mjd2000);

        object.mercator = App.conversion.cartesianToScopedMercator(cartesian[0], cartesian[1], cartesian[2], App.pathFinder.data.offset);

        return object;
      });

      // Propagate orbits of NEOs
      App.pathFinder.data.neos_series = _.map(App.pathFinder.data.neos_series, function(object) {
        object.schedule = object.schedule - 1;
        
        if(object.schedule >= 1) {
          return object;
        }

        var cartesian = App.astrodynamics.L1cartesianAtUnix(object.kepler, App.pathFinder.data.timestamp, object.reference);

        object.mercator = App.conversion.cartesianToScopedMercator(cartesian[0], cartesian[1], cartesian[2], App.pathFinder.data.offset);
        object.schedule = App.neos.propagationScheduler(cartesian);

        return object;
      });

      // Shift all data points on the plot
      App.pathFinder.data.translation_counter++;
      if(App.pathFinder.data.translation_counter > App.pathFinder.data.refresh_rate) {
        // Exoplanets
        App.pathFinder.setData('Exoplanets', App.exoplanets.prepareDataForPlot(App.pathFinder.data.exoplanets_in_view));
        App.targeting.translateTarget(App.pathFinder.data.offset);

        // Solar objects
        App.pathFinder.setData('Objects', App.objects.prepareDataForPlot(App.pathFinder.data.object_series));

        // NEOs
        App.pathFinder.data.neos_in_view = App.operations.cropX(App.pathFinder.data.neos_series, 50 + 10);
        App.pathFinder.setData('NEOs', App.neos.prepareDataForPlot(App.pathFinder.data.neos_in_view));

        App.pathFinder.data.translation_counter = 0;
      }

      /**
       * NEO orbit propagation
       */
      // App.orbital.position.keplerian(5.20336301, 0.04839266, 1.30530*(3.14/180), 100.55615*(3.14/180), 14.75385*(3.14/180), 2451545.0, 2458635.5)[0]; // Jupiter
      // for (i = 1; i <= 9000; i++) { 
      //   App.orbital.position.keplerian(_.round((Math.random() * 10000) / 1000, 3), 0.04839266, 1.30530*(3.14/180), 100.55615*(3.14/180), 14.75385*(3.14/180), 2451545.0, 2458635.5)[0];
      // }
      // App.orbital.time.dateToJD([2019, 2, 28, 0, 4, 0])
      // for (i = 1; i <= 9000; i++) { 
      //   1+i;
      // }
      // Need to shift all objects on the plot here too

      /**
       * Targeting decisions happens here (after all orbits propagated and plot updated)
       */
      if(!App.pathFinder.data.target_selected) {
        // Can we select exoplanet
        var next_target = App.exoplanets.feasibleTargetSelector(App.pathFinder.data.exoplanets_in_scope, App.pathFinder.data.timestamp);
        if(next_target) {
          App.pathFinder.data.target_selected = true;
          App.exoplanets.selectExoplanetTargetById(next_target.id);
        }
      }

      /**
       * Checking if currently selected exoplanet has exceeded integration time
       */
      var current_target = App.targeting.getTarget(App.pathFinder.data.target.id);
      if(current_target !== undefined && App.pathFinder.data.timestamp > App.pathFinder.data.target.time_selected + current_target.integration_time) { // when will start
        current_target.spect_num++;
        current_target.last_spectroscopy = App.pathFinder.data.timestamp;
        App.statistics.incrementCounter('exoplanets_scanned');
        App.statistics.incrementIntegrationTime(current_target.integration_time);
        App.comms.addData(App.spectroscopy.dataRate(current_target.integration_time));
        App.pathFinder.data.target_selected = false;
        App.targeting.discardTarget();
      }









      // Lastly update performance counter
      App.pathFinder.data.iterations++;
      if(App.pathFinder.data.iterations > 200) {
        App.UI.updateIPS(App.pathFinder.data.iteration_reference, App.pathFinder.data.iterations);
        App.pathFinder.data.iterations = 0;
        App.pathFinder.data.iteration_reference = App.UI.currentTimestampMs();
        App.statistics.updateMissionLifetime();
      }

      // Debug
      App.debug.loopInjection();
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
     * Initialize highcharts
     */
    initialize() {
      App.pathFinder.data.reference_timestamp = JSON.parse(JSON.stringify(App.pathFinder.data.timestamp));

      App.pathFinder.chart = highcharts.chart(
        'chart-container',
        App.chartSettings
      );
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
        data: [[0, 89]], // Some random point at the top of the map
        zIndex: 945,
      });
      
      // Update UI indicators
      App.UI.initializePerformanceIndicator();
      App.UI.initialized();
    },
  }
};
