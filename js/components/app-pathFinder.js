let highcharts = require('highcharts');

module.exports = function(App) {
  App.pathFinder = {
    chart: {},

    data: {
      exoplanets: [],
      neos: [],
      objects: [],
      object_series: [],
      exoplanet_series: [],
      exoplanets_in_view: [],
      objects_in_view: [],
      exoplanets_in_scope: [],
      transiting_exoplanets: [],
      temp: [],
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
        timestep_sec: 60,
        delay: 0,
      },
      translation_counter: 0,
      refresh_rate: 10,
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

      // Calculate offset
      App.pathFinder.data.offset = App.conversion.timestampToAngle(App.pathFinder.data.timestamp);

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
        let cartesian = App.objects.L1cartesianAtUnix(object.kepler, App.pathFinder.data.timestamp);

        object.mercator = App.objects.cartesianToScopedMercator(cartesian[0], cartesian[1], cartesian[2], App.pathFinder.data.offset);

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
        color: 'rgba(223, 0, 0, .2)',
        animation: { duration: 0 },
        // If the following was left unset while initializing, this would break the plot later (weird)
        // So setting to some random value instead that will later be overriden by the actual data 
        data: [[104.23, 82.75]], // Sun's North pole (Z-axis) pointing
      });

      // Add Earth as a separate series
      App.pathFinder.chart.addSeries({
        name: 'Stationary',
        color: 'rgba(64, 132, 255, 1)',
        animation: { duration: 0 },
        data: [[0, 0]], // Earth's position on the plot (center)
      });

      // Add Earth as a separate series
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
      });
      
      App.UI.initializePerformanceIndicator();
      App.UI.initialized();
    },

    /**
     * Download data or load from browser localStorage (cache)
     */
    loadData() {
      // Load exoplanets
      if(typeof App.cache.get('exoplanets') !== 'undefined') {
        App.pathFinder.data.exoplanets = App.cache.get('exoplanets');
        App.UI.subjectLoaded('exoplanets');
        App.exoplanets.moveExoplanetsIntoPlot();
      } else {
        App.UI.loading(true);
        let baseURL = "https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?format=json";

        // Full list of columns available: https://exoplanetarchive.ipac.caltech.edu/docs/API_exoplanet_columns.html
        let columns = [
          'pl_hostname',    // Host Star Name - Stellar name most commonly used in the literature
          'pl_name',        // Planet Name - Planet name most commonly used in the literature
          'pl_discmethod',  // Discovery Method - Method by which the planet was first identified
          'pl_orbper',      // Orbital Period (days) - Time the planet takes to make a complete orbit around the host star or system 
          'ra',             // RA (decimal degrees) - Right Ascension of the planetary system in decimal degrees
          'dec',            // Dec (decimal degrees) - Declination of the planetary system in decimal degrees
          'st_optmag',      // Optical Magnitude [mag] - Brightness of the host star as measured using the V (Johnson) or the Kepler-band in units of magnitudes
          'pl_trandur',     // Transit Duration (days) - The length of time from the moment the planet begins to cross the stellar limb to the moment the planet finishes crossing the stellar limb
          'pl_tranmid',     // Transit Midpoint (Julian days) - The time given by the average of the time the planet begins to cross the stellar limb and the time the planet finishes crossing the stellar limb
          'pl_occdep',      // Occultation Depth - Depth of occultation of secondary eclipse
          'st_rad',         // Stellar Radius (solar radii) - Length of a line segment from the center of the star to its surface, measured in units of radius of the Sun.
          'pl_rads',        // Planet Radius (solar) - Length of a line segment from the center of the planet to its surface, measured in units of radius of the Sun
          'pl_imppar',      // Impact Parameter - The sky-projected distance between the center of the stellar disc and the center of the planet disc at conjunction, normalized by the stellar radius
          'pl_orbsmax',     // Orbit Semi-Major Axis (AU) - The longest radius of an elliptic orbit, or, for exoplanets detected via gravitational microlensing or direct imaging, the projected separation in the plane of the sky
          'st_dist',        // Distance (pc) - Distance to the planetary system in units of parsecs
          'pl_eqt',         // Planet Equilibrium Temperature [K] - The equilibrium temperature of the planet as modeled by a black body heated only by its host star
          'pl_trandep',     // Transit Depth (percentage) - The size of the relative flux decrement caused by the orbiting body transiting in front of the star
          'pl_disc',        // Year of Discovery - Year the planet was discovered
          'pl_status',      // Status - Status of the planet (1 = announced, 2 = submitted, 3 = accepted, 0 = retracted)
          'st_spstr',       // Spectral Type - Classification of the star based on their spectral characteristics following the Morgan-Keenan system
          'st_spn'          // Number of Spectral Type measurements
        ];

        let required_columns = [
          'st_optmag',      // We require optical magnitude to be provided so we know integration times required
          'pl_tranflag',    // Exoplanet must be transiting so we are able to observe it
          'pl_tranmid'      // We must know when the transit is going to happen
        ];

        let requestURL = baseURL
          + "&table=exoplanets&select=" + columns.join(',')
          + "&where=" + required_columns.join('%3E0%20and%20')
          + "%3E0" + "%20and%20pl_ttvflag=0";

        $.getJSON(requestURL, function(data) {
          App.pathFinder.data.exoplanets = data;
          App.cache.set('exoplanets', data);
          App.UI.subjectLoaded('exoplanets');
          App.exoplanets.moveExoplanetsIntoPlot();
        });
      }

      // Load NEOS
      App.UI.subjectLoaded('neos');
      
      // Load solar system objects
      $.getJSON("data/solar-objects-mjd2000.json", function(data) {
        App.pathFinder.data.objects = data;
        App.UI.subjectLoaded('objects');
        App.objects.moveObjectsIntoPlot();
      });

      // Set flag and disable button
      App.UI.dataLoaded();
    }
  }
};
