app.config(function($routeProvider) {
    $routeProvider
        .when("/",{
            controller:'LoginController',
            templateUrl:'public/html-ssd/modules/login/view.html',
            controllerAs : 'ctrlLogin'
        })
        .when("/dashboard",{
            controller:'DashBoardController',
            templateUrl:'public/html-ssd/modules/dashboard/view.html',
            // controllerAs : 'ctrlLogin',
        })
});