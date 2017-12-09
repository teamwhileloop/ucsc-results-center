app.controller('NotificationSystemController',function ($scope,$timeout,$interval) {

    this.pushNotification = function (notification = {}) {
        notification = Object.assign({
            title: Math.random().toString(36).substr(2, 8),
            text : Math.random().toString(36).substr(2, 8),
            id : 'notification_' + Math.random().toString(36).substr(2, 6),
            template : 'info',
            autoDismiss : true,
            autoDismissDelay : 5000
        },notification);
        options = {};
        switch (notification.template){
            case 'info':
                options = {
                    background : '#5E31A7',
                    icon : 'fa-bell',
                    iconColor : '#fff'
                }
                break;
            case 'success':
                options = {
                    background : '#3AA757',
                    icon : 'fa-check-circle',
                    iconColor : '#fff'
                }
                break;
            case 'warn':
                options = {
                    background : '#ffd700',
                    icon : 'fa-exclamation-triangle',
                    iconColor : '#000',
                    autoDismiss: false
                }
                break;
            case 'error':
                options = {
                    background : '#bf263c',
                    icon : 'fa-times-circle',
                    iconColor : '#fff',
                    autoDismiss: false
                }
                break;
        };
        notification = Object.assign(notification,options);
        let newNotification = `<li class='notification-item-li notification-joiner' id='${notification.id}'>
          <div class='notification-box'>
            <div class='notification-box-panel-a'
                 style='background-color: ${notification.background}; color: ${notification.iconColor}'>
              <i class="fa ${notification.icon} aria-hidden="true"></i>
            </div>
            <div class='notification-box-panel-b'>
              <div class='notification-box-header'>
                ${notification.title}
                <i class="fa fa-times notification-close" aria-hidden="true" onclick="dissmissNotification('${notification.id}')"></i>
              </div>
              <div class='notification-box-body'>
                ${notification.text}
              </div>
            </div>
          </div>
        </li>`;
        document.getElementById('notificationSystem').innerHTML += newNotification;

        $timeout(() => {
            document.getElementById(notification.id).classList.remove('notification-joiner');
        }, 800);

        if (notification.autoDismiss){
            $timeout(() => {
                try {
                    this.dissmissNotification(notification.id);
                }catch (e){}
            }, notification.autoDismissDelay);
        }

    }

    $scope.$on('push-notification', (_event, args)=> {
        this.pushNotification(args);
    });

    this.dissmissNotification = function (id){
        var notification = document.getElementById(id);
        notification.className += " dissmisser";
        setTimeout(function(){
            notification.outerHTML = '';
        }, 1000);
    }

});

function dissmissNotification(id){
    var notification = document.getElementById(id);
    notification.className += " dissmisser";
    setTimeout(function(){
        notification.outerHTML = '';
    }, 1000);

}