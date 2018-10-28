app.controller('NotificationSystemController',function ($scope,$timeout,$interval) {

    this.pushNotification = function (notification = {}) {
        notification = Object.assign({
            title: Math.random().toString(36).substr(2, 8),
            text : Math.random().toString(36).substr(2, 8),
            localId : 'notification_' + Math.random().toString(36).substr(2, 6),
            template : 'info',
            autoDismiss : true,
            autoDismissDelay : 5000,
            remoteId: -1
        },notification);
        options = {};
        switch (notification.template){
            case 'info':
                options = {
                    background : '#5E31A7',
                    icon : 'fa-bell',
                    iconColor : '#fff'
                };
                break;
            case 'success':
                options = {
                    background : '#3AA757',
                    icon : 'fa-check-circle',
                    iconColor : '#fff'
                };
                break;
            case 'warn':
                options = {
                    background : '#ffd700',
                    icon : 'fa-exclamation-triangle',
                    iconColor : '#000',
                    autoDismiss: false
                };
                break;
            case 'error':
                options = {
                    background : '#bf263c',
                    icon : 'fa-times-circle',
                    iconColor : '#fff',
                    autoDismiss: false
                };
                break;
        };
        notification = Object.assign(notification,options);
        let newNotification = `<li class='notification-item-li notification-joiner' id='${notification.localId}'>
          <div class='notification-box'>
            <div class='notification-box-panel-a'
                 style='background-color: ${notification.background}; color: ${notification.iconColor}'>
              <i class="fa ${notification.icon} aria-hidden="true"></i>
            </div>
            <div class='notification-box-panel-b'>
              <div class='notification-box-header'>
                ${notification.title}
                <i class="fa fa-times notification-close" aria-hidden="true" onclick="dissmissNotification('${notification.localId}', '${notification.remoteId}')"></i>
              </div>
              <div class='notification-box-body'>
                ${notification.text}
              </div>
            </div>
          </div>
        </li>`;
        document.getElementById('notificationSystem').innerHTML += newNotification;

        $timeout(() => {
            document.getElementById(notification.localId).classList.remove('notification-joiner');
        }, 800);

        if (notification.autoDismiss){
            $timeout(() => {
                try {
                    this.dissmissNotification(notification.localId, notification.remoteId);
                }catch (e){
                    console.log(e);
                }
            }, notification.autoDismissDelay);
        }

    };

    $scope.$on('push-notification', (_event, args)=> {
        this.pushNotification(args);
    });

    this.dissmissNotification = function (id, remoteId){
        var notification = document.getElementById(id);
        notification.className += " dissmisser";
        setTimeout(function(){
            notification.outerHTML = '';
            if (parseInt(remoteId) !== -1){
                sendAlertAck(remoteId);
            }
        }, 1000);
    }

});

function dissmissNotification(id, remoteId = -1){
    var notification = document.getElementById(id);
    notification.className += " dissmisser";
    if (parseInt(remoteId) !== -1){
        sendAlertAck(remoteId);
    }
    setTimeout(function(){
        notification.outerHTML = '';
    }, 1000);

}

function sendAlertAck(remoteId) {
    var xhttp = new XMLHttpRequest();
    var userData = JSON.parse(localStorage.getItem('ngStorage-facebookAuth'));
    xhttp.open("GET", "/v1.0/alerts/ack/" + remoteId, true);
    xhttp.setRequestHeader('fbUid', userData.authResponse.userID)
    xhttp.setRequestHeader('fbToken', userData.authResponse.accessToken)
    xhttp.send();
}