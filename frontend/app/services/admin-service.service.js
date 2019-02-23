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
        },
        getNotificationList: function () {
            return apiClient.get(`/admin/alerts/list`);
        },
        addNotification: function (notifiaction) {
            return apiClient.post('/admin/alerts/add', notifiaction)
        },
        deleteNotification: function (remoteId) {
            return apiClient.delete('/admin/alerts/delete/' + remoteId);
        },
        changeUserRole: function (userId, power) {
            return apiClient.post('/admin/users/role', {id:userId, power: power});
        },
        forceResultScan: function () {
            return apiClient.get(`/admin/system/forcescan`);
        },
        getUserFeedbacks: function () {
            return apiClient.get('/user/feedback/get')
        },
        recalibrate: function (pattern = '00') {
            return apiClient.post(`/admin/calculate/pattern/${pattern.substr(0,4)}`)
        },
        getAllSubjects: function () {
            return apiClient.get('/admin/result/subject-list');
        },
        getDataSets: function (code) {
            return apiClient.get(`/admin/result/datasets/${code}`);
        },
        getLastDataSets: function (number = 10) {
            return apiClient.get(`/admin/result/last-datasets/${number}`);
        },
        deleteDataset: function (dataset) {
            return apiClient.delete('/admin/result/dataset/' + dataset);
        },
        getMaintenanceModeStatus: function () {
            return apiClient.get(`/admin/system/maintenance`);
        },
        setMaintenanceMode: function (enabled, message = "", activationCode = "") {
            return apiClient.post('/admin/system/maintenance', {
                status: enabled === true,
                activationCode: activationCode.toString(),
                message: message.toString()
            })
        },
        runCustomBackup: function (name = 'custombackup') {
            return apiClient.get(`/admin/system/run-backup/${name}`)
        }
    };
});