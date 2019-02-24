app.controller('SubjectStatsController',function (
    $mdDialog,
    ProfileService,
    subject,
    pattern,
    $scope)
{
    $scope.subjectdata = undefined;
    $scope.subjectdatanumb = undefined;
    $scope.subject = subject;
    $scope.pageTitle = '';

    ProfileService.getSubjectWiseAnalysis(subject, pattern)
    .then((data)=>{
        data = data.data;
        let overallArray = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        let batchArray = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        $scope.pageTitle = `Subject Analysis of ${subject} for ${data.batch}`;
        for (const object of data.data) {
            switch (object.grade){
                case "A+":
                    batchArray[0] = object.batch_perc;
                    overallArray[0] = object.overall_perc;
                    break;
                case "A":
                    batchArray[1] = object.batch_perc;
                    overallArray[1] = object.overall_perc;
                    break;
                case "A-":
                    batchArray[2] = object.batch_perc;
                    overallArray[2] = object.overall_perc;
                    break;
                case "B+":
                    batchArray[3] = object.batch_perc;
                    overallArray[3] = object.overall_perc;
                    break;
                case "B":
                    batchArray[4] = object.batch_perc;
                    overallArray[4] = object.overall_perc;
                    break;
                case "B-":
                    batchArray[5] = object.batch_perc;
                    overallArray[5] = object.overall_perc;
                    break;
                case "C+":
                    batchArray[6] = object.batch_perc;
                    overallArray[6] = object.overall_perc;
                    break;
                case "C":
                    batchArray[7] = object.batch_perc;
                    overallArray[7] = object.overall_perc;
                    break;
                case "C-":
                    batchArray[8] = object.batch_perc;
                    overallArray[8] = object.overall_perc;
                    break;
                case "D+":
                    batchArray[9] = object.batch_perc;
                    overallArray[9] = object.overall_perc;
                    break;
                case "D":
                    batchArray[10] = object.batch_perc;
                    overallArray[10] = object.overall_perc;
                    break;
                case "D-":
                    batchArray[11] = object.batch_perc;
                    overallArray[11] = object.overall_perc;
                    break;
                case "E":
                    batchArray[12] = object.batch_perc;
                    overallArray[12] = object.overall_perc;
                    break;
                default:
                    batchArray[13] = object.batch_perc;
                    overallArray[13] = object.overall_perc;
            }
        }
        $scope.subjectdata = {
                chart: {
                    type: 'column'
                },
                title: {
                    text: ''
                },
                xAxis: {
                    categories: [
                        'A+',
                        'A',
                        'A-',
                        'B+',
                        'B',
                        'B-',
                        'C+',
                        'C',
                        'C-',
                        'D+',
                        'D',
                        'D-',
                        'E',
                        'MC'
                    ],
                    crosshair: true
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Percentage'
                    }
                },
                tooltip: {
                    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:0"><b>{point.y:.1f}%</b></td></tr>',
                    footerFormat: '</table>',
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0
                    }
                },
                credits: {
                    enabled: false
                },
                series: [{
                    name: `${data.batch}`,
                    color: 'rgba(126,86,134,.9)',
                    data: batchArray

                }, {
                    name: 'Average',
                    color: 'rgba(248,161,63,1)',
                    data: overallArray

                }]
            };
    });

    ProfileService.getSubjectWiseAnalysisBatchNumber(subject, pattern)
        .then((response)=>{
            $scope.subjectdatanumb = {
                title: {
                    text: ""
                },
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    type: "pie",
                    inverted: false
                },
                tooltip: {
                    pointFormat: "Percentage: <b>{point.percentage:.1f}%</b>"
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: "pointer",
                        dataLabels: {
                            enabled: true,
                            format: "<b>{point.name}</b>: {point.y}",
                            style: {
                                color: "black"
                            }
                        }
                    },
                    series: {
                        animation: false,
                        dataLabels: {}
                    }
                },
                series: [{
                    data: response.data

                }],
                yAxis: {
                    categories: [
                        'A+',
                        'A',
                        'A-',
                        'B+',
                        'B',
                        'B-',
                        'C+',
                        'C',
                        'C-',
                        'D+',
                        'D',
                        'D-',
                        'E',
                        'MC'
                    ]
                },
                xAxis: {
                    title: {},
                    labels: {}
                },
                credits: {
                    enabled: false
                }
            }
        });

    $scope.cancel = function() {
        $mdDialog.cancel();
    };

});