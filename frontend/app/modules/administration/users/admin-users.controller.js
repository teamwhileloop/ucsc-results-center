app.controller('AdminUsersController',function (
    $scope,
    $rootScope,
    LoadingMaskService,
    ProfileService,
    loggedInUser,
    $location,
    ApplicationService)
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

    this.acceptConfirmation = {
        title: 'Accept Request',
        content: 'Are you sure that you want to accept this claim request ?',
        confirm: 'Accept',
        cancel: 'Cancel'
    };

    console.log('AdminUsers loaded');

    if (loggedInUser.power >= 50){
        $scope.accessDenied = false;
    }

    this.acceptRequest = function(fbId){
        console.log('ok', fbId);
    }

});