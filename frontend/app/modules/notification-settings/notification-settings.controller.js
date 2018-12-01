app.controller('NotificationSettingsController',function (
    $scope,
    ApplicationService,
    LoadingMaskService,
    ProfileService,
    loggedInUser)
{
    $scope.isLoading = true;
    $scope.subscriptionInfo = {};
    $scope.eventObject = {};

    if (loggedInUser.state !== 'verified' || loggedInUser.power < 10){
        $location.path('access-denied');
    }else{
        LoadingMaskService.deactivate();
        ApplicationService.hideNavigationIndicator();
        ApplicationService.displayPageHeader({ search: true});
        ApplicationService.updatePageHeader(loggedInUser);
    }

    loadSettings();

    $scope.updateSettings = function () {
        let settings = {};
        settings.my_result_published = $scope.eventObject.my_result_published ? 1 : 0;
        settings.my_gpa_rank_updated = $scope.eventObject.my_gpa_rank_updated ? 1 : 0;
        settings.user_approval_request = $scope.eventObject.user_approval_request ? 1 : 0;
        settings.system_warn_err_thrown = $scope.eventObject.system_warn_err_thrown ? 1 : 0;
        settings.system_new_dataset = $scope.eventObject.system_new_dataset ? 1 : 0;
        settings.system_restart = $scope.eventObject.system_restart ? 1 : 0;

        ApplicationService.showNavigationIndicator({
            icon: 'swap_horiz',
            enabled: true,
            text: 'Updating Setting'
        });

        ProfileService.updateNotificationSettings(settings)
            .then((data)=>{
                ApplicationService.pushNotification({
                    title: 'Settings Saved',
                    text : `Your settings have being saved`,
                    template : 'success',
                    autoDismiss : true
                });
                ApplicationService.hideNavigationIndicator();
                loadSettings();
            })
            .catch((err)=>{
                console.log(err);
            })
    };

    function loadSettings() {
        $scope.isLoading = true;
        ProfileService.getMessengerNotificationStatus()
            .then((data)=>{
                $scope.subscriptionInfo = data.data;
            })
            .catch((err)=>{
                console.error(err);
            });

        ProfileService.getNotificationSettings()
            .then((data)=>{
                $scope.eventObject.my_result_published = data.data.my_result_published === 1;
                $scope.eventObject.my_gpa_rank_updated = data.data.my_gpa_rank_updated === 1;
                $scope.eventObject.user_approval_request = data.data.user_approval_request === 1;
                $scope.eventObject.system_warn_err_thrown = data.data.system_warn_err_thrown === 1;
                $scope.eventObject.system_new_dataset = data.data.system_new_dataset === 1;
                $scope.eventObject.system_restart = data.data.system_restart === 1;
                $scope.isLoading = false;
            })
            .catch((err)=>{
                console.error(err);
            });
    }
});