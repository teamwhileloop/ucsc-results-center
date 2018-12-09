app.controller('SendFeedBackController',function (
    $scope,
    LoadingMaskService,
    loggedInUser,
    ApplicationService,
    ProfileService)
{
    LoadingMaskService.deactivate();
    ApplicationService.hideNavigationIndicator();
    ApplicationService.displayPageHeader({ search: loggedInUser.state === 'verified'});
    ApplicationService.updatePageHeader(loggedInUser);
    $scope.sent = false;
    $scope.sending = false;
    $scope.userFeedBack = "";

    $scope.submit = function (data) {
        if (data.length === 0){
            return;
        }
        $scope.sending = true;
        ProfileService.sendFeedBack(data)
            .then((data)=>{
                ApplicationService.pushNotification({
                    title: 'Feedback Sent',
                    text : `Your feedback has being sent to Team whileLOOP`,
                    template : 'success',
                    autoDismiss : true
                });
                $scope.sent = true;
                $scope.sending = false;
            })
            .catch((err)=>{
                ApplicationService.pushNotification({
                    title: 'Failed to send feedback',
                    text : "Unable to send feedback to team whileLOOP",
                    template : 'error',
                    autoDismiss : false
                });
                $scope.sent = false;
                $scope.sending = false;
                console.error(err);
            })
    };

    $scope.resend = function () {
        $scope.sent = false;
        $scope.sending = false;
    }

});