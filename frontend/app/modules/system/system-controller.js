app.controller('SystemController',function (
    $scope,
    $rootScope,
    LoadingMaskService,
    ApplicationService,
    loggedInUser,
    $mdDialog,
    AdminService
) {
    $scope.isLoading = true;
    $scope.notificationList = [];
    lastDatasetFunction = null;
    $scope.tabRec = {
        running: false,
        pattern: '',
        subjectList: [],
        selectedSubject: undefined,
        dataSets: []
    };

    if (loggedInUser.power !== 100){
        $location.path('access-denied');
    }else{
        $scope.loggedInUser = loggedInUser;
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

    $scope.recalibrate = function (pattern) {
        if (!new RegExp('^[0-9]{2}(00|02)$','gm').test(pattern)){
            ApplicationService.pushNotification({
                title: 'Recalibration Failed',
                text : `Recalibration pattern is not valid`,
                template : 'error',
                autoDismiss : false
            });
            return;
        }
        $scope.tabRec.running = true;
        ApplicationService.pushNotification({
            title: 'Recalibration Started',
            text : `Recalibration for pattern ${pattern} started. This may take up to few minutes`,
            template : 'info',
            autoDismiss : false
        });
        AdminService.recalibrate(pattern)
            .then((data)=>{
                console.log(data);
                $scope.tabRec.running = false;
                ApplicationService.pushNotification({
                    title: 'Recalibration Completed',
                    text : `Recalibration for pattern ${pattern} completed after a total time of ${data.data.timeSpent}.`,
                    template : 'success',
                    autoDismiss : false
                });
            })
    };

    $scope.fetchDataSets = function () {
        lastDatasetFunction = $scope.fetchDataSets;
        ApplicationService.showNavigationIndicator({
            icon: 'swap_horiz',
            enabled: true,
            text: `Fetching datasets for ${$scope.tabRec.selectedSubject}`
        });
        AdminService.getDataSets($scope.tabRec.selectedSubject)
            .then((resp)=>{
                $scope.tabRec.dataSets = resp.data;
                ApplicationService.hideNavigationIndicator();
            })
            .catch((err)=>{
                console.error(err);
                ApplicationService.hideNavigationIndicator();
            })
    };

    $scope.fetchLastDataSets = function () {
        lastDatasetFunction = $scope.fetchLastDataSets;
        ApplicationService.showNavigationIndicator({
            icon: 'swap_horiz',
            enabled: true,
            text: `Last 20 Datasets`
        });
        AdminService.getLastDataSets(20)
            .then((resp)=>{
                $scope.tabRec.dataSets = resp.data;
                ApplicationService.hideNavigationIndicator();
            })
            .catch((err)=>{
                console.error(err);
                ApplicationService.hideNavigationIndicator();
            })
    };

    $scope.dateBeautify = function (date) {
        return (new Date(date)).toString()
    };

    $scope.deteleDataSet = function(id, subject){
        $scope.modalActivated = true;
        var confirm = $mdDialog.confirm()
            .title(`Delete Dataset #${id}`)
            .parent()
            .textContent(`Are you sure that you want to delete the dataset #${id} of ${subject}`)
            .ok('Delete Dataset')
            .cancel('Cancel');

        confirm._options.parent =  angular.element(document.getElementById('modalPromptBg'));

        $mdDialog.show(confirm).then(function() {
            AdminService.deleteDataset(id)
                .then((response)=>{
                    console.log(response);
                    if (lastDatasetFunction != null){
                        lastDatasetFunction();
                    }
                    if (response.data.success){
                        ApplicationService.pushNotification({
                            title: 'Dataset Deleted',
                            text : `Dataset #${id} of ${subject} deleted. Following patterns are affected: ${response.data.afftectedPatterns.toString()}`,
                            template : 'success',
                            autoDismiss : false
                        });
                    }else{
                        ApplicationService.pushNotification({
                            title: 'Failed to Delete Dataset',
                            text : "Failed to delete dataset. It maybe already deleted",
                            template : 'error',
                            autoDismiss : false
                        });
                    }
                })
        }, function() {});
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
        alert("Feature not implemented.");
    }

    reloadNotificationList();

    AdminService.getAllSubjects()
        .then((resp)=>{
            $scope.tabRec.subjectList = resp.data;
        })
        .catch((err)=>{
            console.error(err);
        })
});