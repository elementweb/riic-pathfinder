let galactic = require('galactic');
let mth = require('svgo/plugins/_transforms').mth;
let cs = require('coordinate-systems');

module.exports = function(App) {
  App.orbital = require('orbjs');

  App.conversion = {
    data: {
      equinox_2019: 1553119080, // 20-Mar-2019 21:58:00
      // angle: 0,
      seconds_year: 365.24225 * 24 * 3600
    },

    millisecondsToAngle(ms) {
      return (360*ms) / _.round(App.conversion.data.ms_year);
    },

    angleToMilliseconds(angle) {
      return (_.round(App.conversion.data.ms_year) * angle) / 360;
    },

    timestampToAngle(timestamp) {
      if (typeof timestamp === 'undefined') {
        timestamp = App.pathFinder.data.timestamp;
      }

      var angle_delta = (timestamp - App.conversion.data.equinox_2019) * 360 / App.conversion.data.seconds_year;

      return _.round(App.arithmetics.wrapTo360(angle_delta), 2);
    },

    equatorialToMercator(ra, dec) {
      var ecliptic = galactic.coord.equatorialToEcliptic({
        rightAscension: mth.rad(ra),
        declination: mth.rad(dec)
      });

      var cartesian = {
        x: Math.cos(ecliptic.latitude) * Math.cos(ecliptic.longitude),
        y: Math.cos(ecliptic.latitude) * Math.sin(ecliptic.longitude),
        z: Math.sin(ecliptic.latitude)
      };

      let xy = Math.sqrt(Math.pow(cartesian.x, 2) + Math.pow(cartesian.y, 2)),
          long = App.arithmetics.wrapTo360(Math.atan2(cartesian.x, cartesian.y) * 180 / Math.PI),
          lat = Math.acos(xy / Math.sqrt(Math.pow(xy, 2) + Math.pow(cartesian.z, 2))) * 180 / Math.PI;

      if (cartesian.z < 0) {
        lat = lat * -1;
      }

      return [_.round(long, 2), _.round(lat, 2)];
    },

    stringPadding(num) {
        return ("0"+num).slice(-2);
    },

    secondsToReadableTimeString(secs) {
      var minutes = Math.floor(secs / 60);

      secs = secs % 60;

      var hours = Math.floor(minutes / 60);

      minutes = minutes % 60;

      return `${App.conversion.stringPadding(hours)}:${App.conversion.stringPadding(minutes)}:${App.conversion.stringPadding(secs)}`;
    }
  }
};
