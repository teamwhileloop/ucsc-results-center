app.component('semester', {
    templateUrl: 'public/html/components/semester/view.html',
    bindings: {
        semesterData: '=',
        summary: '='
    },
    controller: function semsterController($scope){
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

        $scope.getSemesterTitle = () =>{
            return this.ranker(this.semesterData.year) + ' Year ' + this.ranker(this.semesterData.semester) + ' Semester'
        }

    },
    controllerAs : 'semesterCtrl'
});