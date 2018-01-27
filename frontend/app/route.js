app.config(function($routeProvider) {

    function applicationAuthenticator(FacebookService, ProfileService, $location) {
        return new Promise((resolve, reject)=>{
            if (FacebookService.isServiceInitialized()){
                if (!FacebookService.serviceReady()){
                    console.warn('Facebook Service not ready. Re-Authenticating');
                    FacebookService.reAuthenticate()
                        .then(()=>{
                            ProfileService.validateUser()
                            .then((validationResponse)=>{
                                resolve(validationResponse.data);
                            })
                            .catch(()=>{
                                reject(false);
                                $location.path('/');
                            })
                        })
                        .catch(()=>{
                            reject(false);
                            $location.path('/');
                        })
                }else{
                    ProfileService.validateUser()
                    .then((validationResponse)=>{
                        resolve(validationResponse.data);
                    })
                    .catch(()=>{
                        reject(false);
                        $location.path('/');
                    })
                }
            }else{
                FacebookService.initializeService()
                .then(()=>{
                    if (!FacebookService.serviceReady()){
                        console.warn('Facebook Service not ready. Re-Authenticating');
                        FacebookService.reAuthenticate()
                        .then(()=>{
                            ProfileService.validateUser()
                            .then((validationResponse)=>{
                                resolve(validationResponse.data);
                            })
                            .catch(()=>{
                                reject(false);
                                $location.path('/');
                            })
                        })
                        .catch(()=>{
                            reject(false);
                            $location.path('/');
                        })
                    }else{
                        ProfileService.validateUser()
                        .then((validationResponse)=>{
                            resolve(validationResponse.data);
                        })
                        .catch(()=>{
                            reject(false);
                            $location.path('/');
                        })
                    }
                })
                .catch(()=>{
                    console.warn('FacebookService Ready-up failed!');
                    reject(false);
                    $location.path('/');
                })
            }
        });
    }

    $routeProvider
        .when("/",{
            controller:'LoginController',
            templateUrl:'public/html/modules/login/view.html',
            controllerAs : 'ctrlLogin',
            resolve : {
                automaticLogin: ()=> {return true; }
            }
        })
        .when("/login",{
            controller:'LoginController',
            templateUrl:'public/html/modules/login/view.html',
            controllerAs : 'ctrlLogin',
            resolve : {
                automaticLogin: ()=>{ return false; }
            }
        })
        .when("/registration",{
            controller:'RegistrationController',
            templateUrl:'public/html/modules/registration/view.html',
            controllerAs : 'ctrlReg',
            resolve : {
                navText : function (ApplicationService) {
                    ApplicationService.showNavigationIndicator({
                        icon: 'swap_horiz',
                        enabled: true,
                        text: 'Redirecting to Registration page'
                    });
                },
                loggedInUser : applicationAuthenticator
            }
        })
        .when("/virtual-console",{
            controller:'VirtualConsoleController',
            templateUrl:'public/html/modules/virtual-console/view.html',
            controllerAs : 'ctrlVirtCons',
            resolve : {
                navText : function (ApplicationService) {
                    ApplicationService.showNavigationIndicator({
                        icon: 'swap_horiz',
                        enabled: true,
                        text: 'Redirecting to Virtual Console'
                    });
                },
                loggedInUser : applicationAuthenticator
            }
        })
        .when("/profile/:indexNumber",{
            controller: 'ProfilePageController',
            templateUrl:'public/html/modules/profile-page/view.html',
            resolve : {
                navText : function (ApplicationService, $routeParams, $location) {
                    ApplicationService.showNavigationIndicator({
                        icon: 'swap_horiz',
                        enabled: true,
                        text: `Navigating to profile ${$location.$$path.split('/')[2] || 'page'}`
                    });
                },
                loggedInUser : applicationAuthenticator
            }
        })
        .when("/error",{
            template:'<p>Error occured</p>'
        })
});