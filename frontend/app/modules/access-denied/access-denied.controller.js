app.controller('AccessDeniedController',function (
    $scope,
    LoadingMaskService,
    ApplicationService,
    loggedInUser
) {
    LoadingMaskService.deactivate();
    ApplicationService.hideNavigationIndicator();
    ApplicationService.displayPageHeader({ search: false});
    ApplicationService.updatePageHeader(loggedInUser);
});