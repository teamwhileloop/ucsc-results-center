app.controller('LoginController',function ($scope,$rootScope,LoadingMaskService,ApplicationService,$timeout,FacebookService) {
    this.authStatus = 'loading';

    $timeout(function () {
        LoadingMaskService.deactivate();
    }, 10);

    FacebookService.parseXFBML();

    FacebookService.getUserDetails().then((data)=>{
        console.log(data);
    });

    this.ss = ()=>{
        FacebookService.getLoginStatus().then((response) => {
            console.log(response);
        });
    }
});