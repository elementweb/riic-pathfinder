module.exports = function(App) {
  App.UI = {
    data: {
      subjects: 3,
      loaded_subjects: {
        exoplanets: false,
        neos: false,
        objects: false
      }
    },

    moment: require('moment'),
    
    humanizeDuration(seconds) {
      return _.round(seconds / (30.43 * 24 * 3600)) + ' months ago';
    },

    currentTimestamp() {
      return App.UI.moment().unix() * 1;
    },

    currentTimestampMs() {
      return App.UI.moment().format('x') * 1;
    },

    initializePerformanceIndicator() {
      $('#performance-container').removeClass('hidden');
      $('#performance-timestep').html(App.pathFinder.data.simulation.timestep_sec);
      App.pathFinder.data.iteration_reference = App.UI.currentTimestampMs();
    },

    updateIPS(reference, iterations) {
     $('#performance-itps').html(_.round(iterations * 1000 / (App.UI.currentTimestampMs() - reference), 1).toFixed(1));
    },

    initialize() {
      /**
       * Initially disabling some of the buttons
       */
      $('#button-start').prop('disabled', 'disabled');
      $('#button-stop').prop('disabled', 'disabled');
      $('#button-load-data').prop('disabled', 'disabled');

      /**
       * Binding button events
       */
      $('#button-initialize').on('click', function(e) {
        App.pathFinder.initializePlot();
      });

      $('#button-start').on('click', function(e) {
        App.pathFinder.start();
      });

      $('#button-stop').on('click', function(e) {
        App.pathFinder.stop();
        $('#button-start').html('Resume');
      });

      $('#button-load-data').on('click', function(e) {
        App.pathFinder.loadData();
      });

      $('#button-flush-cache').on('click', function(e) {
        App.cache.flush();
        window.location.reload();
      });

      $('#button-reset').on('click', function(e) {
        window.location.reload();
      });

      /**
       * Bind debug button events
       */
      $('#debug-select-random').on('click', function(e) {
        App.debug.selectRandomTargetInScope();
        e.preventDefault();
      });

      /**
       * Bind keyboard events
       */
      $('body').keyup(function(e){
        if(e.keyCode == 32){
          if(App.pathFinder.data.interval_id === null) {
            $('#button-start').trigger('click');
            return;
          }

          $('#button-stop').trigger('click');
        }
      });

      /**
       * Initialize settings
       */
      $('input[type=radio][name=use-plot]').change(function() {
        App.pathFinder.data.visualisation_enabled = this.value == 1;

        $('#visualisation-status').toggleClass('hidden', this.value == 1);
      });

      $('input[type=radio][name=multiple-spectroscopies]').change(function() {
        App.exoplanets.settings.allow_multiple_spectroscopies = this.value == 1;
      });
    },

    initialized() {
      App.pathFinder.data.initialized = true;
      $('#button-initialize').prop('disabled', 'disabled');
      $('#button-load-data').removeAttr('disabled');
      App.UI.setStatus('initialized');
    },

    simulationStarted() {
      App.UI.setStatus('<i class=\'fa fa-cog fa-spin\'></i> running', 'running');
      $('#button-start').prop('disabled', 'disabled');
      $('#button-stop').removeAttr('disabled');
    },

    simulationStopped() {
     App.UI.setStatus('<i class=\'fa fa-pause\'></i> stopped', 'stopped');
      $('#button-stop').prop('disabled', 'disabled');
      $('#button-start').removeAttr('disabled');
    },

    dataLoaded() {
      $('#button-load-data').prop('disabled', 'disabled');
    },

    dataLoadingComplete() {
      $('#button-start').removeAttr('disabled');
      App.UI.setStatus('data loaded');
    },

    setStatus(status, classname) {
      $('#status').html(status).attr('class', classname || '');
    },

    setDate(date) {
      var date = App.UI.moment(date*1000).format("D MMMM YYYY - HH:mm");
      $('.highcharts-container .highcharts-subtitle').html('L1 FOV @ ' + date);
    },

    loading(condition) {
      $('#loading-indicator').toggle(condition);
    },

    subjectLoaded(subject) {
      App.UI.data.loaded_subjects[subject] = true;
      App.UI.refreshLoadedSubjects();
    },

    allSubjectsLoaded() {
      return _.filter(App.UI.data.loaded_subjects, function(flag) { return flag; }).length === App.UI.data.subjects;
    },

    refreshLoadedSubjects() {
      _.each(App.UI.data.loaded_subjects, function(flag, subject){
        $('#' + subject + '-loaded > i').attr('class', flag ? 'fa fa-check' : 'fa fa-times');
      });

      if(App.UI.allSubjectsLoaded()) {
        App.UI.dataLoadingComplete();
      }
    },

    highlightTargetArea() {
      $('#exoplanet-target-info').effect("highlight", {
        color: '#D8FFDA'
      }, 500);
    },

    targetSelected(subject, data) {
      if(typeof data === 'undefined') {
        data = {};
      }

      if(subject == 'earth') {
        App.UI.updateOperation('idling');
        return;
      }

      if(subject == 'comms') {
        App.UI.updateOperation('sending data to Earth', 'comms');
        return;
      }

      if(subject == 'exoplanet') {
        $('.targeting > .subject').addClass('hidden');
        $('#exoplanet-target-info').removeClass('hidden');
        App.UI.updateOperation(data.pl_name + ' spectroscopy', 'exoplanet-spectroscopy');
        App.UI.setExoplanetDetails(data);
        return;
      }

      if(subject == 'neo') {
        $('.targeting > .subject').addClass('hidden');
        $('#neo-target-info').removeClass('hidden');
        App.UI.updateOperation(data.name + ' spectroscopy', 'neo-spectroscopy'); ////
        App.UI.setNEODetails(data);
        return;
      }

      App.UI.updateOperation('idling');
    },

    setExoplanetDetails(target) {
      _.each({
        id:           target.id ? '#' + target.id : '-',
        name:         target.pl_name || 'unknown',
        host:         target.pl_hostname || 'unknown',
        optmag:       _.round(target.st_optmag, 2),
        integration:  _.round(target.integration_time / 3600, 2) + ' hours',
        discovery:    target.pl_disc || 'unknown',
        method:       target.pl_discmethod || 'unknown',
        equilibrium:  target.pl_eqt ? target.pl_eqt + 'K (' + _.round(App.conversion.TUC.k2c(target.pl_eqt)) + '&deg;C)' : 'unknown',
        transit:      _.round(target.transit_duration / 3600, 2) + ' hours',
        period:       target.pl_orbper ? _.round(target.pl_orbper, 2) + ' days' : '-',
        distance:     target.st_dist ? target.st_dist + 'pc (' + _.round(App.conversion.pc2ly(target.st_dist), 1) + 'ly)' : 'unknown',
        strad:        _.round(target.st_rad, 1) + ' SR',
        plrad:        _.round(App.conversion.SR2ER(target.pl_rads), 1) + ' ER',
        status:       App.exoplanets.resolveCatalogStatus(target.pl_status),
        spectnum:     target.spect_num > 0 ? (target.spect_num + ' (' + App.UI.humanizeDuration(App.pathFinder.data.timestamp - target.last_spectroscopy) + ')') : 'none yet',
        class:        target.st_spstr || 'unknown',
        classnum:     target.st_spn || 'unknown',
      }, function(value, key) {
        $('#exoplanet-' + key).html(value);
      });

      App.UI.highlightTargetArea();
    },

    setNEODetails(target) {
      App.UI.highlightTargetArea();

      return;
    },

    updateOperation(operation, classname) {
      $('#operation-status').html(operation).attr('class', classname || '');
    },

    updateExoplanetsScope(scope) {
      $('#exoplanets-scope').html(scope);
    },

    consoleMessage(message) {
      if($('#debug-last-message').length <= 0) {
        return;
      }
      
      $('#debug-last-message').html(message);
    }
  }
};
