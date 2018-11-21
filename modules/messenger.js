const request = require('request');
const basicTemplate = {
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": process.env.FB_PAGE_TOKEN },
    "method": "POST"
};

function callSendAPI(sender_psid, response) {
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };

    // Send the HTTP request to the Messenger Platform
    request(Object.assign(basicTemplate, {"json": request_body}), (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}


exports.SendTextReply = function (userId, textMessage) {
    callSendAPI(userId, {'text': textMessage});
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