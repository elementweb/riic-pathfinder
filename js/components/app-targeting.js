module.exports = function(App) {
  App.targeting = {
    data: {
      current_target: [0, 0]
    },

    settings: {
      reorientation_speed: 0.45, // deg/sec
      early_warning_speed: 0.01, // deg/s
      earth_exclusion_deg: 5 // radius in degrees
    },

    timeRequired(angle) {
      return _.round(angle / App.targeting.data.reorientation_speed);
    },

    getTarget(id) {
      return App.pathFinder.data.exoplanet_series.find(el => el.id === id);
    },

    /**
     * Add big square box inside the plot from within all observations should be carried out 
     */
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

    /**
     * Add dashed line limits for Early Warning scans
     */
    addEarlyWarningScopeLimits() {
      let $chart = App.pathFinder.chart;

      var xAxis = $chart.xAxis[0],
          yAxis = $chart.yAxis[0];

      var left = xAxis.toPixels(-25 + App.pathFinder.data.scope_size[0]*2),
          right = xAxis.toPixels(25 - App.pathFinder.data.scope_size[0]*2);

      // Left target path line
      $chart.renderer.path(['M', left, yAxis.toPixels(-25), 'L', left, yAxis.toPixels(25)]).attr({
        'stroke-width': 1, stroke: 'silver', dashstyle: 'dot'
      }).add();

      // Right target path line
      $chart.renderer.path(['M', right, yAxis.toPixels(-25), 'L', right, yAxis.toPixels(25)]).attr({
        'stroke-width': 1, stroke: 'silver', dashstyle: 'dot'
      }).add();
    },

    /**
     * Load Target scope indicator
     */
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

    loadEarthExclusionIndicator() {
      let $chart = App.pathFinder.chart,
          xAxis = $chart.xAxis[0],
          yAxis = $chart.yAxis[0],
          cx = xAxis.toPixels(0),
          cy = yAxis.toPixels(0),
          size = App.targeting.settings.earth_exclusion_deg,
          rx = xAxis.toPixels(size) - xAxis.toPixels(0),
          ry = yAxis.toPixels(0) - yAxis.toPixels(size);

      $chart.renderer.createElement('ellipse').attr({
        cx, cy, rx, ry,
        'stroke-width': 1,
        stroke: 'silver',
        fill: 'rgba(0, 138, 255, .05)',
        dashstyle: 'dash',
        zIndex: 990
      }).add();
    },

    /**
     * Set target to given coordinates
     */
    setTarget(x, y) {
      if(!App.pathFinder.data.visualisation_enabled) {
        return;
      }
      
      let $target = $('#scope-target'),
          $chart = App.pathFinder.chart,
          size = App.pathFinder.data.scope_size;

      if($target.length <= 0) {
        return;
      }

      App.targeting.data.current_target = [x, y];

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

    /**
     * Set target within observation scope and do not translate i.e. keep the pointing stable
     */
    setScopedTarget(x, y) {
      x = App.arithmetics.constrainToFOV(x, 50);
      y = App.arithmetics.constrainToFOV(y, 50);

      App.statistics.angleChangeAOCS(App.arithmetics.angleBetweenMercatorVectors(
        App.targeting.data.current_target,
        [x, y]
      ));

      App.targeting.setTarget(x, y);
      App.pathFinder.data.target.translate = false;
    },

    /**
     * Target celestial object 0-360deg
     */
    setCelestialTarget(x, y) {
      var resolved = App.targeting.resolveCelestialTarget(x, y);

      if(resolved.x < -25 || resolved.x > 25) {
        App.log('Target is out of scope');
        return;
      }

      App.statistics.angleChangeAOCS(App.arithmetics.angleBetweenMercatorVectors(
        App.targeting.data.current_target,
        [resolved.x, resolved.y]
      ));
      
      App.pathFinder.data.target.coordinates = [x, y];
      App.targeting.setTarget(resolved.x, resolved.y);
      App.pathFinder.data.target.translate = true;
    },

    /**
     * Point spacecraft towards Earth
     */
    setTargetEarth() {
      App.targeting.setScopedTarget(0, 0);
      App.UI.targetSelected('earth');
    },

    /**
     * Obtain position on scope diagram of given celestial target in 0-360deg range
     */
    resolveCelestialTarget(x, y) {
      // x = App.arithmetics.wrapTo180(x + 90); // uncomment this in case resolving from Matlab coordinates
      offset = App.arithmetics.wrapTo180(App.pathFinder.data.offset);

      return { x: App.arithmetics.wrapTo180(x + offset), y };
    },

    /**
     * Track target and move target scope along
     */
    translateTarget(offset) {
      if(!App.pathFinder.data.target.translate) {
        return;
      }

      [x, y] = App.pathFinder.data.target.coordinates;

      var resolved = App.targeting.resolveCelestialTarget(x, y);

      if(resolved.x > 25) {
        App.log('Target is out of scope');
        App.targeting.discardTarget();
        // App.targeting.setScopedTarget(25, y); // or debug
        // App.debug.selectRandomTargetInScope(); // debug
        return;
      }

      App.targeting.setTarget(resolved.x, resolved.y);
    },

    /**
     * Stop tracking target and keep the pointing stable
     */
    discardTarget() {
      App.pathFinder.data.target.id = null;
      App.pathFinder.data.target.translate = false;
      App.pathFinder.data.target.coordinates = [0, 0];
      App.pathFinder.data.target.time_selected = null;
      App.UI.targetSelected(false);
    }
  }
};
