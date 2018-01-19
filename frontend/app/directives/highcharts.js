app.directive('highchart', function () {
    return {
        restrict: 'E',
        template: '<div></div>',
        replace: true,
        scope: {
            hcOptions: '='
        },
        link: function (scope, element) {
            Highcharts.chart(element[0], {
                title: null,
                chart: {
                    type: 'areaspline'
                },
                legend: {
                    enabled: false
                },
                xAxis: {
                    categories: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.0, 4.1, 4.2, 4.25]
                },
                credits: {
                    enabled: false
                },
                plotOptions: {
                    series: {
                        marker: {
                            enabled: false
                        },
                        fillOpacity: 0.35
                    }
                },

                series: [{
                    data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4, 29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4],
                    color: '#ffd700'
                }]
            });
        }
    };
});