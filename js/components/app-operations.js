module.exports = function(App) {
  App.operations = {
    shift(value, step, swath) {
      value = value + step;
      if(value > swath/2) {
        value = value - swath;
      }
      return value;
    },

    zeroData(data, index, angle) {
      if(angle === undefined) {
        angle = -180;
      }

      return _.each(data, function(set) {
        set[index] = App.arithmetics.wrapTo360(set[index]) + angle;

        return set;
      });
    },

    offsetData(data, index, angle) {
      return _.each(data, function(set) {
        set[index] = App.arithmetics.wrapTo360((set[index] + 180) - angle) - 180;

        return set;
      });
    },

    cropX(data, angle) {
      angle = angle/2;

      return _.filter(data, function(entry) {
        return -angle < entry[0] && angle > entry[0];
      });
    },

    cropY(data, angle) {
      angle = angle/2;

      return _.filter(data, function(entry) {
        return -angle < entry[1] && angle > entry[1];
      });
    }
  }
};
