app.controller('PageHeaderController',function ($scope, $timeout, $mdSidenav) {

    $scope.pageHeaderVisibility = false;
    $scope.navigationIndicatorVisibility = false;
    $scope.navigationInfoBox = {};
    $scope.mainSearchEnabled = false;

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

    $scope.$on('pageHeader.show', (_event, args)=> {
        $scope.pageHeaderVisibility = true;
        $scope.mainSearchEnabled = !!args['search'];
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