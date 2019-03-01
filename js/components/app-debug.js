module.exports = function(App) {
  App.debug = {
    loop() {
      // Add debug scripts here that will be executed every loop
      if(App.comms.data.storage / App.comms.settings.max > 0.8) {
        App.comms.data.storage = 0;
      }
    }
  }
};
