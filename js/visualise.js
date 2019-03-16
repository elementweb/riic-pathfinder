require('./vendor/bootstrap');
require('./vendor/modernizr-mq');

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

  cache: require('lockr'),

  moment: require('moment'),

  math: require('mathjs'),

  settings: {}
};

window.App = App;

require('./visualisation/app-main')(App);

App.container.initialize();
App.main.load();
