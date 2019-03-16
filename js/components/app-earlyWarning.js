module.exports = function(App) {
  App.earlyWarning = {
    settings: {
      enabled: false,
      
      scan_frequency: {
        times: 1,
        timeframe_hours: 24,
      },

      scan_length: 120, // minutes

      // Spectrograph produced data rate
      data_rate_mbps: 2,

      // Spectrograph produced data rate fluctuations
      data_rate_fluct_mbps: 0.1,

      // Allow "cool-down" time after each scan (0 by default)
      cool_down_minutes: 5,

      // Assumed requried AOCS angle change per scan
      aocs_per_scan_deg: 180,
    },

    data: {
      last_scan: 0, // timestamp
    },
    
    shallWeScanNow() {
      if(!App.earlyWarning.settings.enabled || App.pathFinder.data.target_selected || App.pathFinder.isSpacecraftInCooldownMode()) {
        return false;
      }

      if(App.pathFinder.data.timestamp - App.earlyWarning.data.last_scan >= App.earlyWarning.scanFrequencySeconds()) {
        App.earlyWarning.start();

        return true;
      }

      return false;
    },

    canWeNowStopScanning() {
      // console.log(App.pathFinder.data.timestamp - App.pathFinder.data.target.time_selected >= App.earlyWarning.settings.scan_length * 60);

      if(App.pathFinder.data.timestamp - App.pathFinder.data.target.time_selected >= App.earlyWarning.settings.scan_length * 60) {
        App.earlyWarning.data.last_scan = App.pathFinder.data.target.time_selected;
        App.earlyWarning.end();

        return true;
      }

      return false;
    },

    scanFrequencySeconds() {
      let frequency = App.earlyWarning.settings.scan_frequency;

      return (frequency.timeframe_hours / frequency.times) * 3600;
    },

    start() {
      App.pathFinder.data.target_type = App.targeting.target_types.early_warning_scan;
      App.pathFinder.data.target.id = false;
      App.pathFinder.data.target.time_selected = App.pathFinder.data.timestamp;
      App.pathFinder.data.target_selected = true;
      App.targeting.earlyWarningScanMode();
    },

    end() {
      App.output.operationCompleted(
        App.targeting.target_types.early_warning_scan,
        App.pathFinder.data.target.time_selected,
        App.pathFinder.data.timestamp,
      );

      App.targeting.discardTarget();
      App.comms.addData(App.earlyWarning.dataProducedPerScan());
      App.statistics.angleChangeAOCS(App.earlyWarning.settings.aocs_per_scan_deg);
      App.earlyWarning.enterCooldownPeriod();
    },

    /**
     * Compute amount of data produced (bits) per scan
     */
    dataProducedPerScan() {
      let rate = App.earlyWarning.settings.data_rate_mbps,
          fluctuations = App.math.random(-App.earlyWarning.settings.data_rate_fluct_mbps, App.earlyWarning.settings.data_rate_fluct_mbps),
          length = App.earlyWarning.settings.scan_length * 60;

      if(rate + fluctuations < 0) {
        fluctuations = -rate; // data rate will essentialy become zero
      }

      return (rate * length + fluctuations) * 1e6;
    },

    isInCooldown() {
      if(App.earlyWarning.testCooldown()) {
        return true;
      }

      if(App.pathFinder.data.ew_cooldown != false) {
        App.earlyWarning.exitCooldown();
      }

      return false;
    },

    testCooldown() {
      if(App.pathFinder.data.ew_cooldown == false) {
        return false;
      }

      return (App.pathFinder.data.timestamp - App.pathFinder.data.ew_cooldown) < (App.earlyWarning.settings.cool_down_minutes * 60);
    },

    enterCooldownPeriod() {
      if(App.earlyWarning.settings.cool_down_minutes <= 0) {
        return;
      }

      App.pathFinder.data.ew_cooldown = App.pathFinder.data.timestamp;
      App.UI.updateOperation('early warning cooldown', 'cooldown');
    },

    exitCooldown() {
      App.pathFinder.data.ew_cooldown = false;
      App.UI.updateOperation('idling');
    },
  }
};
