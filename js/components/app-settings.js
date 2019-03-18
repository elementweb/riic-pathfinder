var Vue = require('vue');

Vue.config.devtools = false;
Vue.config.productionTip = false;

module.exports = function(App) {
  App.settings = new Vue({
    el: '#pathfinder-settings',

    data: {
      lifetime_exceeded: false,
      simulation_initialized: false,

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
        limiting: App.targeting.settings.limiting,
        sun_exclusion_deg: _.round(App.targeting.settings.sun_exclusion_deg * 2, 1),
      },

      neos: {
        scan: App.neos.settings.scan_enabled,
        limiting_by: App.neos.settings.limiting_by,
        limiting_vmag: App.neos.settings.vmag_limit,
        limiting_integration: _.round(App.neos.settings.int_time_limit / 60),
        scan_method: App.neos.settings.scan_method,
        scan_delay: _.round(App.neos.settings.scan_delay),
        limiting_frequency: App.neos.settings.limiting_frequency,
        limiting_timeframe: App.neos.settings.limiting_timeframe,
      },

      exoplanets: {
        scan: App.exoplanets.settings.scan_enabled,
        scan_method: App.exoplanets.settings.scan_method,
        scan_delay: _.round(App.exoplanets.settings.scan_delay),
        limiting_frequency: App.exoplanets.settings.limiting_frequency,
        limiting_timeframe: App.exoplanets.settings.limiting_timeframe,
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

      'spectroscopy.limiting': value => {
        App.targeting.settings.limiting = parseInt(value);
        App.targeting.discardTarget();
      },

      'spectroscopy.sun_exclusion_deg': value => {
        App.targeting.settings.sun_exclusion_deg = _.round(value / 2, 1);
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

      'neos.limiting_frequency': value => {
        App.neos.settings.limiting_frequency = parseInt(value);
      },

      'neos.limiting_timeframe': value => {
        App.neos.settings.limiting_timeframe = parseInt(value);
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

      'exoplanets.limiting_frequency': value => {
        App.exoplanets.settings.limiting_frequency = parseInt(value);
      },

      'exoplanets.limiting_timeframe': value => {
        App.exoplanets.settings.limiting_timeframe = parseInt(value);
      },
    },

    methods: {
      simulationInitialized() {
        this.simulation_initialized = true;
      },

      lifetimeExceeded() {
        this.lifetime_exceeded = true;
      },
    },

    created() {
      this.$on('simulation-initialized', this.simulationInitialized);
      this.$on('lifetime-exceeded', this.lifetimeExceeded);
    },

    mounted() {
      //
    },
  });
};
