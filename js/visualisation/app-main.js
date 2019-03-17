module.exports = function(App) {
  App.main = {
    data: App.cache.get('scan-data-export'),

    settings: {
      line_width: 600, // px
    },

    injectJSONData(json) {
      App.cache.set('scan-data-export', JSON.parse(json));
    },

    load() {
      if(_.isEmpty(App.main.data)) {
        return;
      }

      // Load statistics
      App.main.loadStatistics();

      // Load operations
      App.main.loadOperations();

      // Un-hide the screen
      $('#visualisation-container').removeClass('hidden');
      $('#data-import-container').addClass('hidden');
    },

    loadStatistics() {
      var started = App.moment.unix(App.main.data.started).format("MMMM D, YYYY HH:mm:ss"),
          ended = App.moment.unix(App.main.data.ended).format("MMMM D, YYYY HH:mm:ss"),
          duration = _.round((App.main.data.ended - App.main.data.started) / (24 * 3600));

      $('#simulation-started').html(started);
      $('#simulation-ended').html(ended);
      $('#duration').html(duration);
      $('#simulation-timestep').html(App.main.data.timestep);
      $('#telescope-size').html(App.main.data.telescope);
      
      $('#neos-scanned').html(App.main.data.neos_scanned);
      $('#exoplanets-scanned').html(App.main.data.exoplanets_scanned);
      $('#exoplanet-avg-scan-time').html(_.round(App.main.data.exoplanet_avg_scan_time / 60));
      $('#neo-avg-scan-time').html(_.round(App.main.data.neo_avg_scan_time / 60));
      
      $('#time-neo-scans').html(App.main.data.time_neo_scans);
      $('#time-exoplanet-scans').html(App.main.data.time_exoplanet_scans);
      $('#time-idle').html(App.main.data.time_idle);

      $('#max-slew-rate').html(App.main.data.max_slew_rate);
      $('#earth-exclusion').html(App.main.data.earth_exclusion);
      $('#exoplanet-spectroscopy-limiting').html(App.main.data.exoplanet_spectroscopy_limiting);
      $('#neo-spectroscopy-limiting').html(App.main.data.neo_spectroscopy_limiting);

      $('#total-data-produced').html(App.main.data.total_data_produced_tb);
    },

    selectDay(day) {
      if($('#operation-day-' + day).length) {
        return;
      }

      var $operation_container = $('#operation-container');

      $operation_container.append('<div class="day-operation" id="operation-day-' + day + '"><span class="operation-bar"></span></div>');
    },

    addOperationBar(day, type, start, width) {
      App.main.selectDay(day);

      var $bar_container = $('#operation-day-' + day + ' > .operation-bar');

      $bar_container.append('<span class="' + type + '-scan" style="left: ' + start + 'px; width: ' + width + 'px"></span>');
    },

    secondsToPixels(seconds) {
      var ADAY = 24 * 3600; // seconds

      return _.round((seconds * App.main.settings.line_width) / ADAY, 2);
    },

    addOperation(start, end, type) {
      var reference = App.main.data.started,
          ADAY = 24 * 3600; // seconds

      let day_start = App.math.ceil((start - reference) / ADAY),
          day_end = App.math.ceil((end - reference) / ADAY),
          width = App.main.secondsToPixels(end - start);

      if(width < 1) {
        width = 1;
      }

      let seconds_start = App.math.mod(start - reference, ADAY),
          position = App.main.secondsToPixels(seconds_start);

      App.main.addOperationBar(day_start, type, position, width);
      
      if(day_end > day_start) {
        var cut = App.main.settings.line_width - position;

        App.main.addOperationBar(day_end, type, -cut, width);
      }
    },

    loadDays() {
      var days = _.ceil((App.main.data.ended - App.main.data.started) / (24 * 3600));

      for (var day = 1; day <= days; day++) {
        App.main.selectDay(day);
      }
    },

    loadOperations() {
      // Load all days
      App.main.loadDays();

      _.each(App.main.data.operations, function(operation) {
        var type;

        if(operation.type == 1) {
          type = 'exoplanet';
        }

        if(operation.type == 2) {
          type = 'neo';
        }

        App.main.addOperation(operation.begin, operation.end, type);
      });
    },
  }
};
