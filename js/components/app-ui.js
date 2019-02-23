let moment = require('moment');

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

    moment,

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
        $('#button-start').html('Continue');
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
      });

      /**
       * Bind keyboard events
       */
      $('body').keyup(function(e){
        if(e.keyCode == 32){
          if(App.pathFinder.data.interval_id === null) {
            App.pathFinder.start();
            return;
          }

          App.pathFinder.stop();
        }
      });
    },

    initialized() {
      App.pathFinder.data.initialized = true;
      $('#button-initialize').prop('disabled', 'disabled');
      $('#button-load-data').removeAttr('disabled');
      App.UI.setStatus('initialized');
    },

    simulationStarted() {
      App.UI.setStatus('<i class=\'fa fa-cog fa-spin\'></i> running');
      $('#button-start').prop('disabled', 'disabled');
      $('#button-stop').removeAttr('disabled');
    },

    simulationStopped() {
     App.UI.setStatus('<i class=\'fa fa-pause\'></i> stopped');
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

    setStatus(status) {
      $('#status').html(status);
    },

    setDate(date) {
      var date = App.UI.moment(date*1000).format("D MMMM YYYY - HH:mm");
      $('.highcharts-container .highcharts-subtitle').html(date);
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

    setTargetDetails(target) {
      if(target.name === undefined) {
        target.name = "not known";
      }

      if(target.host === undefined) {
        target.host = "not known";
      }

      if(target.optmag === undefined) {
        target.optmag = "not known";
      }

      if(target.integration === undefined) {
        target.integration = "not known";
      }

      $('#target-name').html(target.name);
      $('#target-host').html(target.host);
      $('#target-optmag').html(target.optmag);
      $('#target-integration').html(target.integration);
    }
  }
};
