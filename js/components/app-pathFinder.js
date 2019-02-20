let highcharts = require('highcharts');

module.exports = function(App) {
  App.pathFinder = {
    chart: {},

    data: {
      exoplanets: [],
      neos: [],
      exoplanet_series: [],
      temp: [],
      horizontal_obs_angle: 50,
      vertical_obs_angle: 50,
      interval_id: null,
      initialized: false,
      timestamp: null,
      scope_loaded: false
    },

    loop() {
      App.pathFinder.data.timestamp = App.pathFinder.data.timestamp + 3600;

      // let delta = App.conversion.millisecondsToAngle(App.pathFinder.data.timestamp);

      // Shift X-axis
      App.pathFinder.data.temp = App.operations.offsetData(App.pathFinder.data.exoplanet_series, 0, -0.05);

      App.pathFinder.data.temp = App.operations.cropX(App.pathFinder.data.temp, 50+10);
      App.pathFinder.setData('Exoplanets', App.pathFinder.data.temp);

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
      if(App.pathFinder.data.interval_id !== null) {
        return;
      }

      App.pathFinder.data.interval_id = setInterval(function() {
        App.pathFinder.loop();
      }, 10);

      App.UI.simulationStarted();
    },

    stop() {
      if(App.pathFinder.data.interval_id === null) {
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
        color: 'rgba(232, 186, 0, .5)',
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

      let chart = App.pathFinder.chart;

      var xAxis = chart.xAxis[0],
          yAxis = chart.yAxis[0];

      var x = xAxis.toPixels(-25),
          y = yAxis.toPixels(25),
          size_x = xAxis.toPixels(25) - xAxis.toPixels(-25),
          size_y = yAxis.toPixels(-25) - yAxis.toPixels(25);
      
      // FOV Box
      chart.renderer.rect(x, y, size_x, size_y).attr({
        'stroke-width': 1,
        stroke: '#868686',
        fill: 'rgba(68, 192, 0, .02)',
        zIndex: 0
      }).addClass('rect').add();

      // Vertical target path line
      chart.renderer.path(['M', xAxis.toPixels(0), yAxis.toPixels(-25), 'L', xAxis.toPixels(0), yAxis.toPixels(25)]).attr({
        'stroke-width': 2, stroke: 'silver', dashstyle: 'dash'
      }).add();

      // Horizontal target path line
      chart.renderer.path(['M', xAxis.toPixels(-25), yAxis.toPixels(0), 'L', xAxis.toPixels(25), yAxis.toPixels(0)]).attr({
        'stroke-width': 2, stroke: 'silver', dashstyle: 'dash'
      }).add();

      App.pathFinder.data.scope_loaded = true;
    },

    addTargetWindow(x, y) {
      var xAxis = chart.xAxis[0],
          yAxis = chart.yAxis[0];

      var x = xAxis.toPixels(-25),
          y = yAxis.toPixels(25),
          size_x = xAxis.toPixels(25) - xAxis.toPixels(-25),
          size_y = yAxis.toPixels(-25) - yAxis.toPixels(25);
      
      // FOV Box
      chart.renderer.rect(x, y, size_x, size_y).attr({
        'stroke-width': 1,
        stroke: '#868686',
        fill: 'rgba(68, 192, 0, .02)',
        zIndex: 0
      }).addClass('rect').add();

      // Vertical target path line
      chart.renderer.path(['M', xAxis.toPixels(0), yAxis.toPixels(-25), 'L', xAxis.toPixels(0), yAxis.toPixels(25)]).attr({
        'stroke-width': 2, stroke: 'silver', dashstyle: 'dash'
      }).add();

      // Horizontal target path line
      chart.renderer.path(['M', xAxis.toPixels(-25), yAxis.toPixels(0), 'L', xAxis.toPixels(25), yAxis.toPixels(0)]).attr({
        'stroke-width': 2, stroke: 'silver', dashstyle: 'dash'
      }).add();
    },

    shiftTargetWindow() {
      //
    },

    setData(name, data) {
      App.pathFinder.chart.series.find(el => el.name === name).setData(data);
    },

    moveExoplanetsIntoPlot() {
      // Process exoplanet data
      App.pathFinder.data.exoplanet_series = _.map(App.pathFinder.data.exoplanets, function(object) {
        return App.conversion.equatorialToMercator(object.ra, object.dec);
      });

      // Crop data vertically
      App.pathFinder.data.exoplanet_series = App.operations.cropY(App.pathFinder.data.exoplanet_series, 50+10);

      // Zero-center data
      App.pathFinder.data.exoplanet_series = App.operations.zeroData(App.pathFinder.data.exoplanet_series, 0, -108.42339);

      App.pathFinder.data.temp = App.operations.cropX(App.pathFinder.data.exoplanet_series, 50+10);
      App.pathFinder.setData('Exoplanets', App.pathFinder.data.temp);

      // Load observation scope
      App.pathFinder.addObservationRectangle();
    },

    loadData() {
      // Load exoplanets
      if(typeof App.cache.get('exoplanets') !== 'undefined') {
        App.pathFinder.data.exoplanets = App.cache.get('exoplanets');
        App.UI.subjectLoaded('exoplanets');
        App.pathFinder.moveExoplanetsIntoPlot();
      } else {
        App.UI.loading(true);
        $.getJSON("https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?format=json&table=exoplanets&select=ra,dec,st_optmag&where=st_optmag>0%20and%20pl_tranflag>0", function( data ) {
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
