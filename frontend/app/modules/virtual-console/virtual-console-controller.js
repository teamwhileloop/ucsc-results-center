app.controller('VirtualConsoleController',function (
    $scope,
    $rootScope,
    LoadingMaskService,
    ProfileService,
    loggedInUser,
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
    LoadingMaskService.deactivate();
    ApplicationService.hideNavigationIndicator();
    ApplicationService.displayPageHeader();
    ApplicationService.updatePageHeader(loggedInUser);

    this.getFilterText = function (text) {
        switch (text){
            case 'crit':
                return 'Critical Events';
                break;
            case 'info':
                return 'Informative Events';
                break;
            case 'warn':
                return 'Warning Events';
                break;
            case 'log':
                return 'Log Events';
                break;
            case 'live':
                return 'Live Events';
                break;
            case undefined:
                return 'All Events';
                break;
            default:
                return `${text} Events`;
                break;
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
    };

    console.log('VirtualConsoleController loaded');
    console.log(loggedInUser);

    this.logs = [];

    if (loggedInUser.power >= 50){
        $scope.accessDenied = false;

        this.refreshLogs(1, 15);
    }

});