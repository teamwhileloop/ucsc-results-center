app.controller('SampleController',function ($scope,$rootScope,LoadingMaskService,ProfileService,$timeout,FacebookService) {
    LoadingMaskService.deactivate();
    console.log('sdsdsddddddd');
    $scope.test = ()=>{
        console.log('sdsdsd');
        ProfileService.validateUser()
            .then((data)=>{
                console.log(data);
            })
            .catch((error)=>{
                console.log(error);
            });
    }
});