app.controller('LoginController',function ($scope,LoadingMaskService,PageHeaderService,$timeout) {

    $timeout(function () {
        LoadingMaskService.deactivate();
    }, 5000);

    this.ss = ()=>{
        PageHeaderService.displayPageHeader();
        PageHeaderService.showNavigationIndicator({
            enabled: true,
            icon: 'fingerprint',
            text: 'Authenticating using Facebook'
        });
    }
});