module.exports = function(App) {
  App.statistics = {
    counters: {
      exoplanets_scanned: 0,
      neos_scanned: 0,
    },

    stats: {
      total_data_produced: 0, // bits
      slew: {
        max_rate: 0 // deg/hr
      },
      storage_capacity: {
        exceeded: false,
        amount: 0,
      },
      integrations: {
        neo_scans: [],
        exoplanet_scans: [],
      },
      operations: {
        neo_scans: [],
        exoplanet_scans: [],
      },
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
      var angle_change = App.statistics.stats.total_aocs_change,
          data_produced = App.statistics.stats.total_data_produced;

      let days = App.statistics.daysSinceStart();

      // Update total data produced indicator
      $('#stats-total_data_produced').html(_.round(data_produced / 1e12, 2).toFixed(2));

      if(days > 1) {
        // Update explanets scanned per day
        $('#stats-exoplanets_per_day').html(_.round(App.statistics.counters.exoplanets_scanned / days, 1).toFixed(1));

        // Update NEOs scanned per day
        $('#stats-neos_per_day').html(_.round(App.statistics.counters.neos_scanned / days, 1).toFixed(1));
      }
    },

    resetData() {
      App.statistics.data = JSON.parse(JSON.stringify(App.statistics.initialData));
    },

    updateMissionLifetime() {
      if(App.pathFinder.data.lifetime_exceeded) {
        return;
      }

      var days_since_start = App.statistics.daysSinceStart(),
          lifetime_days = App.pathFinder.data.lifetime_days;

      percent = _.round(App.statistics.daysSinceStart() * 100 / App.pathFinder.data.lifetime_days);

      var string = percent;

      if(percent > 100) {
        percent = 100;
        string = 100;
      } else if(percent < 5) {
        percent = 5;
      }

      $('#mission-lifetime').css({ width: percent + '%' }).html(string + '%');
    },

    stopAtTheEnd() {
      var days_since_start = App.statistics.daysSinceStart(),
          lifetime_days = App.pathFinder.data.lifetime_days,
          lifetime_exceeded = App.pathFinder.data.lifetime_exceeded;

      if(!lifetime_exceeded && days_since_start > lifetime_days) {
        App.pathFinder.data.lifetime_exceeded = true;
        App.settings.$emit("lifetime-exceeded");

        if(App.pathFinder.data.stop_at_the_end) {
          App.pathFinder.stop();
          $('#button-start').html('Continue');
        }
      }
    },

    dataTransmitted(amount) {
      return;
    },

    dataProduced(amount) {
      if(!isFinite(amount)) {
        return;
      }

      App.statistics.stats.total_data_produced = App.statistics.stats.total_data_produced + amount;
      App.statistics.updateStatistics();
    },

    determineMaxSlewRate(rate) {
      if(!isFinite(rate)) {
        return;
      }

      if(rate > App.statistics.stats.slew.max_rate) {
        App.statistics.stats.slew.max_rate = rate;
        $('#stats-max_slew_rate').html(_.round(rate, 2).toFixed(2));
      }
    },

    logOperationTime(type, time) {
      if(type == App.targeting.target_types.neo) {
        App.statistics.stats.operations.neo_scans.push(_.round(time));
        return;
      }

      App.statistics.stats.operations.exoplanet_scans.push(_.round(time));
    },

    logIntegrationTime(type, time) {
      if(type == App.targeting.target_types.neo) {
        App.statistics.stats.integrations.neo_scans.push(_.round(time));
        return;
      }

      App.statistics.stats.integrations.exoplanet_scans.push(_.round(time));
    },
  
    scanningOperationTimeBreakdown() {
      var exoplanets_scanning_total = App.math.sum(App.statistics.stats.operations.exoplanet_scans),
          neos_scanning_total = App.math.sum(App.statistics.stats.operations.neo_scans),
          total_time = App.pathFinder.data.timestamp - App.pathFinder.data.reference_timestamp;

      let exoplanets_scan_percent = _.round(exoplanets_scanning_total * 100 / total_time, 1),
          neos_scan_percent = _.round(neos_scanning_total * 100 / total_time, 1),
          idle_percent = _.round(100 - exoplanets_scan_percent - neos_scan_percent, 1);

      return [
        exoplanets_scan_percent,
        neos_scan_percent,
        idle_percent,
      ];
    },

    averageScanningTime() {
      var integrations = App.statistics.stats.integrations;

      return [
        _.round(App.math.mean(!_.isEmpty(integrations.exoplanet_scans) ? integrations.exoplanet_scans : [0])),
        _.round(App.math.mean(!_.isEmpty(integrations.neo_scans) ? integrations.neo_scans : [0])),
      ];
    },
  }
};
