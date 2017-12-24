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
    console.log('Login controller loaded');
    this.authStatus = 'loading';

    LoadingMaskService.deactivate();

    FacebookService.parseXFBML();

    FacebookService.getUserDetails().then((data)=>{
        if(data.error){
            this.authStatus = 'unknown';
        }else if(data.name){
            ProfileService.validateUser()
                .then((data)=>{
                    this.redirectUpOnLogin(data.data);
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
                    this.redirectUpOnLogin(data.data);
                })
                .catch((error)=>{
                    this.authStatus = 'unknown';
                    console.error(error);
                    ApplicationService.pushNotification({
                        title: 'Unable to log you in',
                        text : 'For some reasons we could not log you in. Please contact administrator for further assistance. Perform a Hard Refresh and try again.',
                        template : 'error',
                        autoDismiss : false
                    })
                })
        });
    };

    this.redirectUpOnLogin = (data)=>{
        ApplicationService.setLoadingIndicatorStatus('login.statuschecker',`Logging you in as ${data.name}`);
        switch (data.state){
            case 'verified':
                break;
            case 'guest':
                $location.path('/registration');
                break;
            case 'pending':
                $location.path('/registration');
                break;
            case 'blocked':
                $location.path('/registration');
                break;
            default:
                console.error('Unknown user state');
                break;
        }

    }
});