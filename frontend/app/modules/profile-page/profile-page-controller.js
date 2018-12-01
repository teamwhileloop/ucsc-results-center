app.controller('ProfilePageController',function (
    $scope,
    $rootScope,
    LoadingMaskService,
    ApplicationService,
    loggedInUser,
    FacebookService,
    ProfileService,
    $routeParams,
    $location,
    $localStorage
) {
    if (loggedInUser.state !== 'verified'){
        $location.path('access-denied');
    }else{
        LoadingMaskService.deactivate();
        ApplicationService.hideNavigationIndicator();
        ApplicationService.displayPageHeader({ search: true});
        ApplicationService.updatePageHeader(loggedInUser);
    }

    let indexNumber = $routeParams.indexNumber;

    //Default values
    $scope.loadingData = true;
    $scope.indexNumber = indexNumber;
    $scope.myIndexNumber = loggedInUser.indexNumber;
    $scope.loaderText = 'Loading profile data from servers';
    $scope.gpa = 'NA';
    $scope.rank = 'NA';
    $scope.summary = {};
    $scope.lastUpdate = 'NA';
    $scope.rankList = [];
    $scope.gpa_diff = 'NA';
    $scope.rank_diff = 'NA';
    $scope.total_credits = 'NA';
    $scope.degreeCode = 'NA';
    $scope.resultSets = [];
    $scope.profileOwnerInfo = {};

    if ($localStorage.onlyBest === undefined){
        $localStorage.onlyBest = true;
    }

    $rootScope.onlyBest = $localStorage.onlyBest;

    ProfileService.getAlerts()
    .then((resposne)=>{
        _.forEach(resposne.data, function (o) {
            ApplicationService.pushNotification(o);
        })
    });

    ProfileService.getProfileResults(indexNumber)
    .then((data)=>{
        ApplicationService.hideNavigationIndicator();
        if (data.status === 200){
            if (data.data.status === 'not-found'){
                $scope.visibility = 'not-found';
            }else if(!data.data.summary){
                $scope.visibility = 'private';
            }else if(data.data.summary){
                $scope.visibility = 'visible';
                $scope.indexNumber = indexNumber;
                $scope.gpa = data.data.summary.gpa;
                $scope.rank = data.data.summary.rank;
                $scope.rankList = data.data.rankingData;
                $scope.lastUpdate = data.data.summary.updated_date + ' UTC';

                if (data.data.summary.gpa_diff >= 0){
                    $scope.gpa_diff = data.data.summary.gpa_diff;
                    $scope.gpaDiffIcon = 'arrow_upward';
                }else{
                    $scope.gpa_diff = data.data.summary.gpa_diff * -1;
                    $scope.gpaDiffIcon = 'arrow_downward';
                }

                if (data.data.summary.rank_diff <= 0){
                    $scope.rank_diff = data.data.summary.rank_diff * -1;
                    $scope.rankDiffIcon = 'arrow_upward';
                }else{
                    $scope.rank_diff = data.data.summary.rank_diff;
                    $scope.rankDiffIcon = 'arrow_downward';
                }

                if (data.data.summary.gpa >= 3.5){
                    $scope.degreeCode = 'FC';
                    $scope.classColor = 'degree-fc';
                }else if (data.data.summary.gpa >= 3.25){
                    $scope.degreeCode = 'SU';
                    $scope.classColor = 'degree-su';
                }else if (data.data.summary.gpa >= 3.0){
                    $scope.degreeCode = 'SL';
                    $scope.classColor = 'degree-sl';
                }else if (data.data.summary.gpa >= 2.0){
                    $scope.degreeCode = 'NM';
                    $scope.classColor = 'degree-na';
                }else{
                    $scope.degreeCode = '--';
                    $scope.classColor = 'degree-no';
                }

                let highlightPos = data.data.graphs.batchDistribution.keys.indexOf(data.data.summary.gpa.toFixed(1));
                data.data.graphs.batchDistribution.values[highlightPos] = {
                    marker: {
                        fillColor: '#ff0000',
                        radius: 6,
                        lineWidth: 2,
                        lineColor: "#ff0000"
                    },
                    y:data.data.graphs.batchDistribution.values[highlightPos]
                };

                $scope.batchDistribution = {
                    title: null,
                    chart: {
                        type: 'areaspline'
                    },
                    legend: {
                        enabled: false
                    },
                    xAxis: {
                        categories: data.data.graphs.batchDistribution.keys
                    },
                    credits: {
                        enabled: false
                    },
                    plotOptions: {
                        series: {
                            marker: {
                                enabled: true,
                                radius: 1
                            },
                            fillOpacity: 0.35
                        }
                    },

                    series: [{
                        name: 'Number of Undergraduates',
                        data: data.data.graphs.batchDistribution.values,
                        color: '#ffd700'
                    }]
                };

                $scope.gpaVariation = {
                    chart: {
                        type: 'areaspline'
                    },
                    title: {
                        text: null
                    },
                    subtitle: {
                        text: null
                    },
                    xAxis: {
                        labels: {
                            formatter: function () {
                                return this.value; // clean, unformatted number for year
                            }
                        },
                        categories: ['Y1S1', 'Y1S2','Y2S1', 'Y2S2','Y3S1', 'Y3S2','Y4S1', 'Y4S2']
                    },
                    yAxis: {
                        title: {
                            text: null
                        }
                    },
                    tooltip: {
                        pointFormat: 'Semester GPA <b>{point.y:,.3f}</b>'
                    },
                    plotOptions: {
                        series: {
                            marker: {
                                enabled: false,
                                symbol: 'circle',
                                radius: 2,
                                states: {
                                    hover: {
                                        enabled: true
                                    }
                                }
                            },
                            dataLabels: {
                                enabled: false
                            },
                            enableMouseTracking: true
                        }
                    },
                    legend: {
                        enabled: false
                    },
                    series: [{
                        name: 'Your GPA',
                        data: data.data.graphs.gpaVariation,
                        color: '#4caf50',
                        fillOpacity: 0.35
                    }]
                };

                $scope.gradeDistribution = {
                    chart: {
                        type: 'column'
                    },
                    title: {
                        text: null
                    },
                    xAxis: {
                        categories: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E', 'F']
                    },
                    yAxis: {
                        min: 0,
                        title: {
                            text: null
                        }
                    },
                    tooltip: {
                        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
                        shared: true
                    },
                    plotOptions: {
                        column: {
                            stacking: 'normal',
                            dataLabels: {
                                enabled: true,
                                color: 'white'
                            }
                        }
                    },
                    colors: ['#F1453D', '#3f51b5', '#4caf4f', '#fe9702', '#e91f62',
                        '#2296f2', '#fec009', '#9b28b0'
                    ],
                    series: data.data.graphs.gradeDistribution
                };

                $scope.summary = data.data.summary;
                $scope.resultSets = data.data.results.reverse();
                $scope.profileOwnerInfo = data.data.ownerInfo[0] || {};

                $scope.total_credits = data.data.summary.credits;
            }
            $scope.loadingData = false;
        }
    })
    .catch((error)=>{
        console.error(error);
    });

    $scope.goToProfile = function (indexNumber) {
        if (indexNumber){
            $location.path(`/profile/${indexNumber}`)
        }
    }

});