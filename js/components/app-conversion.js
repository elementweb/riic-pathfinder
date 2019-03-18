let galactic = require('galactic');
let mth = require('svgo/plugins/_transforms').mth;
let cs = require('coordinate-systems');
let keplerEquation = require('orbjs').position.keplerEquation;

module.exports = function(App) {
  /**
   * Load orb.js library
   */
  App.orbital = require('orbjs');

  /**
   * Conversion library - a set of function for astrodynamic conversions
   */
  App.conversion = {
    /**
     * Define some constants
     */
    data: {
      equinox_2019: 1553119080, // 20-Mar-2019 21:58:00
      seconds_year: 365.24225 * 24 * 3600,
      unix_julian: 2440587.5,
      unix_mjd: 40587,
    },

    /**
     * Load temperature units conversion library
     */
    TUC: require('temp-units-conv'),

    /**
     * Convert degrees to radians
     */
    deg2rad(deg) {
        return deg * Math.PI / 180;
    },

    /**
     * Convert radians to degrees
     */
    rad2deg(rad) {
        return rad * 180 / Math.PI;
    },

    /**
     * Convert parsecs to light years
     */
    pc2ly(pc) {
      return pc * 3.26156;
    },

    /**
     * Convert light years to parsecs
     */
    ly2pc(ly) {
      return ly / 3.26156;
    },

    /**
     * Convert Solar Radii to Earth Radii
     */
    SR2ER(SR) {
      return SR * 109.4894472466;
    },

    /**
     * Convert Earth Radii to Solar Radii
     */
    ER2SR(ER) {
      return ER / 109.4894472466;
    },

    /**
     * Convert seconds to angle
     */
    secondsToAngle(time) {
      return _.round((360 * time) / App.conversion.data.seconds_year, 3);
    },

    /**
     * Convert angle to seconds
     */
    angleToSeconds(angle) {
      return _.round((_.round(App.conversion.data.seconds_year) * angle) / 360, 3);
    },

    /**
     * Convert given timestamp to angle on ecliptic plane referenced from equinox 2019
     */
    timestampToAngle(timestamp) {
      if (typeof timestamp === 'undefined') {
        timestamp = App.pathFinder.data.timestamp;
      }

      var angle_delta = (timestamp - App.conversion.data.equinox_2019) * 360 / App.conversion.data.seconds_year;

      return _.round(App.arithmetics.wrapTo360(angle_delta), 2);
    },

    /**
     * Convert equatorial coordinates to mercator
     */
    equatorialToMercator(ra, dec) {
      var ecliptic = galactic.coord.equatorialToEcliptic({
        rightAscension: App.conversion.deg2rad(ra),
        declination: App.conversion.deg2rad(dec),
      });

      var cartesian = {
        x: Math.cos(ecliptic.latitude) * Math.cos(ecliptic.longitude),
        y: Math.cos(ecliptic.latitude) * Math.sin(ecliptic.longitude),
        z: Math.sin(ecliptic.latitude)
      };

      return App.conversion.cartesianToMercator(cartesian.x, cartesian.y, cartesian.z);
    },

    /**
     * Convert equatorial coordinates to cartesian representation
     */
    equatorialToCartesian(ra, dec) {
      var ecliptic = galactic.coord.equatorialToEcliptic({
        rightAscension: App.conversion.deg2rad(ra),
        declination: App.conversion.deg2rad(dec),
      });

      return [
        Math.cos(ecliptic.latitude) * Math.cos(ecliptic.longitude),
        Math.cos(ecliptic.latitude) * Math.sin(ecliptic.longitude),
        Math.sin(ecliptic.latitude)
      ];
    },

    /**
     * Convert given set of cartesian coordinates to mercator representation
     */
    cartesianToMercator(x, y, z) {
      let xy = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
          long = App.arithmetics.wrapTo360(Math.atan2(x, y) * 180 / Math.PI),
          lat = Math.acos(xy / Math.sqrt(Math.pow(xy, 2) + Math.pow(z, 2))) * 180 / Math.PI;

      if (z < 0) {
        lat = lat * -1;
      }

      return [_.round(long, 3), _.round(lat, 3)];
    },

    /**
     * Convert mercator representation of coordinates to cartesian
     */
    mercatorToCartesian(mx, my) {
      return [
        Math.cos(my * Math.PI / 180) * Math.cos(mx * Math.PI / 180),
        Math.cos(my * Math.PI / 180) * Math.sin(mx * Math.PI / 180),
        Math.sin(my * Math.PI / 180),
      ];
    },

    /**
     * Small helper function to add padding to a string
     */
    stringPadding(num) {
      return ("0" + num).slice(-2);
    },

    /**
     * Convert seconds to readable time string
     */
    secondsToReadableTimeString(secs) {
      var minutes = Math.floor(secs / 60);
      secs = secs % 60;

      var hours = Math.floor(minutes / 60);
      minutes = minutes % 60;

      return `${App.conversion.stringPadding(hours)}:${App.conversion.stringPadding(minutes)}:${App.conversion.stringPadding(secs)}`;
    },

    /**
     * Convert from AU to Solar Radii
     */
    AU2SolarRadii(AU) {
      return _.round(214.9394693836 * AU, 5);
    },

    /**
     * Convert UNIX timestamp to Julian days representation
     */
    timestampToJulian(timestamp) {
      return (timestamp / 86400) + App.conversion.data.unix_julian;
    },

    /**
     * Convert Julian days to UNIX timestamp representation
     */
    julianToTimestamp(julian) {
      return _.round(86400 * (julian - App.conversion.data.unix_julian));
    },

    /**
     * Convert Modified Julian days to UNIX timestamp representation
     */
    MJD2Timestamp(mjd) {
      return _.round(86400 * (mjd - App.conversion.data.unix_mjd));
    },

    /**
     * Convert days to seconds
     */
    daysToSeconds(days) {
      return _.round(days * 24 * 3600);
    },

    /**
     * Convert keplerian elements to cartesian vector at given time
     */
    keplerianToCartesianTime(a, e, i, Ω, ω, M0, t, t0, μb) {
      // Gravitational constant for Sun
      var μ = 1.32712e11; // (km^3 / s^2)

      // If provided, add gravitational constant of the other body
      if (typeof μb !== 'undefined') {
        μ = μ + μb;
      }

      // Mean motion
      var n = Math.sqrt( μ / Math.pow(a, 3) );

      // Mean angular rate
      var M = M0 + n * ( t - t0 );

      // Eccentric anomaly
      var E = keplerEquation(e, M);

      // True anomaly
      var theta = 2 * Math.atan( Math.sqrt((1 + e) / (1 - e)) * Math.tan(E / 2) );

      // Convert to cartesian and return
      return App.conversion.keplerianToCartesian(a, e, i, Ω, ω, theta);
    },

    /**
     * Convert keplerian elements to cartesian vector at given mean anomaly
     */
    keplerianToCartesianMean(a, e, i, Ω, ω, M) {
      // Eccentric anomaly
      var E = keplerEquation(e, M);

      // True anomaly
      var theta = 2 * Math.atan( Math.sqrt((1 + e) / (1 - e)) * Math.tan(E / 2) );

      // Convert to cartesian and return
      return App.conversion.keplerianToCartesian(a, e, i, Ω, ω, theta);
    },

    /**
     * Convert keplerian elements to cartesian vector at given theta value
     */
    keplerianToCartesian(a, e, i, Ω, ω, theta) {
      // Perigee
      var p = a * (1 - Math.pow(e, 2));

      // Radius
      var r = p / (1 + e * Math.cos(theta));

      // Rotation matrix
      var R = [
        [Math.cos(ω) * Math.cos(Ω) - Math.sin(ω) * Math.cos(i) * Math.sin(Ω), -Math.sin(ω) * Math.cos(Ω) - Math.cos(ω) * Math.cos(i) * Math.sin(Ω)],
        [Math.cos(ω) * Math.sin(Ω) + Math.sin(ω) * Math.cos(i) * Math.cos(Ω), -Math.sin(ω) * Math.sin(Ω) + Math.cos(ω) * Math.cos(i) * Math.cos(Ω)],
        [Math.sin(ω) * Math.sin(i), Math.cos(ω) * Math.sin(i)],
      ];

      // Orbital plane
      var xp = r * Math.cos(theta),
          yp = r * Math.sin(theta);

      // Return processed matrix
      return [
        R[0][0] * xp + R[0][1] * yp,
        R[1][0] * xp + R[1][1] * yp,
        R[2][0] * xp + R[2][1] * yp
      ];
    },

    /**
     * Convert cartesian vector to mercator representation, centered at L1 → Earth vector
     */
    cartesianToScopedMercator(x, y, z, offset) {
      var mercator = App.conversion.cartesianToMercator(x, y, z);

      mercator[0] = App.arithmetics.wrapTo180(mercator[0] - 270 + offset);

      return mercator;
    },

    /**
     * Convert bits to Terabits
     */
    bits2Terabits(bits) {
      return bits / 1e12;
    },

    /**
     * Convert bits to Gigabits
     */
    bits2Gigabits(bits) {
      return bits / 1e9;
    },

    /**
     * Convert bits to Megabits
     */
    bits2Megabits(bits) {
      return bits / 1e6;
    },
  }
};
