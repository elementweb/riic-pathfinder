let highcharts = require('highcharts');

module.exports = function(App) {
  App.pathFinder = {
    chart: {},

    data: {
      exoplanets: [],
      neos: [],
      exoplanet_series: [],
      exoplanets_in_view: [],
      exoplanets_in_scope: [],
      temp: [],
      horizontal_obs_angle: 50,
      vertical_obs_angle: 50,
      interval_id: null,
      initialized: false,
      timestamp: null,
      offset: null,
      scope_loaded: false,
      scope_size: [2, 2],
      target: {
        id: null, // target_id
        coordinates: [0, 0], // target
        translate: false, // translate_target
        time_selected: null
      },
      simulation: {
        timestep_sec: 60,
        delay: 0,
      },
      translation_counter: 0,
    },

    loop() {
      // Add timestep
      App.pathFinder.data.timestamp = App.pathFinder.data.timestamp*1 + App.pathFinder.data.simulation.timestep_sec;

      App.UI.setDate(App.pathFinder.data.timestamp);

      // Calculate offset
      var offset = App.conversion.timestampToAngle(App.pathFinder.data.timestamp);
      App.pathFinder.data.offset = offset;

      // Shift X-axis
      App.operations.shiftData(App.pathFinder.data.exoplanet_series, offset);

      App.pathFinder.data.exoplanets_in_view = App.operations.cropX(App.pathFinder.data.exoplanet_series, 50 + 10);
      App.pathFinder.data.exoplanets_in_scope = App.operations.crop(App.pathFinder.data.exoplanets_in_view, 50, 50);

      // Shift all data points on the plot
      App.pathFinder.data.translation_counter++;
      if(App.pathFinder.data.translation_counter > 100) {
        App.pathFinder.setData('Exoplanets', App.operations.prepareDataForPlot(App.pathFinder.data.exoplanets_in_view));
        // Translate telescope pointing (target) if required
        App.pathFinder.translateTarget(offset);
        App.pathFinder.data.translation_counter = 0;
      }

      // Have we exceeded sufficient integration time for selected target?
      var current_target = App.targeting.getTarget(App.pathFinder.data.target.id);
      if(current_target !== undefined && App.pathFinder.data.timestamp > App.pathFinder.data.target.time_selected + current_target.integration_time) {
        // If so, select next target
        App.debug.selectRandomTargetInScope();
      }

      // App.orbital.position.keplerian(5.20336301, 0.04839266, 1.30530*(3.14/180), 100.55615*(3.14/180), 14.75385*(3.14/180), 2451545.0, 2458635.5)[0]; // Jupiter
      for (i = 1; i <= 18000; i++) { 
        // App.orbital.position.keplerian(_.round((Math.random() * 10000) / 1000, 3), 0.04839266, 1.30530*(3.14/180), 100.55615*(3.14/180), 14.75385*(3.14/180), 2451545.0, 2458635.5)[0];
      }


      // _.each(App.pathFinder.data.exoplanet_series, function(series) {
      //   series[0] = App.operations.shift(series[0], 0.005, 360);
      // });

      // _.each(App.pathFinder.data.series.find(el => el.name === 'NEOs').data, function(series) {
      //   series[0] = series[0] - 0.01;
      //   if(series[0] < -25) {
      //     series[0] = series[0] + 50;
      //   }
      // });

      // App.pathFinder.refresh();
    },

    start() {
      if(App.pathFinder.data.interval_id !== null
        || !App.pathFinder.data.initialized
        || !App.UI.allSubjectsLoaded()) {
        return;
      }

      App.pathFinder.data.interval_id = setInterval(function() {
        App.pathFinder.loop();
      }, App.pathFinder.data.simulation.delay);

      App.UI.simulationStarted();
    },

    stop() {
      if(App.pathFinder.data.interval_id === null
        || !App.pathFinder.data.initialized
        || !App.UI.allSubjectsLoaded()) {
        return;
      }

      clearInterval(App.pathFinder.data.interval_id);
      App.pathFinder.data.interval_id = null;

      App.UI.simulationStopped();
    },

    initialize() {
      // Initialize plot
      App.pathFinder.chart = highcharts.chart('chart-container', App.chartSettings);
    },

    burnSeriesData(series, data) {
      App.pathFinder.chart.series.find(el => el.name === series).setData(data);
      //
    },

    initializePlot() {
      if(App.pathFinder.data.initialized) {
        return;
      }

      // Add exoplanet series
      App.pathFinder.chart.addSeries({
        name: 'Exoplanets',
        color: 'rgba(200, 200, 200, .5)',
        animation: { duration: 0 },
        // If the following was left unset while initializing, this would break the plot later (weird)
        // So setting to some random value instead that will later be overriden by the actual data 
        data: [[104.23, 82.75]], // Sun's North pole (Z-axis) pointing
      });
      
      App.UI.initialized();
    },

    addObservationRectangle() {
      if(App.pathFinder.data.scope_loaded) {
        return;
      }

      let $chart = App.pathFinder.chart;

      var xAxis = $chart.xAxis[0],
          yAxis = $chart.yAxis[0];

      var x = xAxis.toPixels(-25),
          y = yAxis.toPixels(25),
          size_x = xAxis.toPixels(25) - xAxis.toPixels(-25),
          size_y = yAxis.toPixels(-25) - yAxis.toPixels(25);
      
      // FOV Box
      $chart.renderer.rect(x, y, size_x, size_y).attr({
        'stroke-width': 1,
        stroke: '#868686',
        fill: 'rgba(68, 192, 0, .02)',
        zIndex: 0
      }).addClass('rect').add();

      // Vertical target path line
      $chart.renderer.path(['M', xAxis.toPixels(0), yAxis.toPixels(-25), 'L', xAxis.toPixels(0), yAxis.toPixels(25)]).attr({
        'stroke-width': 1, stroke: 'silver', dashstyle: 'dash'
      }).add();

      // Horizontal target path line
      $chart.renderer.path(['M', xAxis.toPixels(-25), yAxis.toPixels(0), 'L', xAxis.toPixels(25), yAxis.toPixels(0)]).attr({
        'stroke-width': 1, stroke: 'silver', dashstyle: 'dash'
      }).add();

      App.pathFinder.data.scope_loaded = true;
    },

    loadTargetWindow() {
      let $chart = App.pathFinder.chart;

      var xAxis = $chart.xAxis[0],
          yAxis = $chart.yAxis[0],
          size = App.pathFinder.data.scope_size,
          x = xAxis.toPixels(-size[0]),
          y = yAxis.toPixels(size[1]),
          size_x = xAxis.toPixels(size[0]) - xAxis.toPixels(-size[0]),
          size_y = yAxis.toPixels(-size[1]) - yAxis.toPixels(size[1]);
      
      // FOV Box
      $chart.renderer.rect(x, y, size_x, size_y).attr({
        'stroke-width': 1,
        stroke: '#0074E1',
        id: 'scope-target',
        fill: 'rgba(0, 116, 255, .1)',
        zIndex: 999
      }).addClass('rect').add();

      // Vertical target path line
      $chart.renderer.path(['M', xAxis.toPixels(0), yAxis.toPixels(-size[1]), 'L', xAxis.toPixels(0), yAxis.toPixels(size[1])]).attr({
        'stroke-width': 1, stroke: '#0074E1', dashstyle: 'solid', id: 'scope-vertical', zIndex: 999
      }).add();

      // Horizontal target path line
      $chart.renderer.path(['M', xAxis.toPixels(-size[0]), yAxis.toPixels(0), 'L', xAxis.toPixels(size[0]), yAxis.toPixels(0)]).attr({
        'stroke-width': 1, stroke: '#0074E1', dashstyle: 'solid', id: 'scope-horizontal', zIndex: 999
      }).add();
    },

    setTarget(x, y) {
      let $target = $('#scope-target'),
          $chart = App.pathFinder.chart,
          size = App.pathFinder.data.scope_size;

      if($target.length <= 0) {
        return;
      }

      var $horizontal = $('#scope-horizontal'),
          $vertical = $('#scope-vertical');

      x = App.arithmetics.wrapTo180(x);

      var px = $chart.xAxis[0].toPixels(-size[0] + x),
          py = $chart.yAxis[0].toPixels(size[1] + y),
          lx = $chart.xAxis[0].toPixels(x),
          ly = $chart.yAxis[0].toPixels(y),
          lsx = size[0] * 4,
          lsy = size[1] * 3;

      $target.attr({ x: px, y: py });
      $horizontal.attr('d', 'M ' + (lx - lsx) + ' ' + ly + ' L ' + (lx + lsx) + ' ' + ly);
      $vertical.attr('d', 'M ' + lx + ' ' + (ly - lsy) + ' L ' + lx + ' ' + (ly + lsy));
    },






    setScopedTarget(x, y) {
      x = App.arithmetics.constrainToFOV(x, 50);
      y = App.arithmetics.constrainToFOV(y, 50);

      App.pathFinder.setTarget(x, y);
      App.pathFinder.data.target.translate = false;
    },

    selectTargetById(id) {
      var target = App.targeting.getTarget(id);

      if(target.length <= 0) {
        return;
      }

      App.pathFinder.data.target.id = target.id;
      App.UI.setTargetDetails({
        name: target.pl_name,
        host: target.pl_hostname,
        optmag: _.round(target.st_optmag, 2),
        integration: App.conversion.secondsToReadableTimeString(target.integration_time),
      });
      App.pathFinder.setCelestialTarget(target.initial[0], target.initial[1]);
      App.pathFinder.data.target.time_selected = App.pathFinder.data.timestamp;
    },

    setCelestialTarget(x, y) {
      var resolved = App.pathFinder.resolveCelestialTarget(x, y);

      if(resolved.x < -25 || resolved.x > 25) {
        console.log('Target is out of scope');
        return;
      }
      
      App.pathFinder.data.target.coordinates = [x, y];
      App.pathFinder.setTarget(resolved.x, resolved.y);

      App.pathFinder.data.target.translate = true;
    },

    resolveCelestialTarget(x, y) {
      // x = App.arithmetics.wrapTo180(x + 90);

      return {
        x: App.arithmetics.wrapTo180(x + App.arithmetics.wrapTo180(App.pathFinder.data.offset)),
        y
      };
    },

    translateTarget(offset) {
      if(!App.pathFinder.data.target.translate) {
        return;
      }

      [x, y] = App.pathFinder.data.target.coordinates;

      var resolved = App.pathFinder.resolveCelestialTarget(x, y);

      if(resolved.x > 25) {
        console.log('Target is out of scope');
        App.pathFinder.data.target.translate = false;
        App.pathFinder.data.target.coordinates = [0, 0];
        // App.pathFinder.setScopedTarget(25, y); // or debug
        App.debug.selectRandomTargetInScope(); // debug
        return;
      }

      App.pathFinder.setTarget(resolved.x, resolved.y);
    },














    setData(name, data) {
      App.pathFinder.chart.series.find(el => el.name === name).setData(data);
    },

    moveExoplanetsIntoPlot() {
      var count = 0;

      // Process exoplanet data
      App.pathFinder.data.exoplanet_series = _.map(App.pathFinder.data.exoplanets, function(object) {
        object.id = ++count;
        object.initial = App.conversion.equatorialToMercator(object.ra, object.dec);
        object.mercator = JSON.parse(JSON.stringify(object.initial));
        object.integration_time = App.spectroscopy.integrationTime(object.st_optmag);

        return object;
      });

      // Crop data vertically
      App.pathFinder.data.exoplanet_series = App.operations.cropY(App.pathFinder.data.exoplanet_series, 50+10);

      // Zero-center data
      App.operations.zeroData(App.pathFinder.data.exoplanet_series);

      // Shift data into position
      App.UI.setDate(App.pathFinder.data.timestamp);
      var offset = App.conversion.timestampToAngle(App.pathFinder.data.timestamp);
      App.pathFinder.data.offset = offset;
      App.operations.shiftData(App.pathFinder.data.exoplanet_series, offset);

      App.pathFinder.data.exoplanets_in_view = App.operations.cropX(App.pathFinder.data.exoplanet_series, 50 + 10);
      App.pathFinder.data.exoplanets_in_scope = App.operations.crop(App.pathFinder.data.exoplanets_in_view, 50, 50);
      App.pathFinder.setData('Exoplanets', App.operations.prepareDataForPlot(App.pathFinder.data.exoplanets_in_view));

      // Load observation scope
      App.pathFinder.addObservationRectangle();

      // Load target window
      App.pathFinder.loadTargetWindow();
      App.pathFinder.setScopedTarget(App.pathFinder.data.target.coordinates[0], App.pathFinder.data.target.coordinates[1]);
    },

    loadData() {
      // Load exoplanets
      if(typeof App.cache.get('exoplanets') !== 'undefined') {
        App.pathFinder.data.exoplanets = App.cache.get('exoplanets');
        App.UI.subjectLoaded('exoplanets');
        App.pathFinder.moveExoplanetsIntoPlot();
      } else {
        App.UI.loading(true);
        $.getJSON("https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?format=json&table=exoplanets&select=pl_hostname,pl_name,pl_orbper,ra,dec,st_optmag,pl_trandur,pl_tranmid,pl_occdep&where=st_optmag%3E0%20and%20pl_tranflag%3E0", function( data ) {
          App.pathFinder.data.exoplanets = data;
          App.cache.set('exoplanets', data);
          App.UI.loading(false);
          App.UI.subjectLoaded('exoplanets');
          App.pathFinder.moveExoplanetsIntoPlot();
        });
      }

      // Load NEOS
      App.UI.subjectLoaded('neos');
      
      // Load solar system objects
      App.UI.subjectLoaded('objects');

      // Set flag and disable button
      App.UI.dataLoaded();
    }
  }
};
