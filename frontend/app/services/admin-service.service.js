app.service('AdminService',function ($rootScope, FacebookService, $http, apiClient, $q) {
    return {
        getUserList: function (state, count, page) {
            let query = '';
            page ? query += `page=${page}&` : null;
            count ? query += `count=${count}&` : null;
            state ? query += `state=${state}` : null;
            return apiClient.get(`/admin/users?${query}`);
        }
    };
});