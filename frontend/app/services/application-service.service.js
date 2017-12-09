app.service('ApplicationService',function ($rootScope) {
    return {
        openSidebar: function () {
            $rootScope.$broadcast('sidebar.open');
        },
        closeSideBar: function () {
            $rootScope.$broadcast('sidebar.close');
        },
        displayPageHeader: function () {
            $rootScope.$broadcast('pageHeader.show');
        },
        hidePageHeader: function () {
            $rootScope.$broadcast('pageHeader.hide');
        },
        hideNavigationIndicator: function () {
            $rootScope.$broadcast('navigationIndicator.hide');
        },
        showNavigationIndicator: function (infoBoxData = {}) {
            $rootScope.$broadcast('navigationIndicator.show',infoBoxData);
        },
        pushNotification: function (notificationData = {}) {
            $rootScope.$broadcast('push-notification',notificationData);
        },
        setLoadingIndicatorStatus: function (loaderId,options = {}) {
            $rootScope.$broadcast(`loadingIndicator.${this.loaderId}`,options);
        }
    };
});