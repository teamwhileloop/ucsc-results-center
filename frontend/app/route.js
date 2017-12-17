app.config(function($routeProvider) {
    $routeProvider
        .when("/",{
            controller:'LoginController',
            templateUrl:'public/html/modules/login/view.html',
            controllerAs : 'ctrlLogin',
            resolve : {
                init : function (LoadingMaskService,FacebookService) {
                    LoadingMaskService.activate();
                    return FacebookService.initializeService();
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
                    console.log('Initializing Facebook Service');
                    return new Promise(function (resolve, reject) {
                        FacebookService.initializeService().then(()=>{
                            if(!FacebookService.serviceReady()){
                                $location.path('/');
                                resolve(true);
                            }else{
                                ProfileService.validateUser()
                                    .then((response)=>{
                                        console.log(response);
                                        switch (response.data.state){
                                            case 'verified':
                                                break;
                                            case 'guest':
                                                break;
                                            case 'pending':
                                                break;
                                            case 'blocked':
                                                break;
                                            default:
                                                break;
                                        }
                                        resolve(true);
                                    })
                                    .catch((error)=>{
                                        console.error(error);
                                        $location.path('/');
                                        resolve(true);
                                    });
                            }
                        });
                    });
                }
            }
        })
});