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

    exportOperationLog() {
      App.export.save(App.output.data.operations);
    },
  }
};
