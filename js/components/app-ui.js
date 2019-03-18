module.exports = function(App) {
  App.UI = {
    data: {
      subjects: 3,
      loaded_subjects: {
        exoplanets: false,
        neos: false,
        objects: false
      },
      last_highlight: 0,
    },

    moment: require('moment'),
    
    humanizeDuration(seconds) {
      var days = _.round(seconds / (24 * 3600)),
          avg_days_in_month = 30.43;

      if(days < avg_days_in_month) {
        return _.round(days) + ' days ago';
      }

      return _.round(days / avg_days_in_month) + ' month(s) ago';
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

    updateTimestep(timestep) {
     $('#performance-timestep').html(timestep);
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
        App.dataManager.loadData();
        $("#simulation-start-date").datepicker('disable');
        App.settings.$emit("simulation-initialized");
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
          e.preventDefault();

          if(App.pathFinder.data.interval_id === null) {
            $('#button-start').trigger('click');
            return;
          }

          $('#button-stop').trigger('click');
        }
      });
      
      $('#scan-data-json-export').on('click', function(e){
        App.output.exportOperationLog();
      });
      
      $('#scan-data-visualize').on('click', function(e){
        App.cache.set('scan-data-export', App.output.prepareOperationsForExport());
        
        window.open('visualise.php', 'formpopup', 'width=1000,height=700,resizeable,scrollbars');
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
      App.UI.loading(false);
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
        $('#' + subject + '-loaded > i').attr('class', flag ? 'fa fa-check' : 'fa fa-circle-o-notch fa-spin');
      });

      if(App.UI.allSubjectsLoaded()) {
        App.UI.dataLoadingComplete();
      }
    },

    highlightTargetArea() {
      return;
      
      let highlight_duration = 500;

      if(App.UI.currentTimestampMs() - App.UI.data.last_highlight < highlight_duration) {
        return;
      }

      App.UI.data.last_highlight = App.UI.currentTimestampMs();

      $('#exoplanet-target-info').effect("highlight", {
        color: '#D8FFDA'
      }, highlight_duration);
    },

    targetSelected(subject, data) {
      if(typeof data === 'undefined') {
        data = {};
      }

      if(subject == 'earth') {
        App.UI.updateOperation('idling');
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
        App.UI.updateOperation(data.data.full_name + ' spectroscopy', 'neo-spectroscopy'); ////
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
        integration:  target.integration_time > 60 ? _.round(target.integration_time / 60) + ' minutes' : '<1 minute',
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
      _.each({
        id:           target.id ? '#' + target.id : '-',
        name:         target.data.full_name || 'unknown',
        mag:          _.round(target.data.mag, 2),
        vmag:         _.round(target.data.vmag, 2),
        integration:  target.data.integration_time > 60 ? _.round(target.data.integration_time / 60) + ' minutes' : '<1 minute',
        spectnum:     target.spect_num > 0 ? (target.spect_num + ' (' + App.UI.humanizeDuration(App.pathFinder.data.timestamp - target.last_spectroscopy) + ')') : 'none yet',
        pdes:         target.data.pdes || 'unknown',
        nid:          target.data.nid || 'unknown',
        spkid:        target.data.spkid || 'unknown',
        obs2ast:      _.round(App.astrodynamics.km2AU(target.obs2ast), 2) + ' AU',
        obs2astL1E:   _.round(App.astrodynamics.km2L1E(target.obs2ast), 2) + ' L1E',
        sun2ast:      _.round(App.astrodynamics.km2AU(target.sun2ast), 2) + ' AU',
        smass:        target.data.smass || 'no data',
        tholen:       target.data.tholen || 'no data',
        a:            _.round(target.kepler[0], 2) + ' AU',
        e:            _.round(target.kepler[1], 3),
        i:            _.round(App.conversion.rad2deg(target.kepler[2]), 1) + '&deg;',
        slew_current: _.round(!_.isNaN(target.slew.current) ? target.slew.current : 0, 2).toFixed(2) + '&deg;/hr',
        slew_max:     _.round(!_.isNaN(target.slew.max) ? target.slew.max : 0, 2).toFixed(2) + '&deg;/hr',
      }, function(value, key) {
        $('#neo-' + key).html(value);
      });
      
      App.UI.highlightTargetArea();
    },

    updateNEODetails(target) {
      _.each({
        vmag:         _.round(target.data.vmag, 2).toFixed(2),
        integration:  target.data.integration_time > 60 ? _.round(target.data.integration_time / 60) + ' minutes' : '<1 minute',
        obs2ast:      _.round(App.astrodynamics.km2AU(target.obs2ast), 2).toFixed(2) + ' AU',
        obs2astL1E:   _.round(App.astrodynamics.km2L1E(target.obs2ast), 2).toFixed(2) + ' L1E',
        sun2ast:      _.round(App.astrodynamics.km2AU(target.sun2ast), 2).toFixed(2) + ' AU',
        slew_current: _.round(!_.isNaN(target.slew.current) ? target.slew.current : 0, 2).toFixed(2) + '&deg;/hr',
        slew_max:     _.round(!_.isNaN(target.slew.max) ? target.slew.max : 0, 2).toFixed(2) + '&deg;/hr',
      }, function(value, key) {
        $('#neo-' + key).html(value);
      });
      
      App.UI.highlightTargetArea();
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
    },

    dataStorage(percent) {
      percent = _.round(percent);

      var string = percent;

      if(percent > 100) {
        percent = 100;
        string = 100;
      } else if(percent < 5) {
        percent = 5;
      }

      $('#data-storage').toggleClass('progress-bar-warning', percent > 60)
        .toggleClass('progress-bar-danger', percent > 90)
        .css({ width: percent + '%' }).html(string + '%');
    },

    performanceCounter() {
      App.pathFinder.data.iterations++;

      if(App.pathFinder.data.iterations > 200) {
        App.UI.updateIPS(App.pathFinder.data.iteration_reference, App.pathFinder.data.iterations);

        App.pathFinder.data.iterations = 0;
        App.pathFinder.data.iteration_reference = App.UI.currentTimestampMs();

      }

      App.statistics.updateMissionLifetime();
      App.statistics.stopAtTheEnd();
    },
  }
};
