app.controller('AdminUsersController',function (
    $scope,
    $mdDialog,
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
        count: 50,
        total: -1,
        loading: true,
        search: '',
        filter: 'pending'
    };
    $scope.userList = [];
    $scope.currentUser = loggedInUser;

    console.log('AdminUsers loaded');

    if (loggedInUser.power >= 50){
        LoadingMaskService.deactivate();
        ApplicationService.hideNavigationIndicator();
        ApplicationService.displayPageHeader({ search: true});
        ApplicationService.updatePageHeader(loggedInUser);
    }else{
        $location.path('access-denied');
    }

    getUsers($scope.paginationCtrl.filter, $scope.paginationCtrl.count ,$scope.paginationCtrl.page);

    this.acceptConfirmation = {
        title: 'Accept Request',
        content: 'Are you sure that you want to accept this claim request ?',
        confirm: 'Accept',
        cancel: 'Cancel',
        scope: $scope
    };

    this.setPageCount = function (count) {
        $scope.paginationCtrl.count = count;
        getUsers($scope.paginationCtrl.filter, $scope.paginationCtrl.count ,$scope.paginationCtrl.page);
    };

    this.refreshList = function () {
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
            case 'verified':
                return 'Verified';
            case 'pending':
                return 'Pending';
            case 'blocked':
                return 'Blocked';
            case 'guest':
                return 'Guest';
        }
    };

    $scope.acceptRequest = function(fbUser){
        let confirm = $mdDialog.confirm()
            .title('Accept Request ?')
            .textContent(`Are you sure that you want to accept the request of user ${fbUser.name} ?`)
            .ok('Accept Request')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
            acceptRequest(fbUser)
        }, function() {
            return 0;
        });
    };
    $scope.rejectRequest = function(fbUser){
        let confirm = $mdDialog.confirm()
            .title('Reject Request ?')
            .textContent(`Are you sure that you want to reject the request of user ${fbUser.name} ?`)
            .ok('Reject Request')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
            rejectRequest(fbUser)
        }, function() {
            return 0;
        });
    };
    $scope.resetUser = function(fbUser){
        let confirm = $mdDialog.confirm()
            .title('Reset Profile ?')
            .textContent(`Are you sure that you want to reset the profile of user ${fbUser.name} ?`)
            .ok('Reset Profile')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
            resetUser(fbUser)
        }, function() {
            return 0;
        });

    };

    $scope.keyPressed = function (keyEvent) {
        if (keyEvent.keyCode === 13) {
            getUsers($scope.paginationCtrl.filter, $scope.paginationCtrl.count ,$scope.paginationCtrl.page);
        }
    };

    $scope.setRank = function (userData) {
        $mdDialog.show({
            controller: "RoleController",
            templateUrl: 'public/html/modules/administration/users/Role.html',
            parent: angular.element(document.body),
            clickOutsideToClose:true,
            user: userData
        });

    };

    function acceptRequest(person) {
        AdminService.acceptUserRequest(person.id)
        .then((response)=>{
            if (response.data.success){
                ApplicationService.pushNotification({
                    title: 'Request Accepted',
                    text : `Request of ${person.name} accepted. A confirmation email has being sent`,
                    template : 'info',
                    autoDismiss : true
                });
            }else{
                ApplicationService.pushNotification({
                    title: 'Failed to Accept Request',
                    text : response.data.message,
                    template : 'error',
                    autoDismiss : false
                });
            }
            getUsers($scope.paginationCtrl.filter, $scope.paginationCtrl.count ,$scope.paginationCtrl.page);
        })
    }

    function rejectRequest(person) {
        AdminService.rejectUserRequest(person.id)
        .then((response)=>{
            if (response.data.success){
                ApplicationService.pushNotification({
                    title: 'Request Rejected',
                    text : `Request of ${person.name} rejected. `,
                    template : 'info',
                    autoDismiss : true
                });
            }else{
                ApplicationService.pushNotification({
                    title: 'Failed to Reject Request',
                    text : response.data.message,
                    template : 'error',
                    autoDismiss : false
                });
            }
            getUsers($scope.paginationCtrl.filter, $scope.paginationCtrl.count ,$scope.paginationCtrl.page);
        })
    }

    function resetUser(person) {
        AdminService.resetUser(person.id)
        .then((response)=>{
            if (response.data.success){
                ApplicationService.pushNotification({
                    title: 'User Reset Completed',
                    text : `Profile of ${person.name} has being reset. `,
                    template : 'info',
                    autoDismiss : true
                });
            }else{
                ApplicationService.pushNotification({
                    title: 'Failed to Reset User Profile',
                    text : response.data.message,
                    template : 'error',
                    autoDismiss : false
                });
            }
            getUsers($scope.paginationCtrl.filter, $scope.paginationCtrl.count ,$scope.paginationCtrl.page);
        })
    }

    function getUsers(state, count, page) {
        $scope.paginationCtrl.loading = true;
        AdminService.getUserList(state, count, page, $scope.paginationCtrl.search)
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

    $rootScope.$on('reload-users', function () {
        getUsers($scope.paginationCtrl.filter, $scope.paginationCtrl.count ,$scope.paginationCtrl.page);
    })

});