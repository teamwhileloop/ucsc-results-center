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
    $scope.hostname = window.location.host;
    $scope.notificationList = [];
    lastDatasetFunction = null;
    $scope.tabRec = {
        running: false,
        pattern: '',
        subjectList: [],
        selectedSubject: undefined,
        dataSets: []
    };

    $scope.tabSystem = undefined;

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

    $scope.activateMaintenanceMode = function () {
        ApplicationService.showNavigationIndicator({
            icon: 'swap_horiz',
            enabled: true,
            text: `Updating System Status`
        });
        AdminService.setMaintenanceMode(true, $scope.tabSystem.message, $scope.tabSystem.activationCode)
            .then((resp)=>{
                ApplicationService.pushNotification({
                    title: 'Success',
                    text : "System is now in maintenance mode",
                    template : 'success',
                    autoDismiss : true
                });
                ApplicationService.hideNavigationIndicator();
                reloadSystemStatus();
            })
            .catch(()=>{
                ApplicationService.pushNotification({
                    title: 'Maintenance Mode Failed',
                    text : "Failed to put system into maintenance mode",
                    template : 'error',
                    autoDismiss : true
                });
                ApplicationService.hideNavigationIndicator();
            });
    };

    $scope.dectivateMaintenanceMode = function () {
        ApplicationService.showNavigationIndicator({
            icon: 'swap_horiz',
            enabled: true,
            text: `Updating System Status`
        });
        AdminService.setMaintenanceMode(false, $scope.tabSystem.message, $scope.tabSystem.activationCode)
            .then((resp)=>{
                ApplicationService.pushNotification({
                    title: 'Success',
                    text : "System is now back online",
                    template : 'success',
                    autoDismiss : true
                });
                ApplicationService.hideNavigationIndicator();
                reloadSystemStatus();
            })
            .catch(()=>{
                ApplicationService.pushNotification({
                    title: 'Maintenance Mode Failed',
                    text : "Failed to move system out of maintenance mode",
                    template : 'error',
                    autoDismiss : true
                });
                ApplicationService.hideNavigationIndicator();
            });
    };

    $scope.runCustomBackup = function () {
        var confirm = $mdDialog.prompt()
            .title('Custom Database Backup')
            .textContent('Enter a name for your custom database backup')
            .placeholder('Custom backup name')
            .required(true)
            .ok('Run Backup')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function(name) {
            ApplicationService.pushNotification({
                title: 'Custom Backup Requested',
                text : `Custom Database backup with the name ${name} requested`,
                template : 'info',
                autoDismiss : true
            });
            AdminService.runCustomBackup(name)
                .then((resp)=>{
                    if (resp.data.success){
                        ApplicationService.pushNotification({
                            title: 'Custom Backup Requested',
                            text : `Custom database backup request with the name ${name} completed`,
                            template : 'success',
                            autoDismiss : true
                        });
                    }else{
                        console.error(resp);
                        ApplicationService.pushNotification({
                            title: 'Custom Backup Failed',
                            text : "Failed to perform custom backup.",
                            template : 'error',
                            autoDismiss : true
                        });
                    }
                })
                .catch((err)=>{
                    console.error(err);
                    ApplicationService.pushNotification({
                        title: 'Custom Backup Failed',
                        text : "Failed to perform custom backup. Internal Error",
                        template : 'error',
                        autoDismiss : true
                    });
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
        AdminService.editNotification(object)
            .then((response)=>{
                ApplicationService.pushNotification({
                    title: 'Success',
                    text : "Notification updated",
                    template : 'success',
                    autoDismiss : true
                });
                reloadNotificationList();
            })
            .catch(()=>{
                ApplicationService.pushNotification({
                    title: 'Failed',
                    text : "Failed to update notification",
                    template : 'error',
                    autoDismiss : true
                });
            });
    }

    function reloadSystemStatus(){
        AdminService.getMaintenanceModeStatus()
            .then((response)=>{
                $scope.tabSystem = response.data;
            })
            .catch((err)=>{
                console.error(err);
            });
    }

    reloadNotificationList();
    reloadSystemStatus();

    AdminService.getAllSubjects()
        .then((resp)=>{
            $scope.tabRec.subjectList = resp.data;
        })
        .catch((err)=>{
            console.error(err);
        });


});