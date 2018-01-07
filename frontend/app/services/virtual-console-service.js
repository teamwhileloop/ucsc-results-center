app.service('VirtualConsoleService',function ($rootScope,FacebookService,$http) {
    return {
        getConsoleLog: function (page, count, filter) {
            let query = '';
            page ? query += `page=${page}&` : null;
            count ? query += `count=${count}&` : null;
            filter ? query += `filter=${filter}` : null;
            return $http.get(`/admin/console?${query}`,{
                headers: FacebookService.getHttpRequestHeaders()
            })
        }
    };
});