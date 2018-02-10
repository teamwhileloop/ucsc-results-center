app.controller('AdminUsersController',function (
    $scope,
    $rootScope,
    $window,
    LoadingMaskService,
    AdminService,
    loggedInUser,
    $location,
    ApplicationService)
{
    $scope.accessDenied = true;
    $scope.paginationCtrl = {
        pages: [],
        current: 0,
        count: 25,
        total: -1,
        loading: true,
        filter: 'e'
    };
    $scope.userList = [];

    if (loggedInUser.state !== 'verified'){
        $location.path('access-denied');
    }else{
        LoadingMaskService.deactivate();
        ApplicationService.hideNavigationIndicator();
        ApplicationService.displayPageHeader({ search: true});
        ApplicationService.updatePageHeader(loggedInUser);
    }

    console.log('AdminUsers loaded');

    if (loggedInUser.power >= 50){
        $scope.accessDenied = false;
    }

    getUsers($scope.paginationCtrl.filter, $scope.paginationCtrl.count ,$scope.paginationCtrl.page);

    this.acceptConfirmation = {
        title: 'Accept Request',
        content: 'Are you sure that you want to accept this claim request ?',
        confirm: 'Accept',
        cancel: 'Cancel',
        scope: $scope
    };



    this.acceptRequest = function(fbId){
        console.log('ok', fbId);
    };

    this.setPageCount = function (count) {
        $scope.paginationCtrl.count = count;
        getUsers($scope.paginationCtrl.filter, $scope.paginationCtrl.count ,$scope.paginationCtrl.page);
    };

    this.setFilter = function (filter) {
        $scope.paginationCtrl.filter = filter;
        getUsers($scope.paginationCtrl.filter, $scope.paginationCtrl.count ,$scope.paginationCtrl.page);
    };

    this.getUsersList = function (page) {
        getUsers($scope.paginationCtrl.filter, $scope.paginationCtrl.count , page);
    };

    this.goToFacebookProfile = function (person) {
        $window.open(person.link);
    };

    $scope.getFilterName = function (code) {
        //'verified', 'pending', 'blocked', 'guest'
        switch (code){
            case 'e':
                return 'All';
            case 'Verified':
                return 'Verified';
            case 'pending':
                return 'Pending';
            case 'blocked':
                return 'Blocked';
            case 'guest':
                return 'Guest';
        }
    };

    function getUsers(state, count, page) {
        $scope.paginationCtrl.loading = true;
        AdminService.getUserList(state, count, page)
            .then((data)=>{
                $scope.userList = [];
                $scope.userList = data.data.data;
                $scope.paginationCtrl.pages = _.range(data.data.meta.totalPages);
                $scope.paginationCtrl.current = data.data.meta.page;
                $scope.paginationCtrl.count = data.data.meta.count;
                $scope.paginationCtrl.totalPages = data.data.meta.totalPages;
                $scope.paginationCtrl.total = data.data.meta.total;
                $scope.paginationCtrl.filter = data.data.meta.state;
                $scope.paginationCtrl.loading = false;
            })
            .catch((error)=>{
                console.error(error);
            })
    }

});