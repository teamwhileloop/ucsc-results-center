app.controller('LoginController',function ($scope,LoadingMaskService) {
    LoadingMaskService.deactivate();
    this.ss = ()=>{
        LoadingMaskService.activate();
    }
});