app.controller('ViewFeedBackController',function (
    $scope,
    LoadingMaskService,
    loggedInUser,
    ApplicationService,
    AdminService)
{
    if (loggedInUser.power > 60){
        LoadingMaskService.deactivate();
        ApplicationService.hideNavigationIndicator();
        ApplicationService.displayPageHeader({ search: loggedInUser.state === 'verified'});
        ApplicationService.updatePageHeader(loggedInUser);
    }else{
        $location.path('access-denied');
    }
    $scope.isLoading = true;
    $scope.feedbacks = [];
    AdminService.getUserFeedbacks()
    .then((data)=>{
        $scope.feedbacks = data.data;
        $scope.isLoading = false;
    })
    .catch((err)=>{
        console.error(err)
    })

});