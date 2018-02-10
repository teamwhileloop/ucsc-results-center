app.service('ProfileService',function ($rootScope, FacebookService, $http, apiClient, $q) {
    return {
        validateUser: function () {
            return apiClient.get('/user/validate');
        },
        getUserState: function (indexNumber = 0) {
            return apiClient.get(`/user/state/${indexNumber}`);
        },
        submitClaimRequest: function (data = {}) {
            return apiClient.post('/user/request', data);
        },
        getProfileResults: function (indexNumber = 0) {
            return apiClient.get(`/v1.0/profile/${indexNumber}`);
        },
        searchUndergraduate: function (query = 0) {
            let deferred = $q.defer();
            apiClient.get(`/v1.0/search/undergraduate/${query}`).then((response)=>{
                deferred.resolve(response.data);
            });
            return deferred.promise;
        },
        getPrivacy: function () {
            return apiClient.get('/user/privacy');
        },
        setPrivacy: function (privacy = 'public') {
            return apiClient.post('/user/privacy', { privacy: privacy });
        }
    };
});