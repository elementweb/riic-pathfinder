module.exports = function(App) {
  App.spectroscopy = {
    settings: {
      // Set the id of default telescope
      use_telescope: 1,

      // Spectrograph produced data rate
      data_rate_mbps: 2,

      // Spectrograph produced data rate fluctuations
      data_rate_fluct_mbps: 0.1,

      // Allow "cool-down" time after each scan (0 by default)
      cool_down_minutes: 5,
    },

    /**
     * Define relationship between optical magnitude and integration time (seconds)
     */
    integrationTime(opt_mag) {
      return App.spectroscopy.getCurrentTelescope().integration(opt_mag);
    },

    /**
     * Get telescope data that's currently being used
     */
    getCurrentTelescope() {
      return App.spectroscopy.telescopes.find(t => t.id === App.spectroscopy.settings.use_telescope);
    },

    /**
     * Compute amount of data produced (bits) in given amount of seconds
     */
    dataProduced(integration) {
      let rate = App.spectroscopy.settings.data_rate_mbps,
          fluctuations = App.math.random(-App.spectroscopy.settings.data_rate_fluct_mbps, App.spectroscopy.settings.data_rate_fluct_mbps);

      if(rate + fluctuations < 0) {
        fluctuations = -rate; // data rate will essentialy become zero
      }

      return (rate * integration + fluctuations) * 1e6;
    },

    computeVisualMagnitude(H, G, L1B, SB, Obs2Ast, Sun2Ast) {
      Obs2Ast = App.astrodynamics.km2AU(Obs2Ast);
      Sun2Ast = App.astrodynamics.km2AU(Sun2Ast);

      let κ = App.arithmetics.angleBetweenCartesianVectors(L1B, SB);
      
      κ = App.conversion.deg2rad(κ);

      let phase1 = App.math.exp(-3.33 * App.math.pow(App.math.tan(κ / 2), 0.63)),
          phase2 = App.math.exp(-1.87 * App.math.pow(App.math.tan(κ / 2), 1.22));

      let Hk = H * 1 - 2.5 * App.math.log((1 - G * 1) * phase1 + G * phase2, 10);

      return V = Hk + 5 * App.math.log(Obs2Ast * Sun2Ast, 10);
    },

    isInCooldown() {
      if(App.spectroscopy.testCooldown()) {
        return true;
      }

      if(App.pathFinder.data.scan_cooldown != false) {
        App.spectroscopy.exitCooldown();
      }

      return false;
    },

    testCooldown() {
      if(App.pathFinder.data.scan_cooldown == false) {
        return false;
      }

      return (App.pathFinder.data.timestamp - App.pathFinder.data.scan_cooldown) < (App.spectroscopy.settings.cool_down_minutes * 60);
    },

    enterCooldownPeriod() {
      if(App.spectroscopy.settings.cool_down_minutes <= 0) {
        return;
      }

      App.pathFinder.data.scan_cooldown = App.pathFinder.data.timestamp;
      App.UI.updateOperation('spectroscopy cooldown', 'cooldown');
    },

    exitCooldown() {
      App.pathFinder.data.scan_cooldown = false;
      App.UI.updateOperation('idling');
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
        }
      },
      {
        id: 2,
        name: "⌀0.4m",
        integration(opt_mag) {
          return 2e-5 * Math.pow(App.math.e, 0.9161 * opt_mag) * 60;
        }
      },
      {
        id: 3,
        name: "⌀0.5m",
        integration(opt_mag) {
          return 1e-5 * Math.pow(App.math.e, 0.9201 * opt_mag) * 60;
        }
      },
    ]
  }
};
