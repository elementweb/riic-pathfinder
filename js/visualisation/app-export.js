var FileSaver = require('file-saver');

module.exports = function(App) {
  App.export = {
    save(data, filename = 'asros-export.json') {
      var blob = new Blob([JSON.stringify(data)], {
        type: "application/json;charset=utf-8"
      });

      FileSaver.saveAs(blob, filename);
    }
  }
};
