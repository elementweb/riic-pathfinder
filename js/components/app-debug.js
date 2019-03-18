module.exports = function(App) {
  /**
   * Any debug methods/helpers can be defined here
   * Use loopInjection method to inject into the main simulation looop
   */
  App.debug = {
    data: {
      //
    },

    loopInjection() {
      // Add debug scripts here that will be executed every loop
    },
  }
};
