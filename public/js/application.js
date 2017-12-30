applicationIdJSON = {
  'localhost:3000':'1917234511877082',  // Dev Testing
  'ucscresults.herokuapp.com':'324582471336592',  // Production
  '13.250.2.9':'139123596786957',  // Staging
};

let applicationID = applicationIdJSON[window.location.host];

FB.init({
    appId      : applicationID,
    cookie     : true,
    xfbml      : false,
    version    : 'v2.8'
});

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
                loggedInUser : function (FacebookService,$location,ProfileService) {
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
app.service('ApplicationService',function ($rootScope) {
    return {
        openSidebar: function () {
            $rootScope.$broadcast('sidebar.open');
        },
        closeSideBar: function () {
            $rootScope.$broadcast('sidebar.close');
        },
        displayPageHeader: function (options = {}) {
            $rootScope.$broadcast('pageHeader.show',options);
        },
        updatePageHeader: function (options = {}) {
            $rootScope.$broadcast('pageHeader.user.update',options);
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
    let serviceInitialized = false;

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
            console.warn('Reauthorizing', forceLogin ? 'with force flag' : '');
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
            console.log('Initializing Facebook Service');
            return $q((resolve,_reject)=>{
                if ($localStorage.facebookAuth){
                    console.log('Using previous login data');
                    FB.api('/me', {
                        fields: 'email,first_name,last_name,gender,link,short_name,picture{url},cover,name',
                        access_token : getAccessTokenFromLocalStroage()
                    }, (response)=> {
                        serviceReady = !response.error;
                        resolve(true);
                        serviceInitialized = true;
                    });
                }else{
                    console.log('No previous login data found');
                    FB.getLoginStatus((response)=>{
                        if (response.status === 'connected'){
                            $localStorage.facebookAuth = response;
                            serviceReady = true;
                        }else{
                            serviceReady = false;
                        }
                        serviceInitialized = true;
                        resolve(true);
                    });
                }
            })
        },
        getHttpRequestHeaders: function () {
            if (this.serviceReady){
                return {
                    fbUid: $localStorage.facebookAuth.authResponse.userID,
                    fbToken: $localStorage.facebookAuth.authResponse.accessToken,
                }
            }else{
                return {
                    fbUid: '',
                    fbToken: ''
                }
            }
        },
        serviceReady : function () {
            return serviceReady;
        },
        isServiceInitialized : function () {
            return serviceInitialized;
        }
    }
});
app.service('ProfileService',function ($rootScope,FacebookService,$http) {
    return {
        validateUser: function () {
            return $http.get('/user/validate',{
                headers: FacebookService.getHttpRequestHeaders()
            })
        },
        getUserState: function (indexNumber = 0) {
            return $http.get(`/user/state/${indexNumber}`,{
                headers: FacebookService.getHttpRequestHeaders()
            })
        },
        submitClaimRequest: function (data = {}) {
            return $http.post('/user/request',data,{
                headers: FacebookService.getHttpRequestHeaders()
            })
        }
    };
});
app.component('loadingIndicator', {
    templateUrl: 'public/html/components/loading-indicator/view.html',
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
app.controller('LoginController',function (
    $scope,
    $rootScope,
    LoadingMaskService,
    ApplicationService,
    $timeout,
    FacebookService,
    ProfileService,
    $location
) {
    console.log('Login controller loaded');
    this.authStatus = 'loading';

    LoadingMaskService.deactivate();

    FacebookService.parseXFBML();

    FacebookService.getUserDetails().then((data)=>{
        if(data.error){
            this.authStatus = 'unknown';
        }else if(data.name){
            ProfileService.validateUser()
                .then((data)=>{
                    this.redirectUpOnLogin(data.data);
                })
                .catch((error)=>{
                    this.authStatus = 'unknown';
                })
        }else{
            this.authStatus = 'unknown';
        }
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
        });
    };

    this.redirectUpOnLogin = (data)=>{
        ApplicationService.setLoadingIndicatorStatus('login.statuschecker',`Logging you in as ${data.name}`);
        switch (data.state){
            case 'verified':
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

    }
});
app.controller('PageHeaderController',function ($scope, $timeout, $mdSidenav) {

    $scope.pageHeaderVisibility = false;
    $scope.navigationIndicatorVisibility = false;
    $scope.navigationInfoBox = {};
    $scope.mainSearchEnabled = false;
    $scope.userDetails = false;

    $scope.toggleSideBar = function() {
        $mdSidenav("sidebar")
            .toggle()
            .then(function() {});
    };

    $scope.getRankName = function (power = 0) {
        if (power === 0){
            return 'Guest User';
        }if (power === 10){
            return 'Verified Member';
        }if (power === 100){
            return 'System Administrator';
        }
    };

    $scope.closeSideBar = function () {
        $mdSidenav('sidebar').close();
    };

    $scope.$on('sidebar.open', (_event, _args)=> {
        $mdSidenav('sidebar').open();
    });

    $scope.$on('pageHeader.user.update', (_event, args)=> {
        $scope.userDetails = args;
    });

    $scope.$on('sidebar.close', (_event, _args)=> {
        $mdSidenav('sidebar').close();
    });

    $scope.$on('pageHeader.hide', (_event, _args)=> {
        $scope.pageHeaderVisibility = false;
    });

    $scope.$on('pageHeader.show', (_event, args)=> {
        $scope.pageHeaderVisibility = true;
        $scope.mainSearchEnabled = !!args['search'];
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
app.controller('RegistrationController',function (
    $scope,
    $rootScope,
    LoadingMaskService,
    ApplicationService,
    loggedInUser,
    FacebookService,
    ProfileService,
    $location
) {
    console.log('Reg ctrl loaded');
    console.log(loggedInUser);

    $scope.indexNumberStatus = 'unknown'; // unknown,conflict,checking,available,not-found
    $scope.loggedInUser = loggedInUser;
    $scope.invalidUserEmail = false;
    $scope.useAlternateEmail = false;

    this.preferedEmail = '';
    this.requestedIndexNumber = '';

    ApplicationService.displayPageHeader();
    ApplicationService.updatePageHeader(loggedInUser);
    LoadingMaskService.deactivate();

    switch (loggedInUser.state){
        case 'verified':
            break;
        case 'guest':
            $scope.step = 0;
            break;
        case 'pending':
            $scope.step = 4;
            break;
        case 'blocked':
            $scope.step = 5;
            break;
        default:
            console.error('Unknown user state');
            $location.path('/error');
            break;
    }
    $scope.goBack = function(){
        $scope.step -= 1;
    };

    $scope.goToStep = function(step){
        $scope.step = step;
    };

    this.ranker = (number) => {
        switch (number){
            case 1:
                return number + "st";
            case 2:
                return number + "nd";
            case 3:
                return number + "rd";
            default:
                return number + "th";
        }
    };

    this.getBatchLabel = function (indexNumber = 0) {
        if (!!$scope.loggedInUser.indexNumber){
            return `${this.ranker(parseInt($scope.loggedInUser.indexNumber.toString().substring(0,2)) - 2)} Batch`;
        }else{
            return 'Unknown';
        }
    };

    this.checkIndexNumberValidity = function (indexNumber = 0) {
        this.requestedIndexNumber = indexNumber;
        if (/^[0-9]{2}0[02]{1}[0-9]{4}$/.test(indexNumber)){
            $scope.indexNumberStatus = 'checking';
            ProfileService.getUserState(indexNumber)
            .then((response)=>{
                if (response.status === 200){
                    $scope.indexNumberStatus = response.data.state;
                }else if(response.status === 401){
                    FacebookService.reAuthenticate()
                    .then((data)=>{
                        if (data){
                            this.checkIndexNumberValidity(indexNumber);
                        }
                    });
                }
            });
        }else{
            $scope.indexNumberStatus = 'unknown';
        }
    };

    this.checkEmailValidity = function (emailAddress = '') {
        if (emailAddress !== ''){
            $scope.useAlternateEmail = true;
            $scope.invalidUserEmail = !/^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/.test(emailAddress);
            if (!$scope.invalidUserEmail){
                this.preferedEmail = emailAddress;
            }else{
                this.preferedEmail = '';
            }

        }else{
            $scope.useAlternateEmail = false;
            this.preferedEmail = '';
        }
    };

    this.submit = function () {
        let request = {};
        $scope.useAlternateEmail ? request['email'] = this.preferedEmail : null;
        request['indexNumber'] = this.requestedIndexNumber;
        ProfileService.submitClaimRequest(request)
        .then((_response)=>{
            $scope.step = 4;
            $scope.loggedInUser.state = 'pending';
            $scope.loggedInUser.indexNumber = request['indexNumber'];
            $scope.loggedInUser.alternate_email = request['email'];
        })
        .catch((error)=>{
            ApplicationService.pushNotification({
                title: 'Unable submit claim request',
                text : 'For some reasons we could not submit your request. Please contact administrator for further assistance.',
                template : 'error',
                autoDismiss : false
            });
        });
    }

});
app.controller('SampleController',function ($scope,$rootScope,LoadingMaskService,ProfileService,$timeout,FacebookService) {
    LoadingMaskService.deactivate();
    console.log('Sample Controller loaded');
    $scope.test = ()=>{
        console.log('sdsdsd');
        ProfileService.validateUser()
            .then((data)=>{
                console.log(data);
            })
            .catch((error)=>{
                console.log(error);
            });
    }
});