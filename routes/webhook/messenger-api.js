const messenger = require('../../modules/messenger');
const connection = require('../../modules/database');
const logger = require('../../modules/logger');


exports.processMessage = function(user, message){
    const tokenArray = message.toLowerCase().split(' ');

    if (tokenArray[0] === "subscribe"){
        ActionSubscribe(user, tokenArray[1] || "");
    } else {
        user.SendTextReply("Unknown command");
    }
};


function ActionSubscribe(user, token) {
    if (token === ""){
        user.SendTextReply("Please use the syntax: SUBSCRIBE <TOKEN>\n\nYou can get your token from www.ucscresult.com");
        return;
    }

    connection.query("SELECT * FROM messnger_subscription_tokens WHERE token=?",[token],(err, payload)=>{
        if (err){
            user.SendTextReply('Error occurred. Please try again later.');
            return;
        }

        if (payload.length === 0){
            user.SendTextReply('The token seems to invalid.');
            return;
        }

        if (+ new Date() > payload[0].expirydate){
            user.SendTextReply(
                `The token was expired on ${new Date(payload[0].expirydate).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}.
                \nPlease generate a new token and try again`);
        } else {
            registerUser(user, payload[0].userId);
        }

    });
}

function registerUser(user, userId) {
    connection.query("DELETE FROM messnger_subscription_tokens WHERE userId = ?",[userId],(err)=>{
        if (err){
            logger.log("Failed to delete subscription tokens", 'warn', true, err);
        }
    });

    connection.query("UPDATE facebook SET psid = ? WHERE id = ? AND psid = '0'",[user.GetPSID(), userId],(err, payload)=>{
        if (err){
            console.log(err);
            logger.log("Failed to delete subscription tokens", 'warn', true, err);
            user.SendTextReply("Unable to register you on the system. Internal Error");
            return;
        }

        if (payload.affectedRows === 1){
            user.SendTextReply("Registration success");
        }else{
            user.SendTextReply("Registration failed. [User not found]\nPlease try again with a new token");
        }

    });
}