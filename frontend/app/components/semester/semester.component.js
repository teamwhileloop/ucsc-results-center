app.component('semester', {
    templateUrl: 'public/html/components/semester/view.html',
    bindings: {
        semesterData: '=',
        summary: '=',
        hideOptions: '='
    },
    controller: function semsterController($scope, $localStorage, $rootScope){
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

        this.check = $rootScope.onlyBest;
        $scope.hideOptions = this.hideOptions;

        $scope.getSemesterTitle = () =>{
            return this.ranker(this.semesterData.year) + ' Year ' + this.ranker(this.semesterData.semester) + ' Semester'
        };

        $scope.updateOnlyBestSetting = ()=> {
            $rootScope.onlyBest = !$rootScope.onlyBest;
            this.check = $rootScope.onlyBest;
            $localStorage.onlyBest = $rootScope.onlyBest;
        };

        $scope.showSubjectStats = function (subject, pattern, event) {
            pattern = pattern.toString().substr(0,2);
            $rootScope.$broadcast('subject.stat', [subject, pattern, event]);
        };

    },
    controllerAs : 'semesterCtrl'
});