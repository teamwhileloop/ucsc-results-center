app.service('LoadingMaskService',function ($rootScope) {
    return {
        activate: function () {
            $rootScope.$broadcast('loading-mask.activate')
        },
        deactivate: function () {
            $rootScope.$broadcast('loading-mask.deactivate')
        }
    };
});