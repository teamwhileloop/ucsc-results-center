app.service('ProfileService',function ($rootScope, FacebookService, $http, apiClient) {
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
        }
    };
});