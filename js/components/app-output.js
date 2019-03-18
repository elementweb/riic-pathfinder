var Vue = require('vue');

Vue.config.devtools = false;
Vue.config.productionTip = false;

module.exports = function(App) {
  App.output = {
    data: {
      operations: [],
    },

    settings: new Vue({
      el: '#pathfinder-output-settings',

      data: {
        simulation: {
          timestep: _.round(App.pathFinder.data.simulation.timestep_sec),
          visualisation: App.pathFinder.data.visualisation_enabled ? 1 : 0,
          refresh_rate: _.round(App.pathFinder.data.refresh_rate),
        },
      },

      watch: {
        'simulation.timestep': value => {
          App.pathFinder.data.simulation.timestep_sec = parseInt(value);
          App.UI.updateTimestep(App.pathFinder.data.simulation.timestep_sec);
        },

        'simulation.visualisation': value => {
          App.pathFinder.data.visualisation_enabled = value == 1;
          $('#visualisation-status').toggleClass('hidden', App.pathFinder.data.visualisation_enabled);
        },

        'simulation.refresh_rate': value => {
          App.pathFinder.data.refresh_rate = parseInt(value);
        },
      },
    }),

    operationCompleted(type, time_start, time_end, data) {
      App.output.data.operations.push({
        type,
        begin: time_start,
        end: time_end,
        data,
      });
    },

    prepareOperationsForExport() {
      var neo_limiting_integration = _.round(App.neos.settings.int_time_limit / 60),
          neo_limiting_vmag = _.round(App.neos.settings.vmag_limit, 2),
          time_breakdown = App.statistics.scanningOperationTimeBreakdown(),
          avg_scan_time = App.statistics.averageScanningTime();

      return {
        started: App.pathFinder.data.reference_timestamp,
        ended: App.pathFinder.data.timestamp,
        timestep: App.pathFinder.data.simulation.timestep_sec,
        telescope: App.spectroscopy.getCurrentTelescope().name,
        neos_scanned: App.statistics.counters.neos_scanned,
        exoplanets_scanned: App.statistics.counters.exoplanets_scanned,
        max_slew_rate: _.round(App.statistics.stats.slew.max_rate, 2),
        operations: App.output.data.operations,
        earth_exclusion: _.round(App.targeting.settings.earth_exclusion_deg * 2, 1),
        exoplanet_spectroscopy_limiting: 'not limited',
        neo_spectroscopy_limiting: App.neos.settings.limiting_by == 1 ? (neo_limiting_integration + ' minutes integration time') : ('visual magnitude ' + neo_limiting_vmag),
        exoplanet_avg_scan_time: _.round(avg_scan_time[0]),
        neo_avg_scan_time: _.round(avg_scan_time[1]),
        time_exoplanet_scans: _.round(time_breakdown[0], 1).toFixed(1),
        time_neo_scans: _.round(time_breakdown[1], 1).toFixed(1),
        time_idle: _.round(time_breakdown[2], 1).toFixed(1),
        total_data_produced_tb: _.round(App.statistics.stats.total_data_produced / 1e12, 2),
        data_rate_mbps: _.round(App.spectroscopy.settings.data_rate_mbps, 1),
        data_rate_fluct_mbps: _.round(App.spectroscopy.settings.data_rate_fluct_mbps, 2),
        exoplanet_count: App.dataManager.storage.exoplanets.length,
        observable_exoplanet_count: App.operations.cropY(App.pathFinder.data.exoplanet_series, 50).length,
        neo_count: App.pathFinder.data.neos_series.length,
        ecliptic_scope: '50°x50°',
        neo_spectroscopy_methodology: App.neos.settings.scan_method == 1 ? 'scan with ' + App.neos.settings.scan_delay + ' days delay' : 'scan once',
        exoplanet_spectroscopy_methodology: App.exoplanets.settings.scan_method == 1 ? 'scan with ' + App.exoplanets.settings.scan_delay + ' days delay' : 'scan once',
      };
    },

    exportOperationLog() {
      App.export.save(App.output.prepareOperationsForExport(), 'scan-data-export.json');
    },
  }
};
