app.service('AdminService',function ($rootScope, FacebookService, $http, apiClient, $q) {
    return {
        getUserList: function (state, count, page, search = '') {
            let query = '';
            page ? query += `page=${page}&` : null;
            count ? query += `count=${count}&` : null;
            search ? query += `search=${search}&` : null;
            state ? query += `state=${state}` : null;
            return apiClient.get(`/admin/users?${query}`);
        },
        acceptUserRequest: function (fbId) {
            return apiClient.post(`/admin/users/approve/${fbId}`);
        },
        rejectUserRequest: function (fbId) {
            return apiClient.post(`/admin/users/reject/${fbId}`);
        },
        resetUser: function (fbId) {
            return apiClient.post(`/admin/users/reset/${fbId}`);
        }
    };
});