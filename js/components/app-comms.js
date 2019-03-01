module.exports = function(App) {
  App.comms = {
    settings: {
      max: 100e9,
    },

    data: {
      storage: 0,
    },

    addData(data) {
      App.comms.data.storage = App.comms.data.storage + data;
      App.UI.dataStorage(App.comms.data.storage * 100 / App.comms.settings.max);
    }
  }
};
