app.service('ProfileService',function ($rootScope,FacebookService,$http) {
    return {
        validateUser: function () {
            return $http.get('/user/validate',{
                headers: FacebookService.getHttpRequestHeaders()
            })
        }
    };
});