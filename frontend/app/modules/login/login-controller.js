app.controller('LoginController',function (
    $scope,
    $rootScope,
    LoadingMaskService,
    ApplicationService,
    $timeout,
    FacebookService,
    ProfileService,
    automaticLogin,
    $mdDialog,
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

    socket.on('statistics', function(response){
        $scope.statistics = response;
        $scope.$apply();
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

    this.collectingDataInfo = ()=>{
        $mdDialog.show(
            $mdDialog.alert()
                .parent(angular.element(document.querySelector('#popupContainer')))
                .clickOutsideToClose(true)
                .title('Information we collect from your Facebook account')
                .textContent('Upon your Facebook login to this system we will collect and store your ' +
                    'email address, full name, gender, link provided by Facebook to profile (No longer collected after ' +
                    'August 1, 2018), short name, URL to your picture and to your cover photo, education and your Facebook ID.' +
                    ' You will also be informed about the permission used by this system by Facebook ' +
                    'upon your app use confirmation. Any changes to these data will be updated whenever ' +
                    'you login to this system, and the system will not maintain a history of these changes. ' +
                    'You can contact the team whileLOOP and remove these data from the system which will also' +
                    ' revoke your access to the system. For further information contact team whileLOOP')
                .ok('Got it!')
        );
    }
});