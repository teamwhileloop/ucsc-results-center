app.controller('RegistrationController',function (
    $scope,
    $rootScope,
    LoadingMaskService,
    ApplicationService,
    loggedInUser,
    FacebookService,
    ProfileService,
    $location
) {
    console.log('Reg ctrl loaded');
    console.log(loggedInUser);

    $scope.indexNumberStatus = 'unknown'; // unknown,conflict,checking,available,not-found
    $scope.loggedInUser = loggedInUser;
    $scope.invalidUserEmail = false;
    $scope.useAlternateEmail = false;

    this.preferedEmail = '';
    this.requestedIndexNumber = '';

    ApplicationService.displayPageHeader();
    ApplicationService.updatePageHeader(loggedInUser);
    LoadingMaskService.deactivate();

    switch (loggedInUser.state){
        case 'verified':
            break;
        case 'guest':
            $scope.step = 0;
            break;
        case 'pending':
            $scope.step = 4;
            break;
        case 'blocked':
            $scope.step = 5;
            break;
        default:
            console.error('Unknown user state');
            $location.path('/error');
            break;
    }
    $scope.goBack = function(){
        $scope.step -= 1;
    };

    $scope.goToStep = function(step){
        $scope.step = step;
    };

    this.ranker = (number) => {
        switch (number){
            case 1:
                return number + "st";
            case 2:
                return number + "nd";
            case 3:
                return number + "rd";
            default:
                return number + "th";
        }
    };

    this.getBatchLabel = function (indexNumber = 0) {
        if (!!$scope.loggedInUser.indexNumber){
            return `${this.ranker(parseInt($scope.loggedInUser.indexNumber.toString().substring(0,2)) - 2)} Batch`;
        }else{
            return 'Unknown';
        }
    };

    this.checkIndexNumberValidity = function (indexNumber = 0) {
        this.requestedIndexNumber = indexNumber;
        if (/^[0-9]{2}0[02]{1}[0-9]{4}$/.test(indexNumber)){
            $scope.indexNumberStatus = 'checking';
            ProfileService.getUserState(indexNumber)
            .then((response)=>{
                if (response.status === 200){
                    $scope.indexNumberStatus = response.data.state;
                }else if(response.status === 401){
                    FacebookService.reAuthenticate()
                    .then((data)=>{
                        if (data){
                            this.checkIndexNumberValidity(indexNumber);
                        }
                    });
                }
            });
        }else{
            $scope.indexNumberStatus = 'unknown';
        }
    };

    this.checkEmailValidity = function (emailAddress = '') {
        if (emailAddress !== ''){
            $scope.useAlternateEmail = true;
            $scope.invalidUserEmail = !/^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/.test(emailAddress);
            if (!$scope.invalidUserEmail){
                this.preferedEmail = emailAddress;
            }else{
                this.preferedEmail = '';
            }

        }else{
            $scope.useAlternateEmail = false;
            this.preferedEmail = '';
        }
    };

    this.submit = function () {
        let request = {};
        $scope.useAlternateEmail ? request['email'] = this.preferedEmail : null;
        request['indexNumber'] = this.requestedIndexNumber;
        ProfileService.submitClaimRequest(request)
        .then((_response)=>{
            $scope.step = 4;
            $scope.loggedInUser.state = 'pending';
            $scope.loggedInUser.indexNumber = request['indexNumber'];
            $scope.loggedInUser.alternate_email = request['email'];
        })
        .catch((error)=>{
            ApplicationService.pushNotification({
                title: 'Unable submit claim request',
                text : 'For some reasons we could not submit your request. Please contact administrator for further assistance.',
                template : 'error',
                autoDismiss : false
            });
        });
    }

});