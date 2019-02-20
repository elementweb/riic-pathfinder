let galactic = require('galactic');
let mth = require('svgo/plugins/_transforms').mth;
let cs = require('coordinate-systems');

module.exports = function(App) {
  App.conversion = {
    data: {
      equinox: 1553119080, // 20-Mar-2019 21:58:00
      equinox_angle: 108.423390454,
      timestamp: 0,
      angle: 0
    },

    millisecondsToAngle(ms) {
      return (360*ms) / Math.round(365.24225 * 24 * 3600 * 1000);
    },

    angleToMilliseconds(angle) {
      return (Math.round(365.24225 * 24 * 3600 * 1000) * angle) / 360;
    },

    timestampToAngle(timestamp) {
      // We know that Equinox is @ 20-Mar-2019 21:58:00 and
      // resolves to angle 108.423390453981
      App.arithmetics.wrapTo360((set[index] + 180) - angle) - 180;

      //
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
    }
  }
};
