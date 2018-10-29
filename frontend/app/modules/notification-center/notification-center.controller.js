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

    if (loggedInUser.state !== 'verified' && loggedInUser.power <= 10){
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

    function add(object){
        AdminService.addNotification(object)
        .then((response)=>{
            ApplicationService.pushNotification({
                title: 'Success',
                text : "New notification submitted",
                template : 'success',
                autoDismiss : true
            });
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