module.exports = function(App) {
  App.spectroscopy = {
    settings: {
      // Minimum delay between exoplanet spectroscopies in seconds.
      exo_min_delay_between_specs: 20736000 // 8 months = 8*30*24*3600
    },

    /**
     * Define relationship between optical magnitude and integration time (seconds)
     */
    integrationTime(opt_mag) {
      // Perform any calculations here to get the required integration time
      // of object having optical magnitude (opt_mag)
      
      // return _.round(1.21 * Math.pow(opt_mag, 2) + 10) * 60; // assumption, more realistic
      return _.round(1.21 * Math.pow(opt_mag, 2) + 10) * 30; // assumption
      // return _.round(1.21 * Math.pow(opt_mag, 2) + 10) * 360; // assumption
    }
  }
};
