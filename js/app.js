require('./imports/bootstrap');
require('./imports/modernizr-mq');

function bindEvents() {
  //
}

function initialize() {
  bindEvents();
}

const App = {
  container: {
    initialize
  },

  settings: {}
};

window.App = App;

require('./components/app-pathFinder')(App);

App.container.initialize();
App.pathFinder.initialize();
