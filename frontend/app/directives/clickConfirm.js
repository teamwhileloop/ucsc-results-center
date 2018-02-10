app.directive('clickConfirm', function($mdDialog) {
    return {
        restrict: 'A',
        priority: -999,
        scope: {
            clickConfirm: '='
        },
        link : function (scope, element, attrs) {
            angular.element(element).on('click', function (e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                let options = scope.clickConfirm;
                let confirm = $mdDialog.confirm()
                    .title(options.title)
                    .textContent(options.content)
                    .targetEvent(e)
                    .ok(options.confirm)
                    .cancel(options.cancel);
                $mdDialog.show(confirm).then(function() {
                    scope.$parent.$eval(attrs.ngClick);
                }, function() {
                    return 0;
                });
            });
        }
    };
});