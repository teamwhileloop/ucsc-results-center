app.service('VirtualConsoleService',function ($rootScope,FacebookService, apiClient) {
    return {
        getConsoleLog: function (page, count, filter) {
            let query = '';
            page ? query += `page=${page}&` : null;
            count ? query += `count=${count}&` : null;
            filter ? query += `filter=${filter}` : null;
            return apiClient.get(`/admin/console?${query}`);
        },
        clearConsoleLogs: function () {
            return apiClient.delete(`/admin/console/clear`);
        },
        viewFile: function (page = null) {
            return apiClient.get(`/admin/console/download?${page === null ? '' : 'page='+page}`)
        }
    };
});