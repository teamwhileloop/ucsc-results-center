app.component('actionText', {
    templateUrl: 'public/html/components/action-text/view.html',
    bindings: {
        actionTextData: '=',
        action: '&'
    },
    controller: function ActionTextController($scope){
        $scope.onClick = function () {
            this.$ctrl.action();
        }
    }
});