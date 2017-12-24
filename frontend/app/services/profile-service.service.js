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