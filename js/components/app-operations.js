module.exports = function(App) {
  App.operations = {
    data: {
      equinox_offset: 270,
    },

    zeroData(data) {
      return _.each(data, function(set) {
        set.initial[0] = App.arithmetics.wrapTo180(set.initial[0] + 90);
        set.mercator = JSON.parse(JSON.stringify(set.initial));

        return set;
      });
    },

    shiftData(data, angle) {
      return _.each(data, function(set) {
        var initial = set.initial[0];

        set.mercator[0] = App.arithmetics.wrapTo180(initial + App.arithmetics.wrapTo180(angle));

        return set;
      });
    },

    cropX(data, angle) {
      var halfangle = angle / 2;

      return _.filter(data, function(entry) {
        return -halfangle < entry.mercator[0] && halfangle > entry.mercator[0];
      });
    },

    cropY(data, angle) {
      var halfangle = angle / 2;

      return _.filter(data, function(entry) {
        return -halfangle < entry.initial[1] && halfangle > entry.initial[1];
      });
    },

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
