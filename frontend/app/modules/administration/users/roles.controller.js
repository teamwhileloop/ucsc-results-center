app.controller('RoleController',function (
    $mdDialog,
    ApplicationService,
    AdminService,
    user,
    $rootScope,
    $scope)
{
    $scope.userData = Object.assign({}, user);
    $scope.userData.power = '' + $scope.userData.power;
    console.log(user);
    $scope.cancel = function() {
        $mdDialog.cancel();
    };


    $scope.submit = function() {
        let power = parseInt($scope.userData.power);
        let fromRole = getRoleName(user.power);
        let toRole = getRoleName($scope.userData.power);
        let confirm = $mdDialog.confirm()
            .title('Change Role?')
            .textContent(`Are you sure that you want to change the role of ${user.name} from ${fromRole} to ${toRole} ?`)
            .ok('Confirm')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
            ApplicationService.showNavigationIndicator({
                icon: 'swap_horiz',
                enabled: true,
                text: 'Changing Role'
            });
            AdminService.changeUserRole(user.id, power)
                .then((response)=>{
                    ApplicationService.hideNavigationIndicator();
                    ApplicationService.pushNotification({
                        title: 'Success',
                        text : `Role of ${user.name} changed from ${fromRole} to ${toRole}`,
                        template : 'success',
                        autoDismiss : true
                    });
                    $rootScope.$emit('reload-users');
                })
                .catch((err)=>{
                    ApplicationService.hideNavigationIndicator();
                    ApplicationService.pushNotification({
                        title: 'Failed',
                        text : err.data.error,
                        template : 'error',
                        autoDismiss : true
                    });
                    $rootScope.$emit('reload-users');
                });

            $mdDialog.hide();
        }, function() {
            return 0;
        });
    };

    function getRoleName(power = 0) {
        power = parseInt(power);
        if (power === 0){
            return 'Guest User';
        }if (power === 10){
            return 'Verified Member';
        }if (power === 50){
            return 'Batch Representative';
        }if (power === 100){
            return 'System Administrator';
        }
    };

});