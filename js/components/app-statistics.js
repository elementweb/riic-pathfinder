module.exports = function(App) {
  App.statistics = {
    counters: {
      exoplanets_scanned: 0,
    },

    stats: {
      total_aocs_change: 0,
      total_integration_time: 0,
    },

    data: {
      angle: 180,
    },

    initialize() {
      App.statistics.initialData = JSON.parse(JSON.stringify(App.statistics.data));
    },

    daysSinceStart() {
      return _.round((App.pathFinder.data.timestamp - App.pathFinder.data.reference_timestamp) / 86400, 2);
    },

    resetCounters() {
      _.each(App.statistics.counters, function(value, key) {
        App.statistics.counters[key] = 0;
      });
    },

    incrementCounter(key) {
      App.statistics.counters[key]++;
      App.statistics.updateCounters();
    },

    updateCounters() {
      _.each(App.statistics.counters, function(value, key) {
        $('#counter-' + key).html(value);
      });
    },

    updateStatistics() {
      // Update Total AOCS angle
      var angle_change = App.statistics.stats.total_aocs_change;
      $('#stats-total_aocs_change').html(_.round(angle_change, 2).toFixed(2));

      days = App.statistics.daysSinceStart();
      if(days > 0) {
        // Update AOCS angle change per day
        $('#stats-avg_aocs_change').html(_.round(angle_change / days, 2).toFixed(2));
      }

      // Update total integration time
      $('#stats-total_integration_time').html(_.round(App.statistics.stats.total_integration_time / 3600, 2).toFixed(2));

      if(days > 1) {
        // Update explanets scanned per day
        $('#stats-exoplanets_per_day').html(_.round(App.statistics.counters.exoplanets_scanned / days, 1).toFixed(1));

        // Update average integration time
        $('#stats-avg_int_time').html(_.round((App.statistics.stats.total_integration_time / App.statistics.counters.exoplanets_scanned) / 3600, 2).toFixed(2));

        // Update average integration time per day
        $('#stats-avg_int_time_day').html(_.round(((App.statistics.stats.total_integration_time / 3600) / days), 2).toFixed(2));
      }
    },

    incrementIntegrationTime(time) {
      App.statistics.stats.total_integration_time = App.statistics.stats.total_integration_time + time;
      App.statistics.updateStatistics();
    },

    resetData() {
      App.statistics.data = JSON.parse(JSON.stringify(App.statistics.initialData));
    },

    updateMissionLifetime() {
      $('#mission-lifetime').html(_.round(App.statistics.daysSinceStart()));
    },

    angleChangeAOCS(angle) {
      App.statistics.stats.total_aocs_change = App.statistics.stats.total_aocs_change + angle;
      App.statistics.updateStatistics();
    }
  }
};
