app.controller('PublicProfileSetupController',function (
    $scope,
    LoadingMaskService,
    loggedInUser,
    ApplicationService,
    ProfileService,
    $location
) {
    $scope.loadingData = true;
    LoadingMaskService.deactivate();
    ApplicationService.hideNavigationIndicator();
    ApplicationService.displayPageHeader({ search: true});
    ApplicationService.updatePageHeader(loggedInUser);

    $scope.verfiedUser = loggedInUser.state === 'verified';
    $scope.indexNumber = loggedInUser.indexNumber;
    $scope.hostName = window.location.host;

    $scope.settings = {
        enabled: false,
        showName: false,
        showRank: false
    };

    ProfileService.getPublicProfileSettings()
        .then((response)=>{
            $scope.loadingData = false;
            $scope.settings = Object.assign($scope.settings, response.data);
        })
        .catch((err)=>{
            ApplicationService.pushNotification({
                title: 'Unable to Get Settings',
                text : "Unable to Get Settings",
                template : 'error',
                autoDismiss : true
            });
        });

    $scope.saveChanges = function () {
        ProfileService.setPublicProfileSettings($scope.settings)
            .catch((err)=>{
                ApplicationService.pushNotification({
                    title: 'Unable to Save',
                    text : "Failed to Save the changes you made to your public profile.",
                    template : 'error',
                    autoDismiss : true
                });
            })
    }
});