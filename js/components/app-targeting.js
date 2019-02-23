module.exports = function(App) {
  App.targeting = {
    data: {
      reorientation_speed: 0.45 // deg/sec
    },

    timeRequired(angle) {
      return _.round(angle / App.targeting.data.reorientation_speed);
    },

    getTarget(id) {
      return App.pathFinder.data.exoplanet_series.find(el => el.id === id);
    }
  }
};
