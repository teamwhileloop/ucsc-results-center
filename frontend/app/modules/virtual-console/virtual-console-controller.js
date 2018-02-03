app.controller('VirtualConsoleController',function (
    $scope,
    $rootScope,
    LoadingMaskService,
    ProfileService,
    loggedInUser,
    $location,
    ApplicationService,
    VirtualConsoleService)
{
    $scope.accessDenied = true;
    $scope.paginationCtrl = {
        pages: [],
        current: 0,
        count: 15,
        total: -1,
        loading: true,
        filter: undefined
    };

    if (loggedInUser.state !== 'verified'){
        $location.path('access-denied');
    }else{
        LoadingMaskService.deactivate();
        ApplicationService.hideNavigationIndicator();
        ApplicationService.displayPageHeader({ search: true});
        ApplicationService.updatePageHeader(loggedInUser);
    }

    this.getFilterText = function (text) {
        switch (text){
            case 'crit':
                return 'Critical Events';
            case 'info':
                return 'Informative Events';
            case 'warn':
                return 'Warning Events';
            case 'log':
                return 'Log Events';
            case 'live':
                return 'Live Events';
            case undefined:
                return 'All Events';
            default:
                return `${text} Events`;
        }
    };

    this.refreshLogs = function (page, count, filter) {
        $scope.paginationCtrl.loading = true;
        VirtualConsoleService.getConsoleLog(page, count, filter)
        .then((data)=>{
            this.logs = [];
            this.logs = data.data;
            $scope.paginationCtrl.pages = _.range(data.data.meta.totalPages);
            $scope.paginationCtrl.current = data.data.meta.page;
            $scope.paginationCtrl.count = data.data.meta.count;
            $scope.paginationCtrl.totalPages = data.data.meta.totalPages;
            $scope.paginationCtrl.total = data.data.meta.total;
            $scope.paginationCtrl.filter = data.data.meta.filter === 'all' ? undefined: data.data.meta.filter;
            $scope.paginationCtrl.loading = false;
        })
        .catch((error)=>{
            console.error(error);
        })
    };

    console.log('VirtualConsoleController loaded');
    console.log(loggedInUser);

    this.logs = [];

    if (loggedInUser.power >= 50){
        $scope.accessDenied = false;

        this.refreshLogs(1, 15);
    }

});