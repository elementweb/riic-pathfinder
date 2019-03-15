module.exports = function(App) {
  App.debug = {
    data: {
      max_angle: 0
    },

    loopInjection() {
      // Add debug scripts here that will be executed every loop
      
      // For testing purposes, auto-reset data storage
      // App.debug.autoResetStorage();
    },

    autoResetStorage() {
      if(App.comms.data.storage / (App.comms.settings.data_capacity * 1e9) > 0.8) {
        App.comms.resetStorage();
      }
    },

    maxAngle(angle) {
      if(angle > App.debug.data.max_angle) {
        App.debug.data.max_angle = angle;
      }
    }
  }
};
