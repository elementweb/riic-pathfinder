module.exports = function(App) {
  App.UI = {
    data: {
      loaded_subjects: {
        exoplanets: false,
        neos: false,
        objects: false
      }
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
      $('.highcharts-container .highcharts-subtitle').html('Date: ' + date);
    },

    loading(condition) {
      $('#loading-indicator').toggle(condition);
    },

    subjectLoaded(subject) {
      App.UI.data.loaded_subjects[subject] = true;
      App.UI.refreshLoadedSubjects();
    },

    refreshLoadedSubjects() {
      _.each(App.UI.data.loaded_subjects, function(flag, subject){
        $('#' + subject + '-loaded > i').attr('class', flag ? 'fa fa-check' : 'fa fa-times');
      });

      if(_.filter(App.UI.data.loaded_subjects, function(flag) { return flag; }).length === 3) {
        App.UI.dataLoadingComplete();
      }
    }
  }
};
