module.exports = function(App) {
  App.debug = {
    selectRandomTargetInScope() {
      // deprecated
      return;
      
      if(!App.pathFinder.data.initialized
        || !App.UI.allSubjectsLoaded()) {
        return;
      }

      var scope = App.pathFinder.data.exoplanets_in_scope,
          target = scope[Math.floor(Math.random() * scope.length)];

      while(!App.exoplanets.selectExoplanetTargetById(target.id)) {
        scope = App.pathFinder.data.exoplanets_in_scope;
        target = scope[Math.floor(Math.random() * scope.length)];

        App.log('target selection failed');
      }
    }
  }
};
