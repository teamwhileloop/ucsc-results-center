let applicationID = window.location.host === 'localhost:3000' ? '1917234511877082' : '324582471336592';
window.fbAsyncInit = function() {
    FB.init({
        appId      : applicationID,
        cookie     : true,
        xfbml      : false,
        version    : 'v2.8'
    });
};
// Load the SDK asynchronously
(function(d, s, id) {
    let js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));


let app = angular.module('ucscResultsCenter', [
    'ngRoute',
    'ngStorage',
    'ngMaterial']
);
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
app.service('ApplicationService',function ($rootScope) {
    return {
        openSidebar: function () {
            $rootScope.$broadcast('sidebar.open');
        },
        closeSideBar: function () {
            $rootScope.$broadcast('sidebar.close');
        },
        displayPageHeader: function () {
            $rootScope.$broadcast('pageHeader.show');
        },
        hidePageHeader: function () {
            $rootScope.$broadcast('pageHeader.hide');
        },
        hideNavigationIndicator: function () {
            $rootScope.$broadcast('navigationIndicator.hide');
        },
        showNavigationIndicator: function (infoBoxData = {}) {
            $rootScope.$broadcast('navigationIndicator.show',infoBoxData);
        },
        pushNotification: function (notificationData = {}) {
            $rootScope.$broadcast('push-notification',notificationData);
        },
        setLoadingIndicatorStatus: function (loaderId,options = {}) {
            $rootScope.$broadcast(`loadingIndicator.${this.loaderId}`,options);
        }
    };
});
app.service('FacebookService',function ($rootScope,$q,$localStorage,$location,$timeout,$interval) {
    let serviceReady = undefined;

    function getAccessTokenFromLocalStroage() {
        if ($localStorage.facebookAuth && $localStorage.facebookAuth.authResponse && $localStorage.facebookAuth.authResponse !== null){
            return $localStorage.facebookAuth.authResponse.accessToken || ''
        }
        return ''
    }

    return{
        parseXFBML: function () {
            FB.XFBML.parse();
        },
        getLoginStatus: function () {
            return $q((resolve, _reject) => {
                FB.getLoginStatus(function(response) {
                    resolve(response);
                });
            })
        },
        getUserDetails: function () {
            return $q((resolve, _reject) => {
                FB.api('/me', {
                    fields: 'email,first_name,last_name,gender,link,short_name,picture{url},cover,name',
                    access_token : getAccessTokenFromLocalStroage()
                }, (response)=> {
                    if (!response.error){
                        resolve(response);
                    }else{
                        this.reAuthenticate(true).then((success)=>{
                            if (success){
                                this.getUserDetails().then((data)=>{
                                    resolve(data);
                                });
                            }else{
                                resolve(response);
                            }
                        });
                    }
                });

            })
        },
        reAuthenticate : function (forceLogin = false) {
            console.warn('Reauthenticating', forceLogin ? 'with force flag' : '');
            return $q((resolve, _reject) => {
                FB.getLoginStatus(function(response) {
                    if((response.status !== 'connected' || forceLogin) && response.status !== 'unknown'){
                        FB.login(function(response) {
                            if (response.authResponse) {
                                $localStorage.facebookAuth = response;
                                serviceReady = true;
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        });
                    }else {
                        if (response.status !== 'unknown'){
                            $localStorage.facebookAuth = response;
                            serviceReady = true;
                            resolve(true);
                        }else{
                            resolve(false);
                        }
                    }
                });
            })
        },
        initializeService : function () {
            return $q((resolve,_reject)=>{
                if ($localStorage.facebookAuth){
                    console.log('lc');
                    FB.api('/me', {
                        fields: 'email,first_name,last_name,gender,link,short_name,picture{url},cover,name',
                        access_token : getAccessTokenFromLocalStroage()
                    }, (response)=> {
                        serviceReady = !response.error;
                        resolve(true);
                    });
                }else{
                    console.log('no lc');
                    FB.getLoginStatus((response)=>{
                        if (response.status === 'connected'){
                            $localStorage.facebookAuth = response;
                            serviceReady = true;
                        }else{
                            serviceReady = false;
                        }
                        resolve(true);
                    });
                }
            })
        },
        serviceReady : serviceReady
    }
});
app.component('loadingIndicator', {
    templateUrl: 'public/html/components/view.html',
    bindings: {
        loaderId: '@',
        loaderText: '<',
        diameter : '@'
    },
    controller: function LoadingIndicatorController($scope){
        $scope.$on(`loadingIndicator.${this.loaderId}`, (_event, args)=> {
            this.loaderText = args;
        });
    },
    controllerAs : 'loadingIndicatorCtrl'
});
app.controller('LoadingMaskController',function ($scope) {

    this.isActivated = true;
    $scope.$on('loading-mask.activate', (_event, _args) => {
        this.isActivated = true;
    });

    $scope.$on('loading-mask.deactivate', (_event, _args)=> {
        this.isActivated = false;
    });

});
app.service('LoadingMaskService',function ($rootScope) {
    return {
        activate: function () {
            $rootScope.$broadcast('loading-mask.activate')
        },
        deactivate: function () {
            $rootScope.$broadcast('loading-mask.deactivate')
        }
    };
});
function displayFacebookSupport(visibility) {
    var indicator = document.getElementById("facebookSupportBox");
    var chatBox = document.getElementById("supportIndicator");
    if (visibility) {
        indicator.style.visibility = "hidden";
        chatBox.style.visibility = "visible";
    } else {
        indicator.style.visibility = "visible";
        chatBox.style.visibility = "hidden";
    }
}
app.controller('LoginController',function ($scope,$rootScope,LoadingMaskService,ApplicationService,$timeout,FacebookService) {
    this.authStatus = 'loading';

    $timeout(function () {
        LoadingMaskService.deactivate();
    }, 10);

    FacebookService.parseXFBML();

    FacebookService.getUserDetails().then((data)=>{
        console.log(data);
    });

    this.ss = ()=>{
        FacebookService.getLoginStatus().then((response) => {
            console.log(response);
        });
    }
});
app.controller('NotificationSystemController',function ($scope,$timeout,$interval) {

    this.pushNotification = function (notification = {}) {
        notification = Object.assign({
            title: Math.random().toString(36).substr(2, 8),
            text : Math.random().toString(36).substr(2, 8),
            id : 'notification_' + Math.random().toString(36).substr(2, 6),
            template : 'info',
            autoDismiss : true,
            autoDismissDelay : 5000
        },notification);
        options = {};
        switch (notification.template){
            case 'info':
                options = {
                    background : '#5E31A7',
                    icon : 'fa-bell',
                    iconColor : '#fff'
                }
                break;
            case 'success':
                options = {
                    background : '#3AA757',
                    icon : 'fa-check-circle',
                    iconColor : '#fff'
                }
                break;
            case 'warn':
                options = {
                    background : '#ffd700',
                    icon : 'fa-exclamation-triangle',
                    iconColor : '#000',
                    autoDismiss: false
                }
                break;
            case 'error':
                options = {
                    background : '#bf263c',
                    icon : 'fa-times-circle',
                    iconColor : '#fff',
                    autoDismiss: false
                }
                break;
        };
        notification = Object.assign(notification,options);
        let newNotification = `<li class='notification-item-li notification-joiner' id='${notification.id}'>
          <div class='notification-box'>
            <div class='notification-box-panel-a'
                 style='background-color: ${notification.background}; color: ${notification.iconColor}'>
              <i class="fa ${notification.icon} aria-hidden="true"></i>
            </div>
            <div class='notification-box-panel-b'>
              <div class='notification-box-header'>
                ${notification.title}
                <i class="fa fa-times notification-close" aria-hidden="true" onclick="dissmissNotification('${notification.id}')"></i>
              </div>
              <div class='notification-box-body'>
                ${notification.text}
              </div>
            </div>
          </div>
        </li>`;
        document.getElementById('notificationSystem').innerHTML += newNotification;

        $timeout(() => {
            document.getElementById(notification.id).classList.remove('notification-joiner');
        }, 800);

        if (notification.autoDismiss){
            $timeout(() => {
                try {
                    this.dissmissNotification(notification.id);
                }catch (e){}
            }, notification.autoDismissDelay);
        }

    }

    $scope.$on('push-notification', (_event, args)=> {
        this.pushNotification(args);
    });

    this.dissmissNotification = function (id){
        var notification = document.getElementById(id);
        notification.className += " dissmisser";
        setTimeout(function(){
            notification.outerHTML = '';
        }, 1000);
    }

});

function dissmissNotification(id){
    var notification = document.getElementById(id);
    notification.className += " dissmisser";
    setTimeout(function(){
        notification.outerHTML = '';
    }, 1000);

}
app.controller('PageHeaderController',function ($scope, $timeout, $mdSidenav) {

    $scope.pageHeaderVisibility = false;
    $scope.navigationIndicatorVisibility = false;
    $scope.navigationInfoBox = {};

    $scope.toggleSideBar = function() {
        $mdSidenav("sidebar")
            .toggle()
            .then(function() {});
    };

    $scope.closeSideBar = function () {
        $mdSidenav('sidebar').close();
    };

    $scope.$on('sidebar.open', (_event, _args)=> {
        $mdSidenav('sidebar').open();
    });

    $scope.$on('sidebar.close', (_event, _args)=> {
        $mdSidenav('sidebar').close();
    });

    $scope.$on('pageHeader.hide', (_event, _args)=> {
        $scope.pageHeaderVisibility = false;
    });

    $scope.$on('pageHeader.show', (_event, _args)=> {
        $scope.pageHeaderVisibility = true;
    });

    $scope.$on('navigationIndicator.show', (_event, args)=> {
        $scope.navigationInfoBox = Object.assign({
            icon: 'swap_horiz',
            enabled: false,
            text: 'Loading content'
        },args);
        $scope.navigationIndicatorVisibility = true;
    });

    $scope.$on('navigationIndicator.hide', (_event, _args)=> {
        $scope.navigationIndicatorVisibility = false;
    });
});