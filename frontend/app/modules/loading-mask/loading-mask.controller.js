app.controller('LoadingMaskController',function ($scope) {

    this.isActivated = true;
    $scope.$on('loading-mask.activate', (_event, _args) => {
        this.isActivated = true;
    });

    $scope.$on('loading-mask.deactivate', (_event, _args)=> {
        this.isActivated = false;
    });

});