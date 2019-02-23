module.exports = function(App) {
  App.debug = {
    selectRandomTargetInScope() {
      if(!App.pathFinder.data.initialized
        || !App.UI.allSubjectsLoaded()) {
        return;
      }

      var scope = App.pathFinder.data.exoplanets_in_scope,
          target = scope[Math.floor(Math.random() * scope.length)];

      App.pathFinder.selectTargetById(target.id);
    }
  }
};
