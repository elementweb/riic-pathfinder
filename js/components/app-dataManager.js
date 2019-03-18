module.exports = function(App) {
  /**
   * Data manager class is reponsible for loading objects used for analysis
   */
  App.dataManager = {
    /**
     * All data is stored in this object
     */
    storage: {
      exoplanets: [],
      objects: [],
      neos: [],
    },

    /**
     * Download data or load from browser localStorage (cache)
     */
    loadData() {
      /**
       * Set date, propagate current L1 position and compute offset
       */
      App.UI.setDate(App.pathFinder.data.timestamp);
      App.astrodynamics.propagateL1(App.pathFinder.data.timestamp, true);
      App.pathFinder.data.offset = App.astrodynamics.propagatedSL1Offset();

      /**
       * Load solar system objects
       */
      $.getJSON("data/solar-objects-mjd2000.json", function(data) {
        App.dataManager.storage.objects = data;
        App.UI.subjectLoaded('objects');
        App.objects.moveObjectsIntoPlot();
      });

      /**
       * Load exoplanets
       */
      if(typeof App.cache.get('exoplanets') !== 'undefined') {
        App.dataManager.storage.exoplanets = App.cache.get('exoplanets');
        App.UI.subjectLoaded('exoplanets');
        App.exoplanets.moveExoplanetsIntoPlot();
      } else {
        App.UI.loading(true);
        let baseURL = "https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?format=json";

        // Full list of columns available: https://exoplanetarchive.ipac.caltech.edu/docs/API_exoplanet_columns.html
        let columns = [
          'pl_hostname',    // Host Star Name - Stellar name most commonly used in the literature
          'pl_name',        // Planet Name - Planet name most commonly used in the literature
          'pl_discmethod',  // Discovery Method - Method by which the planet was first identified
          'pl_orbper',      // Orbital Period (days) - Time the planet takes to make a complete orbit around the host star or system 
          'ra',             // RA (decimal degrees) - Right Ascension of the planetary system in decimal degrees
          'dec',            // Dec (decimal degrees) - Declination of the planetary system in decimal degrees
          'st_optmag',      // Optical Magnitude [mag] - Brightness of the host star as measured using the V (Johnson) or the Kepler-band in units of magnitudes
          'pl_trandur',     // Transit Duration (days) - The length of time from the moment the planet begins to cross the stellar limb to the moment the planet finishes crossing the stellar limb
          'pl_tranmid',     // Transit Midpoint (Julian days) - The time given by the average of the time the planet begins to cross the stellar limb and the time the planet finishes crossing the stellar limb
          'pl_occdep',      // Occultation Depth - Depth of occultation of secondary eclipse
          'st_rad',         // Stellar Radius (solar radii) - Length of a line segment from the center of the star to its surface, measured in units of radius of the Sun.
          'pl_rads',        // Planet Radius (solar) - Length of a line segment from the center of the planet to its surface, measured in units of radius of the Sun
          'pl_imppar',      // Impact Parameter - The sky-projected distance between the center of the stellar disc and the center of the planet disc at conjunction, normalized by the stellar radius
          'pl_orbsmax',     // Orbit Semi-Major Axis (AU) - The longest radius of an elliptic orbit, or, for exoplanets detected via gravitational microlensing or direct imaging, the projected separation in the plane of the sky
          'st_dist',        // Distance (pc) - Distance to the planetary system in units of parsecs
          'pl_eqt',         // Planet Equilibrium Temperature [K] - The equilibrium temperature of the planet as modeled by a black body heated only by its host star
          'pl_trandep',     // Transit Depth (percentage) - The size of the relative flux decrement caused by the orbiting body transiting in front of the star
          'pl_disc',        // Year of Discovery - Year the planet was discovered
          'pl_status',      // Status - Status of the planet (1 = announced, 2 = submitted, 3 = accepted, 0 = retracted)
          'st_spstr',       // Spectral Type - Classification of the star based on their spectral characteristics following the Morgan-Keenan system
          'st_spn'          // Number of Spectral Type measurements
        ];

        let required_columns = [
          'st_optmag',      // We require optical magnitude to be provided so we know integration times required
          'pl_tranflag',    // Exoplanet must be transiting so we are able to observe it
          'pl_tranmid'      // We must know when the transit is going to happen
        ];

        let requestURL = baseURL
          + "&table=exoplanets&select=" + columns.join(',')
          + "&where=" + required_columns.join('%3E0%20and%20')
          + "%3E0" + "%20and%20pl_ttvflag=0";

        $.getJSON(requestURL, function(data) {
          App.dataManager.storage.exoplanets = data;
          App.cache.set('exoplanets', data);
          App.UI.subjectLoaded('exoplanets');
          App.exoplanets.moveExoplanetsIntoPlot();
        });
      }

      /**
       * Load NEOs
       */
      // var neos_url = "data/neos-10-mar-2019-ceres.json";
      // var neos_url = "data/neos-10-mar-2019.json";
      // var neos_url = "data/neos-10-mar-2019-test-sample.json";
      var neos_url = "data/neos-18-mar-2019.json";
      $.getJSON(neos_url, function(data) {
        App.dataManager.storage.neos = data;
        App.UI.subjectLoaded('neos');
        App.neos.moveNEOsIntoPlot();
      });

      /**
       * Set flag and disable button
       */
      App.UI.dataLoaded();
    }
  }
};
