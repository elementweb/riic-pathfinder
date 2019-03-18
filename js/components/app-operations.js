module.exports = function(App) {
  App.operations = {
    /**
     * Define any dynamic data here
     * @type {Object}
     */
    data: {
      equinox_offset: 270,
    },

    /**
     * Zero-center date to -180° → 180°
     */
    zeroData(data) {
      return _.each(data, function(set) {
        set.initial[0] = App.arithmetics.wrapTo180(set.initial[0] + 90);
        set.mercator = JSON.parse(JSON.stringify(set.initial));

        return set;
      });
    },

    /**
     * Shift data points by given angle
     */
    shiftData(data, angle) {
      return _.each(data, function(set) {
        var initial = set.initial[0];

        set.mercator[0] = App.arithmetics.wrapTo180(initial + App.arithmetics.wrapTo180(angle));

        return set;
      });
    },

    /**
     * Crop data in the X-direction
     */
    cropX(data, angle) {
      var halfangle = angle / 2;

      return _.filter(data, function(entry) {
        return -halfangle < entry.mercator[0] && halfangle > entry.mercator[0];
      });
    },

    /**
     * Crop data in the Y-direction
     */
    cropY(data, angle) {
      var halfangle = angle / 2;

      return _.filter(data, function(entry) {
        return -halfangle < entry.initial[1] && halfangle > entry.initial[1];
      });
    },

    /**
     * Crop data to a given X and Y values
     */
    crop(data, xspan, yspan) {
      var halfx = xspan / 2,
          halfy = yspan / 2;

      return _.filter(data, function(entry) {
        return -halfx < entry.mercator[0] && halfx > entry.mercator[0]
            && -halfy < entry.mercator[1] && halfy > entry.mercator[1];
      });
    }
  }
};
