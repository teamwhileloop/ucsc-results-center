app.controller('LoginController',function (
    $scope,
    $rootScope,
    LoadingMaskService,
    ApplicationService,
    $timeout,
    FacebookService,
    ProfileService,
    $location
) {
    this.authStatus = 'loading';

    LoadingMaskService.deactivate();

    FacebookService.parseXFBML();

    FacebookService.getUserDetails().then((data)=>{
        if(data.error){
            this.authStatus = 'unknown';
        }else if(data.name){
            ProfileService.validateUser()
                .then((data)=>{
                    ApplicationService.setLoadingIndicatorStatus('login.statuschecker',`Logging you in as ${data.name}`);
                    $location.path('/sample');
                })
                .catch((error)=>{
                    this.authStatus = 'unknown';
                })
        }else{
            this.authStatus = 'unknown';
        }
    });

    this.userLoggedIn = ()=>{
        FacebookService.reAuthenticate(false).then(() => {
            ProfileService.validateUser()
                .then((data)=>{
                    ApplicationService.setLoadingIndicatorStatus('login.statuschecker',`Logging you in as ${data.name}`);
                    $location.path('/sample');
                })
                .catch((error)=>{
                    this.authStatus = 'unknown';
                    ApplicationService.pushNotification({
                        title: 'Unable to log you in',
                        text : 'For some reasons we could not log you in. Please contact administrator for further assistance.',
                        template : 'error',
                        autoDismiss : false
                    })
                })
        });
    }
});