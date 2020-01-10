const request = require('request');
const mysql = require('./database');
const _ = require('lodash');
const log = require('perfect-logger');
const credentials = require('../modules/credentials');
const configurations = require('../modules/configurations');
const basicTemplate = {
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": credentials.facebook.pageToken},
    "method": "POST"
};

function callSendAPI(sender_psid, response) {
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };

    if (!configurations.enableMessenger){
        return;
    }

    // Send the HTTP request to the Messenger Platform
    request(Object.assign(basicTemplate, {"json": request_body}), (err, res, body) => {
        if (!err) {
            log.fbmsg('Message sent to ' + sender_psid)
        } else {
            log.crit("Unable to send Facebook Message", err);
        }
    });
}


exports.SendTextReply = function (userId, textMessage) {
    callSendAPI(userId, {'text': textMessage});
};


exports.test = function(){
    let request_body = {
        "recipient": {
            "id": '2340948889253880'
        },
        "message": {'text': "Hello this is a test message"},
        "messaging_type": "MESSAGE_TAG",
        "tag": "APPLICATION_UPDATE"
    };
    request(Object.assign(basicTemplate, {"json": request_body}), (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
};

exports.sendToEventSubscribers = function(event, message, messageTypeTag = 'APPLICATION_UPDATE'){
    if (!mysql.connectedToDatabase){
        log.info(`Skipping event ${event}. No database connection`);
        return;
    }

    const query = "SELECT `facebook`.`psid` " +
        "FROM `event_subscriptions` " +
        "JOIN `facebook` " +
        "ON `event_subscriptions`.`event` = ? " +
        "AND `facebook`.`id` = `event_subscriptions`.`fbid` " +
        "AND `event_subscriptions`.`value` = 1 AND `facebook`.`psid` != '0';";


    mysql.query(query, [event], function (err, payload) {
        if (err){
            err.skipFacebookMessenger = true;
            log.crit_nodb(`Unable to fetch '${event}' event subscribers from database`, err);
            return;
        }

        log.debug(`Sending message '${message.replace('\n', ' ')}' to '${event}' subscribers [count: ${payload.length}]`);
        _.forEach(payload, function (row) {
            let request_body = {
                "recipient": {
                    "id": row.psid
                },
                "message": {'text': message},
                "messaging_type": "MESSAGE_TAG",
                "tag": messageTypeTag
            };

            if (!configurations.enableMessenger){
                return;
            }


            log.debug(`Sending Facebook Messenger message to ${row.psid}`);

            request(Object.assign(basicTemplate, {"json": request_body}), (err, res, body) => {
                if (err){
                    err.skipFacebookMessenger = true;
                    log.crit("Unable to send Facebook Message:", err);
                }
            });
        })
    })
};

exports.GetUserInfo = function (userId) {
    return new Promise(function(resolve, reject){
        request({
            "uri": `https://graph.facebook.com/${userId}?fields=first_name,last_name,profile_pic&access_token=${process.env.FB_PAGE_TOKEN}`,
            "method": "GET"
        }, function (error, response, body) {
            if (error) return reject(error);
            resolve(body);
        });
    });
};

exports.alertDeveloper = function (message) {
    let request_body = {
        "recipient": {
            "id": "1325438150898410"
        },
        "message": {'text': message},
        "messaging_type": "MESSAGE_TAG",
        "tag": "APPLICATION_UPDATE"
    };

    if (!configurations.enableMessenger){
        return;
    }


    log.debug(`Sending Developer Alert: ${message}`);
    log.writeData(request_body);

    request(Object.assign(basicTemplate, {"json": request_body}), (err, res, body) => {
        if (err){
            err.skipFacebookMessenger = true;
            log.crit("Unable to send Facebook Message:", err);
        }
    });
};