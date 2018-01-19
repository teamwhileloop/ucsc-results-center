app.config(function($routeProvider) {
    function initializer(FacebookService,ProfileService,$location) {
        return new Promise(function (resolve, reject) {
            FacebookService.initializeService().then(()=>{
                if(!FacebookService.serviceReady()){
                    console.warn('Facebook Service not ready. Re-Authenticating');
                    FacebookService.reAuthenticate(false)
                    .then((response)=>{
                        if (response){
                            initializer(FacebookService,ProfileService,$location)
                            .then((response)=>{
                                resolve(response);
                            })
                            .catch((error)=>{
                                reject(error);
                            });
                        }else{
                            reject(false);
                        }
                    });
                }else{
                    ProfileService.validateUser()
                        .then((response)=>{
                            resolve(response);
                        })
                        .catch((error)=>{
                            console.error(error);
                            reject(error);
                        });
                }
            });
        });
    }

    function applicationInitializerRoot(FacebookService,$location,ProfileService,ApplicationService) {
        if (FacebookService.isServiceInitialized()) {
            return new Promise(function (resolve, reject) {
                ProfileService.validateUser()
                    .then((response) => {
                        resolve(response.data);
                    })
                    .catch((error) => {
                        console.error(error);
                        $location.path('/error');
                    });
            });
        }
        return new Promise(function (resolve, reject) {
            initializer(
                FacebookService,
                ProfileService,
                $location
            ).then((data) => {
                if (data.status === 200) {
                    resolve(data.data);
                } else {
                    console.error(data);
                    $location.path('/error');
                }
            })
                .catch((error) => {
                    console.error(error);
                    $location.path('/error');
                });
        });
    }

    $routeProvider
        .when("/",{
            controller:'LoginController',
            templateUrl:'public/html/modules/login/view.html',
            controllerAs : 'ctrlLogin',
            resolve : {
                init : function (FacebookService) {
                    return FacebookService.initializeService();
                }
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
                loggedInUser : applicationInitializerRoot
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
                loggedInUser : applicationInitializerRoot
            }
        })
        .when("/profile/:indexNumber",{
            controller: 'ProfilePageController',
            templateUrl:'public/html/modules/profile-page/view.html',
            resolve : {
                navText : function (ApplicationService, $routeParams) {
                    ApplicationService.showNavigationIndicator({
                        icon: 'swap_horiz',
                        enabled: true,
                        text: `Navigating to profile ${$routeParams.indexNumber || 'page'}`
                    });
                },
                loggedInUser : applicationInitializerRoot
            }
        })
        .when("/sample",{
            controller: 'SampleController',
            templateUrl:'public/html/modules/sample/view.html',
            resolve : {
                init : function (FacebookService,$location,ProfileService) {
                    if (FacebookService.isServiceInitialized()){
                        return true;
                    }
                    return new Promise(function (resolve, reject) {
                        initializer(
                            FacebookService,
                            ProfileService,
                            $location
                        ).then((data)=>{
                            resolve(data);
                        });
                    });
                }
            }
        })
        .when("/error",{
            template:'<p>Error occured</p>'
        })
});