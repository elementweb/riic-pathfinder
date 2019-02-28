module.exports = function(App) {
  App.operations = {
    data: {
      equinox_offset: 270,
    },

    shift(value, step, swath) {
      value = value + step;
      if(value > swath/2) {
        value = value - swath;
      }
      return value;
    },

    zeroData(data) {
      // if(angle === undefined) {
      //   angle = 0;
      // }

      // // Add offset to set equinox to 0
      // // angle = angle - App.operations.data.equinox_offset;

      return _.each(data, function(set) {
        set.initial[0] = App.arithmetics.wrapTo180(set.initial[0] + 90);
        set.mercator = JSON.parse(JSON.stringify(set.initial));

        return set;
      });
    },

    // offsetData(data, index, angle) {
    //   return _.each(data, function(set) {
    //     set.initial[index] = App.arithmetics.wrapTo360((set.initial[index] + 180) - angle) - 180;
    //     set.mercator = JSON.parse(JSON.stringify(set.initial));

    //     return set;
    //   });
    // },

    shiftData(data, angle) {
      return _.each(data, function(set) {
        var initial = set.initial[0];

        set.mercator[0] = App.arithmetics.wrapTo180(initial + App.arithmetics.wrapTo180(angle));

        return set;
      });
    },

    cropX(data, angle) {
      halfangle = angle / 2;

      return _.filter(data, function(entry) {
        return -halfangle < entry.mercator[0] && halfangle > entry.mercator[0];
      });
    },

    cropY(data, angle) {
      halfangle = angle / 2;

      return _.filter(data, function(entry) {
        return -halfangle < entry.initial[1] && halfangle > entry.initial[1];
      });
    },

    crop(data, xspan, yspan) {
      var halfx = xspan / 2;
      var halfy = yspan / 2;

      return _.filter(data, function(entry) {
        return -halfx < entry.mercator[0] && halfx > entry.mercator[0]
            && -halfy < entry.mercator[1] && halfy > entry.mercator[1];
      });
    }
  }
};
