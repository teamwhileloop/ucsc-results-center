app.controller('ViewFileController',function (
    $mdDialog,
    VirtualConsoleService,
    $scope)
{

    $scope.logText = '';
    $scope.maxPages = 0;
    $scope.curPage = 0;


    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.loadFile = function (page) {
        $scope.logText = '';
        $scope.maxPages = 0;
        $scope.curPage = 0;
        VirtualConsoleService.viewFile(page)
        .then((data)=>{
            $scope.maxPages = parseInt(data.headers()['total-pages']);
            $scope.curPage = parseInt(data.headers()['cur-page']);
            $scope.logText = data.data.toString();
        });
    };


    $scope.loadFile(null);

});