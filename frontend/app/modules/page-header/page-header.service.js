app.service('PageHeaderService',function ($rootScope) {
    return {
        openSidebar: function () {
            $rootScope.$broadcast('sidebar.open')
        },
        closeSideBar: function () {
            $rootScope.$broadcast('sidebar.close')
        },
        displayPageHeader: function () {
            $rootScope.$broadcast('pageHeader.show')
        },
        hidePageHeader: function () {
            $rootScope.$broadcast('pageHeader.hide')
        },
        hideNavigationIndicator: function () {
            $rootScope.$broadcast('navigationIndicator.hide')
        },
        showNavigationIndicator: function (infoBoxData = {}) {
            $rootScope.$broadcast('navigationIndicator.show',infoBoxData)
        }
    };
});