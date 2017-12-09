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
            controller: function (LoadingMaskService) {
              console.log('sddddddd');
              LoadingMaskService.deactivate();
            },
            templateUrl:'public/html/components/view.html',
            resolve : {
                init : function (FacebookService,$location) {
                    if(!FacebookService.serviceReady){
                        $location.path('/');
                    }else{
                        FacebookService.getUserDetails().then((data)=>{
                            console.log(data);
                        });
                    }
                }
            }
        })
});