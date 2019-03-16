var Vue = require('vue');

Vue.config.devtools = false;
Vue.config.productionTip = false;

module.exports = function(App) {
  App.settings = new Vue({
    el: '#pathfinder-settings',

    data: {
      lifetime_exceeded: false,
      simulation_initialized: false,
      capacity_recommendation: 0,

      general: {
        lifetime_days: _.round(App.pathFinder.data.lifetime_days),
        stop_at_the_end: App.pathFinder.data.stop_at_the_end,
      },

      spectroscopy: {
        telescope: App.spectroscopy.settings.use_telescope,
        data_rate: _.round(App.spectroscopy.settings.data_rate_mbps, 1),
        data_rate_fluct: _.round(App.spectroscopy.settings.data_rate_fluct_mbps, 2),
        cool_down_minutes: _.round(App.spectroscopy.settings.cool_down_minutes),
        earth_exclusion_deg: _.round(App.targeting.settings.earth_exclusion_deg * 2, 1),
      },

      ew: {
        enabled: App.earlyWarning.settings.enabled,
        freq_times: App.earlyWarning.settings.scan_frequency.times,
        freq_timeframe_hours: App.earlyWarning.settings.scan_frequency.timeframe_hours,
        scan_length: App.earlyWarning.settings.scan_length,
        data_rate: _.round(App.earlyWarning.settings.data_rate_mbps, 1),
        data_rate_fluct: _.round(App.earlyWarning.settings.data_rate_fluct_mbps, 2),
        cool_down_minutes: _.round(App.earlyWarning.settings.cool_down_minutes),
      },

      neos: {
        scan: App.neos.settings.scan_enabled,
        limiting_by: App.neos.settings.limiting_by,
        limiting_vmag: App.neos.settings.vmag_limit,
        limiting_integration: _.round(App.neos.settings.int_time_limit / 60),
        scan_method: App.neos.settings.scan_method,
        scan_delay: _.round(App.neos.settings.scan_delay),
      },

      exoplanets: {
        scan: App.exoplanets.settings.scan_enabled,
        scan_method: App.exoplanets.settings.scan_method,
        scan_delay: _.round(App.exoplanets.settings.scan_delay),
      },

      comms: {
        enabled: App.comms.settings.enabled,
        freq_times: App.comms.settings.transmission_frequency.times,
        freq_timeframe_hours: App.comms.settings.transmission_frequency.timeframe_hours,
        data_capacity: _.round(App.comms.settings.data_capacity),
        transmission_rate: _.round(App.comms.settings.transmission_rate, 1),
        transmission_rate_fluct: _.round(App.comms.settings.transmission_rate_fluct, 2),
        transmission_min_contact: _.round(App.comms.settings.min_contact_time),
        cool_down_minutes: _.round(App.comms.settings.cool_down_minutes),
      },
    },

    watch: {
      'general.lifetime_days': value => {
        App.pathFinder.data.lifetime_days = parseInt(value);
      },

      'general.stop_at_the_end': value => {
        App.pathFinder.data.stop_at_the_end = value;
      },

      'spectroscopy.telescope': value => {
        App.spectroscopy.settings.use_telescope = parseInt(value);
        App.exoplanets.recalculateIntegrationTimes();
        App.targeting.discardTarget();
      },

      'spectroscopy.data_rate': value => {
        App.spectroscopy.settings.data_rate_mbps = _.round(value, 1);
      },

      'spectroscopy.data_rate_fluct': value => {
        App.spectroscopy.settings.data_rate_fluct_mbps = _.round(value, 2);
      },

      'spectroscopy.cool_down_minutes': value => {
        App.spectroscopy.settings.cool_down_minutes = _.round(value);
      },

      'spectroscopy.earth_exclusion_deg': value => {
        App.targeting.settings.earth_exclusion_deg = _.round(value / 2, 1);
        App.targeting.loadEarthExclusionIndicator();
      },

      'ew.enabled': value => {
        App.earlyWarning.settings.enabled = value;
      },

      'ew.freq_times': value => {
        App.earlyWarning.settings.scan_frequency.times = parseInt(value);
      },

      'ew.freq_timeframe_hours': value => {
        App.earlyWarning.settings.scan_frequency.timeframe_hours = parseInt(value);
      },

      'ew.scan_length': value => {
        App.earlyWarning.settings.scan_length = parseInt(value);
      },

      'ew.data_rate': value => {
        App.earlyWarning.settings.data_rate_mbps = _.round(value, 1);
      },

      'ew.data_rate_fluct': value => {
        App.earlyWarning.settings.data_rate_fluct_mbps = _.round(value, 2);
      },

      'ew.cool_down_minutes': value => {
        App.earlyWarning.settings.cool_down_minutes = _.round(value);
      },

      'neos.scan': value => {
        App.neos.settings.scan_enabled = value;
      },

      'neos.limiting_by': value => {
        App.neos.settings.limiting_by = parseInt(value);
      },

      'neos.limiting_vmag': value => {
        App.neos.settings.vmag_limit = _.round(value, 1);
      },

      'neos.limiting_integration': value => {
        App.neos.settings.int_time_limit = _.round(value, 1) * 60;
      },

      'neos.scan_method': value => {
        App.neos.settings.scan_method = parseInt(value);
      },

      'neos.scan_delay': value => {
        App.neos.settings.scan_delay = _.round(value);
      },

      'exoplanets.scan': value => {
        App.exoplanets.settings.scan_enabled = value;
      },

      'exoplanets.scan_method': value => {
        App.exoplanets.settings.scan_method = parseInt(value);
      },

      'exoplanets.scan_delay': value => {
        App.exoplanets.settings.scan_delay = _.round(value);
      },

      'comms.enabled': value => {
        App.comms.settings.enabled = value;
      },

      'comms.freq_times': value => {
        App.comms.settings.transmission_frequency.times = parseInt(value);
        this.capacity_recommendation = 0;
      },

      'comms.freq_timeframe_hours': value => {
        App.comms.settings.transmission_frequency.timeframe_hours = parseInt(value);
        this.capacity_recommendation = 0;
      },

      'comms.data_capacity': function(value) {
        App.comms.settings.data_capacity = _.round(value);

        if(App.comms.settings.data_capacity >= this.capacity_recommendation) {
          this.capacity_recommendation = 0;
        }
      },

      'comms.transmission_rate': value => {
        App.comms.settings.transmission_rate = _.round(value, 1);
      },

      'comms.transmission_rate_fluct': value => {
        App.comms.settings.transmission_rate_fluct = _.round(value, 2);
      },

      'comms.transmission_min_contact': value => {
        App.comms.settings.min_contact_time = _.round(value);
      },

      'comms.cool_down_minutes': value => {
        App.comms.settings.cool_down_minutes = _.round(value);
      },
    },

    methods: {
      capacityExceeded(amount) {
        this.capacity_recommendation = amount;
      },

      simulationInitialized() {
        this.simulation_initialized = true;
      },

      lifetimeExceeded() {
        this.lifetime_exceeded = true;
      },
    },

    created() {
      this.$on('capacity-exceeded', this.capacityExceeded);
      this.$on('simulation-initialized', this.simulationInitialized);
      this.$on('lifetime-exceeded', this.lifetimeExceeded);
    },

    mounted() {
      //
    },
  });
};
