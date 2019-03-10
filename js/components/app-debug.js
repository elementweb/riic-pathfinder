module.exports = function(App) {
  App.debug = {
    data: {
      max_angle: 0
    },

    loopInjection() {
      // Add debug scripts here that will be executed every loop
      if(App.comms.data.storage / App.comms.settings.max > 0.8) {
        App.comms.data.storage = 0;
      }
    },

    maxAngle(angle) {
      if(angle > App.debug.data.max_angle) {
        App.debug.data.max_angle = angle;
        console.log(App.debug.data.max_angle);
      }
    }
  }
};
