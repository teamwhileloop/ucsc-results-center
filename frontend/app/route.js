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
                    FacebookService.initializeService().then(()=>{
                        if(!FacebookService.serviceReady()){
                            $location.path('/');
                        }else{
                            ProfileService.validateUser().then((data)=>{
                                console.log(data);
                            })
                        }
                    });
                }
            }
        })
});