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
        getPublicProfileResults: function (indexNumber = 0) {
            return apiClient.get(`/v1.1/profile/${indexNumber}`);
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
        setPrivacy: function (privacy = 'public', showcase = 1) {
            return apiClient.post('/user/privacy', { privacy: privacy, showcase: showcase });
        },
        getAlerts: function () {
            return apiClient.get('v1.0/alerts/status');
        },
        sendAlertAck: function (remoteId) {
            return apiClient.get('v1.0/alerts/ack/' + remoteId);
        },
        getMessengerNotificationStatus: function () {
            return apiClient.get('/user/notifications/status');
        },
        getNotificationSettings: function () {
            return apiClient.get('/user/notifications/settings');
        },
        updateNotificationSettings: function (data) {
            return apiClient.post('/user/notifications/settings', data);
        },
        getAdmins: function () {
            return apiClient.get('/user/admins');
        },
        getAdminsWithPower: function (power) {
            return apiClient.get(`/user/admins/${power}`);
        },
        sendFeedBack: function (text) {
            return apiClient.post('/user/feedback/submit', {text: text});
        },
        getSubjectWiseAnalysis: function (subject, pattern) {
            return apiClient.post('v1.0/statistics/subject', {subject: subject, pattern: pattern})
        },
        getSubjectWiseAnalysisBatchNumber: function (subject, pattern) {
            return apiClient.get(`/v1.0/statistics/subject/batch/numbers/${subject}/${pattern}`)
        },
        deleteAccount: function () {
            return apiClient.delete('/user/delete');
        },
        getPublicProfileSettings: function () {
            return apiClient.get('/user/public-profile');
        },
        setPublicProfileSettings: function (settings = {}) {
            return apiClient.post('/user/public-profile', settings);
        }
    };
});