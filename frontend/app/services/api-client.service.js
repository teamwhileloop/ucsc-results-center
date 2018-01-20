app.service('apiClient',function ($rootScope, FacebookService, $http, $q, $location, ApplicationService) {
    return {
        get: function (url, userHeaders = {}) {
            let deferred = $q.defer();
            let headers = {
                headers: Object.assign(userHeaders, FacebookService.getApiClientHeaders())
            };
            $http.get(url, headers)
            .then((data)=>{
                deferred.resolve(data);
            })
            .catch((error)=>{
                FacebookService.softReAuthenticate()
                .then(()=>{
                    let headers = {
                        headers: Object.assign(userHeaders, FacebookService.getApiClientHeaders())
                    };
                    $http.get(url, headers)
                    .then((data)=>{
                        deferred.resolve(data);
                    })
                    .catch(()=>{
                        deferred.reject(error);
                        ApplicationService.pushNotification({
                            title: 'Unable to update Access Token',
                            text : 'For some reasons we could not could not update the Facebook access token. Please try logging in again.',
                            template : 'error',
                            autoDismiss : false
                        });
                        $location.path('/login');
                    })
                })
                .catch(()=>{
                    deferred.reject(error);
                    ApplicationService.pushNotification({
                        title: 'Unable to update Access Token',
                        text : 'For some reasons we could not could not update the Facebook access token. Please try logging in again.',
                        template : 'error',
                        autoDismiss : false
                    });
                    $location.path('/login');
                })
            });
            return deferred.promise;
        },
        post: function (url, data, userHeaders = {}) {
            let deferred = $q.defer();
            let headers = {
                headers: Object.assign(userHeaders, FacebookService.getApiClientHeaders())
            };
            $http.post(url, data, headers)
            .then((data)=>{
                deferred.resolve(data);
            })
            .catch((error)=>{
                FacebookService.softReAuthenticate()
                .then(()=>{
                    let headers = {
                        headers: Object.assign(userHeaders, FacebookService.getApiClientHeaders())
                    };
                    $http.post(url, data, headers)
                    .then((data)=>{
                        deferred.resolve(data);
                    })
                    .catch(()=>{
                        deferred.reject(error);
                        ApplicationService.pushNotification({
                            title: 'Unable to update Access Token',
                            text : 'For some reasons we could not could not update the Facebook access token. Please try logging in again.',
                            template : 'error',
                            autoDismiss : false
                        });
                        $location.path('/login');
                    })
                })
                .catch(()=>{
                    deferred.reject(error);
                    ApplicationService.pushNotification({
                        title: 'Unable to update Access Token',
                        text : 'For some reasons we could not could not update the Facebook access token. Please try logging in again.',
                        template : 'error',
                        autoDismiss : false
                    });
                    $location.path('/login');
                })
            });
            return deferred.promise;
        }

    }
});