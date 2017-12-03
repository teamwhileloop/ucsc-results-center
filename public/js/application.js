let app = angular.module('ucscResultsCenter', ['ngRoute']);
app.config(function($routeProvider) {
    $routeProvider
        .when("/",{
            controller:'LoginController',
            templateUrl:'public/html/modules/login/view.html',
            controllerAs : 'ctrlLogin',
            resolve : {
                init : function (LoadingMaskService) {
                    LoadingMaskService.activate();
                }
            }
        })
});
function displayFacebookSupport(visibility) {
    var indicator = document.getElementById("facebookSupportBox");
    var chatBox = document.getElementById("supportIndicator");
    if (visibility) {
        indicator.style.visibility = "hidden";
        chatBox.style.visibility = "visible";
    } else {
        indicator.style.visibility = "visible";
        chatBox.style.visibility = "hidden";
    }
}
app.controller('LoadingMaskController',function ($scope) {

    this.isActivated = true;
    $scope.$on('loading-mask.activate', (_event, _args) => {
        this.isActivated = true;
    });

    $scope.$on('loading-mask.deactivate', (_event, _args)=> {
        this.isActivated = false;
    });

});
app.service('LoadingMaskService',function ($rootScope) {
    return {
        activate: function () {
            $rootScope.$broadcast('loading-mask.activate')
        },
        deactivate: function () {
            $rootScope.$broadcast('loading-mask.deactivate')
        }
    };
});
app.controller('LoginController',function ($scope,LoadingMaskService) {
    LoadingMaskService.deactivate();
    this.ss = ()=>{
        LoadingMaskService.activate();
    }
});