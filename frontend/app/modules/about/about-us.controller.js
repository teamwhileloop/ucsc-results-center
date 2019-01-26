app.controller('AboutController',function (
    $scope,
    LoadingMaskService,
    ApplicationService,
    loggedInUser
) {
    LoadingMaskService.deactivate();
    ApplicationService.hideNavigationIndicator();
    ApplicationService.displayPageHeader();
    ApplicationService.updatePageHeader(loggedInUser);

    $scope.team = [
        {
            name: 'Sulochana Kodituwakku',
            img: '/public/img/sulochana.jpg',
            desc: 'Software Engineer | London Stock Exchange Group',
            git: 'https://github.com/heysulo',
            fb: 'https://www.facebook.com/sulochana.kodituwakku',
            twitter: 'https://twitter.com/heysulo',
            linkedin: 'https://lk.linkedin.com/in/heysulo'
        },
        {
            name: 'Umesh Prabushitha Jayasinghe',
            img: '/public/img/umesh.jpg',
            desc: 'Software Engineer | Sysco Labs',
            git: 'https://github.com/prabushitha',
            fb: 'https://www.facebook.com/sulochana.kodituwakku',
            twitter: 'https://twitter.com/heysulo',
            linkedin: 'https://lk.linkedin.com/in/heysulo'
        },
        {
            name: 'Sajitha Gimash Liyanage',
            img: '/public/img/sajitha.jpg',
            desc: 'Software Engineer | WSO2',
            git: 'https://github.com/prabushitha',
            fb: 'https://www.facebook.com/sulochana.kodituwakku',
            twitter: 'https://twitter.com/heysulo',
            linkedin: 'https://lk.linkedin.com/in/heysulo'
        },
        {
            name: 'Sajini Shanilka',
            img: '/public/img/sajini.jpg',
            desc: 'Software Engineer | Sysco Labs',
            git: 'https://github.com/prabushitha',
            fb: 'https://www.facebook.com/sulochana.kodituwakku',
            twitter: 'https://twitter.com/heysulo',
            linkedin: 'https://lk.linkedin.com/in/heysulo'
        }
    ];
    
    $scope.open = function (link) {
        window.open(link);
    }
});