require('./imports/bootstrap');
require('./imports/modernizr-mq');

function bindEvents() {
  //
}

function initialize() {
  bindEvents();
  App.cacheFunctions.initialize();
  App.pathFinder.initialize();
  App.UI.initialize();
  App.UI.loading(false);
}

const App = {
  container: {
    initialize
  },

  cache: require('lockr'),

  settings: {}
};

window.App = App;

require('./components/app-pathFinder')(App);
require('./components/app-conversion')(App);
require('./components/app-cache')(App);
require('./components/app-operations')(App);
require('./components/app-arithmetics')(App);
require('./components/app-ui')(App);
require('./components/app-chartSettings')(App);

App.container.initialize();
