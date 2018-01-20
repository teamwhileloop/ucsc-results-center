app.service('FacebookService',function ($rootScope,$localStorage,$location,$timeout,$interval, $q) {
    let serviceReady = undefined;
    let serviceInitialized = false;

    function getAccessTokenFromLocalStroage() {
        if ($localStorage.facebookAuth && $localStorage.facebookAuth.authResponse && $localStorage.facebookAuth.authResponse !== null){
            return $localStorage.facebookAuth.authResponse.accessToken || ''
        }
        return ''
    }

    function loginAndStoreAccessToken() {
        return new Promise((resolve, reject)=>{
            FB.login(function(response) {
                if (response.authResponse) {
                    $localStorage.facebookAuth = response;
                    serviceReady = true;
                    resolve(true);
                } else {
                    reject(response);
                }
            });
        })
    }

    return{
        parseXFBML: function () {
            FB.XFBML.parse();
        },

        getLoginStatus: function () {
            return new $q((resolve, _reject) => {
                FB.getLoginStatus(function(response) {
                    resolve(response);
                });
            })
        },

        getUserDetails: function (useForceAuthenticationOnFailure = true) {
            return new Promise((resolve, _reject) => {
                FB.api('/me', {
                    fields: 'email,first_name,last_name,gender,link,short_name,picture{url},cover,name',
                    access_token : getAccessTokenFromLocalStroage()
                }, (response)=> {
                    if (!response.error){
                        resolve(response);
                    }else{
                        this.reAuthenticate(useForceAuthenticationOnFailure).then((success)=>{
                            if (success){
                                this.getUserDetails().then((data)=>{
                                    resolve(data);
                                })
                                .catch((error)=>{
                                    console.error(error);
                                });
                            }else{
                                resolve(response);
                            }
                        })
                        .catch((error)=>{
                            console.error(error);
                        });
                    }
                });

            })
        },

        reAuthenticate : function (forceLogin = false) {
            console.warn('Reauthorizing', forceLogin ? 'with force flag' : '');
            return new Promise((resolve, reject) => {
                if (forceLogin){
                    FB.login(function(response) {
                        if (response.authResponse) {
                            $localStorage.facebookAuth = response;
                            serviceReady = true;
                            resolve(true);
                        } else {
                            serviceReady = false;
                            reject(false);
                        }
                    });
                }else{
                    FB.getLoginStatus(function(response) {
                        if (response.status === 'connected'){
                            $localStorage.facebookAuth = response;
                            serviceReady = true;
                            resolve(true);
                        }else{
                            serviceReady = false;
                            reject(false);
                        }
                    });

                }
            })
        },

        initializeService : function () {
            console.log('Initializing Facebook Service');
            return new Promise((resolve, reject)=>{
                if ($localStorage.facebookAuth){
                    console.log('Validating previous login data');
                    FB.api('/me', {
                        fields: 'email,first_name,last_name,gender,link,short_name,picture{url},cover,name',
                        access_token : getAccessTokenFromLocalStroage()
                    }, (response)=> {
                        if (!response.error){
                            serviceReady = true;
                            serviceInitialized = true;
                            resolve(true);
                        }else{
                            FB.getLoginStatus(function(response) {
                                if (response.status === 'connected'){
                                    $localStorage.facebookAuth = response;
                                    serviceReady = true;
                                    resolve(true);
                                }else{
                                    serviceReady = false;
                                    reject(false);
                                }
                            });
                        }
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

        getApiClientHeaders: function () {
            return {
                fbToken: getAccessTokenFromLocalStroage(),
                fbUid: FB.getUserID()
            }
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

        softReAuthenticate: function () {
            console.warn('Soft Re-Authenticating');
            return new Promise((resolve, reject)=>{
                FB.getLoginStatus((response)=>{
                    if (response.status === 'connected'){
                        $localStorage.facebookAuth = response;
                        serviceReady = true;
                        resolve(true);
                    }else{
                        serviceReady = false;
                        reject(false);
                    }
                });
            });
        },

        serviceReady : function () {
            return serviceReady;
        },
        isServiceInitialized : function () {
            return serviceInitialized;
        }
    }
});