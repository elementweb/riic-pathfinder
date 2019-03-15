module.exports = function(App) {
  App.comms = {
    settings: {
      data_capacity: 500, // Gb
      transmission_rate: 10, // Mbps
      transmission_rate_fluct: 1, // Mbps
      transmission_frequency: {
        times: 2,
        timeframe_hours: 24,
      },
      min_contact_time: 10, // minutes

      // Allow "cool-down" time after each comms contact (0 by default)
      cool_down_minutes: 5, // minutes
    },

    data: {
      storage: 0, // bits
      last_contact: 0, // timestamp
      contact_time_required: 0, // seconds
    },

    bits2Gigabits(bits) {
      return bits / 1e9;
    },

    storageRecommendationGb(excess_bits) {
      let excess_gbits = excess_bits / 1e9;

      return App.math.ceil((App.comms.settings.data_capacity + excess_gbits) / 50) * 50;
    },

    start() {
      App.pathFinder.data.target_type = App.targeting.target_types.earth_comms;
      App.pathFinder.data.target.id = false;
      App.pathFinder.data.target.time_selected = App.pathFinder.data.timestamp;
      App.pathFinder.data.target_selected = true;
      App.targeting.commsMode();
    },

    approveIntegrationTime(integration) {
      var required = App.spectroscopy.dataProduced(integration),
          remaining = App.comms.settings.data_capacity * 1e9 - App.comms.data.storage;

      if(required > remaining) {
        App.statistics.storageCapacityExceeded(required - remaining);

        return false;
      }

      return true;
    },

    end() {
      let data = {
        transmitted: App.comms.data.storage,
      };

      App.output.operationCompleted(
        App.targeting.target_types.earth_comms,
        App.pathFinder.data.target.time_selected,
        App.pathFinder.data.timestamp,
        data,
      );

      App.targeting.discardTarget();
      App.comms.flushDataStorage();
      App.comms.enterCooldownPeriod();
    },

    shallWeEnterCommsMode() {
      if(App.pathFinder.data.target_selected || App.pathFinder.isSpacecraftInCooldownMode()) {
        return false;
      }

      if(App.pathFinder.data.timestamp - App.comms.data.last_contact >= App.comms.commsFrequencySeconds()) {
        App.comms.data.contact_time_required = App.comms.requiredContactTime(App.comms.data.storage);
        App.comms.start();

        return true;
      }

      return false;
    },

    canWeNowExitCommsMode() {
      if(App.pathFinder.data.timestamp - App.pathFinder.data.target.time_selected >= App.comms.data.contact_time_required) {
        App.comms.data.last_contact = App.pathFinder.data.target.time_selected;  
        App.comms.end();

        return true;
      }

      return false;
    },

    requiredContactTime(data_capacity) {
      let rate = App.comms.settings.transmission_rate,
          fluctuations = App.math.random(-App.comms.settings.transmission_rate_fluct, App.comms.settings.transmission_rate_fluct);

      if(rate + fluctuations < 0) {
        fluctuations = -rate; // data rate will essentialy become zero
      }

      return _.max([
        data_capacity / ((rate + fluctuations) * 1e6),
        App.comms.settings.min_contact_time * 60,
      ]);
    },

    commsFrequencySeconds() {
      let transmission = App.comms.settings.transmission_frequency;

      return (transmission.timeframe_hours / transmission.times) * 3600;
    },

    flushDataStorage() {
      App.statistics.dataTransmitted(App.comms.data.storage);

      App.comms.data.storage = 0;

      App.comms.updateStorageIndicator();
    },

    updateStorageIndicator() {
      App.UI.dataStorage((App.comms.data.storage / (App.comms.settings.data_capacity * 1e9)) * 100);
    },

    addData(data) {
      App.comms.data.storage = App.comms.data.storage + data;

      App.comms.updateStorageIndicator();
    },

    isInCooldown() {
      if(App.comms.testCooldown()) {
        return true;
      }

      if(App.pathFinder.data.cooms_cooldown != false) {
        App.comms.exitCooldown();
      }

      return false;
    },

    testCooldown() {
      if(App.pathFinder.data.cooms_cooldown == false) {
        return false;
      }

      return (App.pathFinder.data.timestamp - App.pathFinder.data.cooms_cooldown) < (App.comms.settings.cool_down_minutes * 60);
    },

    enterCooldownPeriod() {    
      if(App.comms.settings.cool_down_minutes <= 0) {
        return;
      }

      App.pathFinder.data.cooms_cooldown = App.pathFinder.data.timestamp;
      App.UI.updateOperation('comms cooldown', 'cooldown');
    },

    exitCooldown() {
      App.pathFinder.data.cooms_cooldown = false;
      App.UI.updateOperation('idling');
    },
  }
};
