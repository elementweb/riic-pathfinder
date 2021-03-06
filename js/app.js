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

  log(message) {
    console.log(message);
    App.UI.consoleMessage(message);
  },

  cache: require('lockr'),

  math: require('mathjs'),

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
require('./components/app-exoplanets')(App);
require('./components/app-objects')(App);
require('./components/app-neos')(App);
require('./components/app-astrodynamics')(App);
require('./components/app-dataManager')(App);
require('./components/app-export')(App);
require('./components/app-settings')(App);
require('./components/app-output')(App);

App.container.initialize();
App.statistics.initialize();
