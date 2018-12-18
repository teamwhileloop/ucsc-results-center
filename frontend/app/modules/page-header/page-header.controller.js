app.controller('PageHeaderController',function ($scope,
                                                $timeout,
                                                $mdSidenav,
                                                $location,
                                                ProfileService,
                                                $rootScope,
                                                AdminService)
{

    $scope.pageHeaderVisibility = false;
    $scope.navigationIndicatorVisibility = false;
    $scope.navigationInfoBox = {};
    $scope.mainSearchEnabled = false;
    $scope.userDetails = false;
    this.userRegistered = false;

    this.selectedItem = {};
    this.searchText = '';

    $scope.toggleSideBar = function() {
        $mdSidenav("sidebar")
            .toggle()
            .then(function() {});
    };

    $scope.goToProfile = function (indexNumber) {
        if (indexNumber){
            $location.path(`/profile/${indexNumber}`)
        }
        $mdSidenav('sidebar').close();
    };

    $rootScope.getRankName = function (power = 0) {
        if (power === 0){
            return 'Guest User';
        }if (power === 10){
            return 'Verified Member';
        }if (power === 50){
            return 'Batch Representative';
        }if (power === 60){
            return 'Analytics User';
        }if (power === 100){
            return 'System Administrator';
        }
    };

    $scope.searchConfirm = (item)=> {
        if (item !== undefined){
            this.searchText = '';
            $location.path("/profile/"+item.indexNumber);
        }
    };

    $scope.cacheSearch = function (query) {
        if (query.length > 3){
            return ProfileService.searchUndergraduate(query);
        }else{
            return ProfileService.searchUndergraduate($scope.userDetails.indexNumber.toString().substring(0,4) || '1');
        }
    };

    $scope.goToPath = function (path) {
        $location.path(path);
        $mdSidenav('sidebar').close();
    };

    $scope.forceScan = function(){
        AdminService.forceResultScan();
        $mdSidenav('sidebar').close();
    };

    $scope.closeSideBar = function () {
        $mdSidenav('sidebar').close();
    };

    socket.on('statistics', function(response){
        $scope.statistics = response;
        $scope.$apply();
    });

    $scope.$on('sidebar.open', (_event, _args)=> {
        $mdSidenav('sidebar').open();
    });

    $scope.$on('pageHeader.user.update', (_event, args)=> {
        $scope.userDetails = args;
        if (!this.userRegistered){
            userDataUpdate();
            this.userRegistered = true;
        }
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

    function userDataUpdate()
    {
        socket.emit('usr-auth', { name: $scope.userDetails ? $scope.userDetails.name : "Facebook User"});
    }
});