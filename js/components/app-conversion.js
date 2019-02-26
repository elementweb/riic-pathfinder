let galactic = require('galactic');
let mth = require('svgo/plugins/_transforms').mth;
let cs = require('coordinate-systems');
let TUC = require('temp-units-conv');

module.exports = function(App) {
  App.orbital = require('orbjs');

  App.conversion = {
    data: {
      equinox_2019: 1553119080, // 20-Mar-2019 21:58:00
      // angle: 0,
      seconds_year: 365.24225 * 24 * 3600,
      unix_julian: 2440587.5
    },

    TUC,

    pc2ly(pc) {
      return pc * 3.26156;
    },

    ly2pc(ly) {
      return ly / 3.26156;
    },

    SR2ER(SR) {
      return SR * 109.4894472466;
    },

    ER2SR(ER) {
      return ER / 109.4894472466;
    },

    secondsToAngle(time) {
      return _.round((360 * time) / App.conversion.data.seconds_year, 3);
    },

    angleToSeconds(angle) {
      return _.round((_.round(App.conversion.data.seconds_year) * angle) / 360, 3);
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

      return App.conversion.cartesianToMercator(cartesian.x, cartesian.y, cartesian.z);
    },

    cartesianToMercator(x, y, z) {
      let xy = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
          long = App.arithmetics.wrapTo360(Math.atan2(x, y) * 180 / Math.PI),
          lat = Math.acos(xy / Math.sqrt(Math.pow(xy, 2) + Math.pow(z, 2))) * 180 / Math.PI;

      if (z < 0) {
        lat = lat * -1;
      }

      return [_.round(long, 3), _.round(lat, 3)];
    },

    mercatorToCartesian(mx, my) {
      return [
        Math.cos(my * Math.PI / 180) * Math.cos(mx * Math.PI / 180),
        Math.cos(my * Math.PI / 180) * Math.sin(mx * Math.PI / 180),
        Math.sin(my * Math.PI / 180),
      ];
    },

    stringPadding(num) {
      return ("0" + num).slice(-2);
    },

    secondsToReadableTimeString(secs) {
      var minutes = Math.floor(secs / 60);
      secs = secs % 60;

      var hours = Math.floor(minutes / 60);
      minutes = minutes % 60;

      return `${App.conversion.stringPadding(hours)}:${App.conversion.stringPadding(minutes)}:${App.conversion.stringPadding(secs)}`;
    },

    AU2SolarRadii(AU) {
      return _.round(214.9394693836 * AU, 5);
    },

    timestampToJulian(timestamp)
    {
      return (timestamp / 86400.0) + App.conversion.data.unix_julian;
    },

    julianToTimestamp(julian)
    {
      return _.round(86400.0 * (julian - App.conversion.data.unix_julian));
    },

    daysToSeconds(days) {
      return _.round(days * 24 * 3600);
    }
  }
};
