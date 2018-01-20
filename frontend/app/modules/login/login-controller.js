app.controller('LoginController',function (
    $scope,
    $rootScope,
    LoadingMaskService,
    ApplicationService,
    $timeout,
    FacebookService,
    ProfileService,
    automaticLogin,
    $location
) {
    console.log('Login controller loaded');
    this.authStatus = 'loading';
    ApplicationService.hideNavigationIndicator();
    ApplicationService.hidePageHeader();

    LoadingMaskService.deactivate();

    FacebookService.parseXFBML();

    if (automaticLogin){
        FacebookService.getLoginStatus()
        .then((data)=>{
            if (data.status === 'connected'){
                ProfileService.validateUser()
                    .then((data)=>{
                        this.redirectUpOnLogin(data.data);
                    })
                    .catch((error)=>{
                        this.authStatus = 'unknown';
                        ApplicationService.hideNavigationIndicator();
                    })
            }else{
                this.authStatus = 'unknown';
                ApplicationService.hideNavigationIndicator();
            }
        })
        .catch((error)=>{
            this.authStatus = 'unknown';
            console.error(error);
        });
    }else{
        this.authStatus = 'unknown';
    }

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
        })
        .catch((error)=>{
            console.error(error);
        });
    };

    this.redirectUpOnLogin = (data)=>{
        ApplicationService.setLoadingIndicatorStatus('login.statuschecker',`Logging you in as ${data.name}`);
        switch (data.state){
            case 'verified':
                $location.path(`/profile/${data.indexNumber}`);
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

    };
});