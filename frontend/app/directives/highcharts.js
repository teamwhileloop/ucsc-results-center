app.directive('highchart', function () {
    return {
        restrict: 'E',
        template: '<div></div>',
        replace: true,
        scope: {
            hcOptions: '='
        },
        link: function (scope, element) {
            Highcharts.chart(element[0], scope.hcOptions);
        }
    };
});