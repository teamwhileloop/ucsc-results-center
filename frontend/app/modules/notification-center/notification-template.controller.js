app.controller('NotificationTemplateController',function (
    notificationData,
    $mdDialog,
    editMode,
    responseHandler,
    $scope)
{
    $scope.notificationTemplate = notificationData;
    $scope.notificationTemplate.showAlways = '' + notificationData.showAlways;
    $scope.notificationTemplate.autoDismiss = '' + notificationData.autoDismiss;
    $scope.editMode = editMode;
    $scope.cancel = function() {
        $mdDialog.cancel();
    };


    $scope.submit = function() {
        $mdDialog.hide();
        $scope.notificationTemplate.showAlways = parseInt($scope.notificationTemplate.showAlways) > 0 ? 1 : 0;
        $scope.notificationTemplate.autoDismiss = parseInt($scope.notificationTemplate.autoDismiss) > 0 ? 1 : 0;
        $scope.notificationTemplate.autoDismissDelay = parseInt($scope.notificationTemplate.autoDismissDelay) || 5000;
        responseHandler($scope.notificationTemplate);
    };

});