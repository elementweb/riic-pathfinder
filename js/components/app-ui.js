module.exports = function(App) {
  App.UI = {
    initialize() {
      /**
       * Initially disabling some of the buttons
       */
      $('#button-start').prop('disabled', 'disabled');
      $('#button-stop').prop('disabled', 'disabled');

      /**
       * Binding button events
       */
      $('#button-initialize').on('click', function(e) {
        App.pathFinder.initializeSeries();
        e.preventDefault();
      });

      $('#button-start').on('click', function(e) {
        App.pathFinder.start();
        e.preventDefault();
      });

      $('#button-stop').on('click', function(e) {
        App.pathFinder.stop();
        e.preventDefault();
      });
    },

    initialized() {
      App.pathFinder.data.initialized = true;
      $('#button-initialize').prop('disabled', 'disabled');
      $('#button-start').removeAttr('disabled');
      App.UI.setStatus('initialized');
    },

    simulationStarted() {
      App.UI.setStatus('running');
      $('#button-start').prop('disabled', 'disabled');
      $('#button-stop').removeAttr('disabled');
    },

    simulationStopped() {
     App.UI.setStatus('stopped');
      $('#button-stop').prop('disabled', 'disabled');
      $('#button-start').removeAttr('disabled');
    },

    setStatus(status) {
      $('#status').html(status);
    },

    setDate(date) {
      $('.highcharts-container .highcharts-subtitle').html('Date: ' + date);
    }
  }
};
