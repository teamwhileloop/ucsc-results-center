app.controller('PrivacyController',function ($scope, LoadingMaskService, loggedInUser, ApplicationService, ProfileService) {
    $scope.loadingData = true;
    $scope.saved = false;
    if (loggedInUser.state !== 'verified'){
        $location.path('access-denied');
    }else{
        LoadingMaskService.deactivate();
        ApplicationService.hideNavigationIndicator();
        ApplicationService.displayPageHeader({ search: true});
        ApplicationService.updatePageHeader(loggedInUser);
    }

    reloadData();

    function reloadData(displaySavedBanner = false) {
        $scope.loadingData = true;
        ProfileService.getPrivacy()
        .then((response)=>{
            $scope.data = {
                privacyValue : response.data.privacy
            };
            $scope.loadingData = false;
            $scope.saved = displaySavedBanner;
        });
    }

    $scope.save = function () {
        $scope.savingData = true;
        ProfileService.setPrivacy($scope.data.privacyValue)
        .then(()=>{
            reloadData(true);
            $scope.savingData = false;
        })
    }
});