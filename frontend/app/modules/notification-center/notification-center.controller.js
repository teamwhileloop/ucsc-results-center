app.controller('NotificationCenterController',function (
    $scope,
    $rootScope,
    LoadingMaskService,
    AdminService,
    loggedInUser,
    $location,
    $mdDialog,
    ApplicationService)
{
    $scope.isLoading = true;
    $scope.notificationList = [];

    if (loggedInUser.state !== 'verified' || loggedInUser.power <= 10){
        $location.path('access-denied');
    }else{
        LoadingMaskService.deactivate();
        ApplicationService.hideNavigationIndicator();
        ApplicationService.displayPageHeader({ search: true});
        ApplicationService.updatePageHeader(loggedInUser);
    }

    $scope.previewNotification = function(notification){
        ApplicationService.pushNotification(notification);
    };

    $scope.editNotification = function (notification) {
        $mdDialog.show({
            controller: "NotificationTemplateController",
            templateUrl: 'public/html/modules/notification-center/notification.html',
            parent: angular.element(document.body),
            clickOutsideToClose:true,
            notificationData: notification,
            editMode: true,
            responseHandler: update
        });
    };

    function reloadNotificationList() {
        $scope.isLoading = true;
        $scope.notificationList = [];
        AdminService.getNotificationList()
        .then((response)=>{
            $scope.isLoading = false;
            $scope.notificationList = response.data;
        });
    }

    $scope.newNotification = function(){
        $mdDialog.show({
            controller: "NotificationTemplateController",
            templateUrl: 'public/html/modules/notification-center/notification.html',
            parent: angular.element(document.body),
            clickOutsideToClose:true,
            notificationData: {
                autoDismiss: 1,
                autoDismissDelay: 5000,
                showAlways: "0",
                template: "info",
                text: "",
                title: ""
            },
            editMode: false,
            responseHandler: add
        });
    };

    $scope.deleteNotification = function(remoteId){
        let confirm = $mdDialog.confirm()
            .title('Delete Notification?')
            .textContent(`Are you sure that you want to delete this notification?`)
            .ok('Delete')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
            ApplicationService.showNavigationIndicator({
                icon: 'swap_horiz',
                enabled: true,
                text: 'Deleting notification'
            });
            AdminService.deleteNotification(remoteId)
            .then((response)=>{
                ApplicationService.hideNavigationIndicator();
                ApplicationService.pushNotification({
                    title: 'Success',
                    text : "Notification deleted",
                    template : 'success',
                    autoDismiss : true
                });
                reloadNotificationList();
            })
            .catch(()=>{
                ApplicationService.hideNavigationIndicator();
                ApplicationService.pushNotification({
                    title: 'Failed',
                    text : "Failed to delete notification.",
                    template : 'error',
                    autoDismiss : true
                });
            });
        }, function() {
            return 0;
        });
    };

    $scope.reloadAll = function () {
        reloadNotificationList();
    };

    function add(object){
        AdminService.addNotification(object)
        .then((response)=>{
            ApplicationService.pushNotification({
                title: 'Success',
                text : "New notification submitted",
                template : 'success',
                autoDismiss : true
            });
            reloadNotificationList();
        })
        .catch(()=>{
            ApplicationService.pushNotification({
                title: 'Failed',
                text : "New notification submition failed.",
                template : 'error',
                autoDismiss : true
            });
        });
    }

    function update(object){
        alert(object);
    }

    reloadNotificationList()

});