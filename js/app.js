require('./vendor/bootstrap');
require('./vendor/modernizr-mq');

function bindEvents() {
  //
}

function initialize() {
  bindEvents();
  App.cacheFunctions.initialize();
  App.pathFinder.initialize();
  App.UI.initialize();
  App.UI.loading(false);

  // Automaticall initialize plot on DOM ready
  App.pathFinder.initializePlot();
}

const App = {
  container: {
    initialize
  },

  cache: require('lockr'),

  settings: {}
};

window.App = App;

require('./components/app-chartSettings')(App);
require('./components/app-pathFinder')(App);
require('./components/app-conversion')(App);
require('./components/app-cache')(App);
require('./components/app-operations')(App);
require('./components/app-arithmetics')(App);
require('./components/app-ui')(App);
require('./components/app-statistics')(App);
require('./components/app-debug')(App);
require('./components/app-spectroscopy')(App);
require('./components/app-targeting')(App);

App.container.initialize();
App.statistics.initialize();
