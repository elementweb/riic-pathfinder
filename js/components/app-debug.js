module.exports = function(App) {
  App.debug = {
    data: {
      max_angle: 0
    },

    loopInjection() {
      // Add debug scripts here that will be executed every loop
      
      //
    },

    maxAngle(angle) {
      if(angle > App.debug.data.max_angle) {
        App.debug.data.max_angle = angle;
      }
    }
  }
};
