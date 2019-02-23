module.exports = function(App) {
  App.spectroscopy = {
    /**
     * Define relationship between optical magnitude and integration time (seconds)
     */
    integrationTime(opt_mag) {
      // Perform any calculations here to get the required integration time
      // of object having optical magnitude (opt_mag)

      // assumption
      return _.round(1.21 * Math.pow(opt_mag, 2) + 10) * 60;
    }
  }
};
