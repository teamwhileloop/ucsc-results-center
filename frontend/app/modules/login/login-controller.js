app.controller('LoginController',function ($scope,LoadingMaskService,ApplicationService,$timeout) {

    $timeout(function () {
        LoadingMaskService.deactivate();
    }, 1000);

    this.ss = ()=>{
        ApplicationService.displayPageHeader();
        ApplicationService.showNavigationIndicator({
            enabled: true,
            icon: 'fingerprint',
            text: 'Authenticating using Facebook'
        });
        ApplicationService.pushNotification({title: 'Hey',text:'Whatsuppp?',template: 'warn'})
    }
});