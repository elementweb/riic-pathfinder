module.exports = function(App) {
  App.statistics = {
    counters: {
      exoplanets_scanned: 0,
      neos_scanned: 0,
      daily_imp_scans: 0
    },

    data: {
      angle: 180
    },

    initialize() {
      App.statistics.initialData = JSON.parse(JSON.stringify(App.statistics.data));
    },

    resetCounters() {
      _.each(App.statistics.counters, function(value, key) {
        App.statistics.counters[key] = 0;
      });
    },

    resetData() {
      App.statistics.data = JSON.parse(JSON.stringify(App.statistics.initialData));
    }
  }
};
