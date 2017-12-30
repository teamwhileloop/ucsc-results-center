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
                loggedInUser : function (FacebookService,$location,ProfileService,ApplicationService) {
                    ApplicationService.showNavigationIndicator({
                        icon: 'swap_horiz',
                        enabled: true,
                        text: 'Redirecting tp Registration page'
                    });
                    if (FacebookService.isServiceInitialized()){
                        return new Promise(function (resolve, reject) {
                            ProfileService.validateUser()
                            .then((response)=>{
                                resolve(response.data);
                            })
                            .catch((error)=>{
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
                        ).then((data)=>{
                            if (data.status === 200){
                                resolve(data.data);
                            }else{
                                console.error(data);
                                $location.path('/error');
                            }
                        })
                        .catch((error)=>{
                            console.error(error);
                            $location.path('/error');
                        });
                    });
                }
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