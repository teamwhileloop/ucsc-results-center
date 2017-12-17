app.component('loadingIndicator', {
    templateUrl: 'public/html/components/loading-indicator/view.html',
    bindings: {
        loaderId: '@',
        loaderText: '<',
        diameter : '@'
    },
    controller: function LoadingIndicatorController($scope){
        $scope.$on(`loadingIndicator.${this.loaderId}`, (_event, args)=> {
            this.loaderText = args;
        });
    },
    controllerAs : 'loadingIndicatorCtrl'
});