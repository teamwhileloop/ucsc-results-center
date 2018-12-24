const _ = require('lodash');
const FacebookAPI = require('fb');
const log =require('perfect-logger');

exports.validateAccessToken = function (accessToken = '', userId = '') {
    return new Promise(
        function (resolve, reject) {
            FacebookAPI.setAccessToken(accessToken);
            FacebookAPI.api('me', 'post', {
                fields: 'email,first_name,last_name,gender,link,short_name,picture{url},cover,education,name'
            }, function (response) {
                if(!response || response.error) {
                    reject(_.assign(response, {
                        success: false
                    }));
                }else if(!!userId === false ){
                    resolve(_.assign(response, {
                        success: true,
                        uidMatched : false
                    }));
                }else if (response.id === userId){
                    resolve(_.assign(response, {
                        success: true,
                        uidMatched : true
                    }));
                }else {
                    reject(_.assign(response, {
                        success: false,
                        uidMatched : false
                    }));
                    log.debug(`Facebook Auth Error occured 0x3`);
                    log.writeData(response);
                }
            });

        });
};