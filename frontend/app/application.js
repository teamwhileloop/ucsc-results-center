let applicationID = window.location.host === 'localhost:3000' ? '1917234511877082' : '324582471336592';
FB.init({
    appId      : applicationID,
    cookie     : true,
    xfbml      : false,
    version    : 'v2.8'
});

// Load the SDK asynchronously
(function(d, s, id) {
    let js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));


let app = angular.module('ucscResultsCenter', [
    'ngRoute',
    'ngStorage',
    'ngMaterial']
);