module.exports = function(App) {
  App.spectroscopy = {
    settings: {
      // Minimum delay between exoplanet spectroscopies in seconds.
      exo_min_delay_between_specs: 20736000, // 8 months = 8*30*24*3600

      // Set the id of default telescope
      use_telescope: 1
    },

    /**
     * Define relationship between optical magnitude and integration time (seconds)
     */
    integrationTime(opt_mag) {
      return App.spectroscopy.telescopes.find(t => t.id === App.spectroscopy.settings.use_telescope).integration(opt_mag);
    },

    /**
     * Define relationship between integration time and data rate
     */
    dataRate(integration) {
      return App.spectroscopy.telescopes.find(t => t.id === App.spectroscopy.settings.use_telescope).dataRate(integration);
    },

    /**
     * Define different telescope specs used in simulation
     */
    telescopes: [
      {
        id: 1,
        name: "⌀0.3m",
        integration(opt_mag) {
          return 8e-5 * Math.pow(App.math.e, 0.9161 * opt_mag) * 60;
        },
        dataRate(integration) {
          return 2e6 * integration; // 2Mbps
        }
      },
      {
        id: 2,
        name: "⌀0.4m",
        integration(opt_mag) {
          return 2e-5 * Math.pow(App.math.e, 0.9161 * opt_mag) * 60;
        },
        dataRate(integration) {
          return 2e6 * integration; // 2Mbps
        }
      },
      {
        id: 3,
        name: "⌀0.5m",
        integration(opt_mag) {
          return 1e-5 * Math.pow(App.math.e, 0.9201 * opt_mag) * 60;
        },
        dataRate(integration) {
          return 2e6 * integration; // 2Mbps
        }
      },
    ]
  }
};
