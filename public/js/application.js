let app = angular.module('ucscResultsCenter', [
    'ngRoute',
    'ngMaterial']
);
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
app.controller('LoginController',function ($scope,LoadingMaskService,PageHeaderService,$timeout) {

    $timeout(function () {
        LoadingMaskService.deactivate();
    }, 5000);

    this.ss = ()=>{
        PageHeaderService.displayPageHeader();
        PageHeaderService.showNavigationIndicator({
            enabled: true,
            icon: 'fingerprint',
            text: 'Authenticating using Facebook'
        });
    }
});
app.controller('PageHeaderController',function ($scope, $timeout, $mdSidenav) {

    $scope.pageHeaderVisibility = false;
    $scope.navigationIndicatorVisibility = false;
    $scope.navigationInfoBox = {};

    $scope.toggleSideBar = function() {
        $mdSidenav("sidebar")
            .toggle()
            .then(function() {});
    };

    $scope.closeSideBar = function () {
        $mdSidenav('sidebar').close();
    };

    $scope.$on('sidebar.open', (_event, _args)=> {
        $mdSidenav('sidebar').open();
    });

    $scope.$on('sidebar.close', (_event, _args)=> {
        $mdSidenav('sidebar').close();
    });

    $scope.$on('pageHeader.hide', (_event, _args)=> {
        $scope.pageHeaderVisibility = false;
    });

    $scope.$on('pageHeader.show', (_event, _args)=> {
        $scope.pageHeaderVisibility = true;
    });

    $scope.$on('navigationIndicator.show', (_event, args)=> {
        $scope.navigationInfoBox = Object.assign({
            icon: 'swap_horiz',
            enabled: false,
            text: 'Loading content'
        },args);
        $scope.navigationIndicatorVisibility = true;
    });

    $scope.$on('navigationIndicator.hide', (_event, _args)=> {
        $scope.navigationIndicatorVisibility = false;
    });
});
app.service('PageHeaderService',function ($rootScope) {
    return {
        openSidebar: function () {
            $rootScope.$broadcast('sidebar.open')
        },
        closeSideBar: function () {
            $rootScope.$broadcast('sidebar.close')
        },
        displayPageHeader: function () {
            $rootScope.$broadcast('pageHeader.show')
        },
        hidePageHeader: function () {
            $rootScope.$broadcast('pageHeader.hide')
        },
        hideNavigationIndicator: function () {
            $rootScope.$broadcast('navigationIndicator.hide')
        },
        showNavigationIndicator: function (infoBoxData = {}) {
            $rootScope.$broadcast('navigationIndicator.show',infoBoxData)
        }
    };
});