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
) {
    console.log('Profile controller loaded');
    LoadingMaskService.deactivate();
    ApplicationService.displayPageHeader();
    ApplicationService.updatePageHeader(loggedInUser);

    let indexNumber = $routeParams.indexNumber;

    //Default values
    $scope.loadingData = true;
    $scope.indexNumber = indexNumber;
    $scope.myIndexNumber = loggedInUser.indexNumber;
    $scope.loaderText = 'Loading profile data from servers';
    $scope.gpa = 'NA';
    $scope.rank = 'NA';
    $scope.lastUpdate = 'NA';
    $scope.rankList = [];
    $scope.gpa_diff = 'NA';
    $scope.rank_diff = 'NA';
    $scope.total_credits = 'NA';

    ProfileService.getProfileResults(indexNumber)
    .then((data)=>{
        ApplicationService.hideNavigationIndicator();
        if (data.status === 200){
            if (data.status === 'not-found'){
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

                $scope.total_credits = data.data.summary.credits;
            }
            $scope.loadingData = false;
        }
    });

    $scope.goToProfile = function (indexNumber) {
        if (indexNumber){
            $location.path(`/profile/${indexNumber}`)
        }
    }

});