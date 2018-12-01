const messenger = require('../../modules/messenger');

module.exports = class MessengerUser{
    constructor(senderObject){
        this.psid = senderObject.id;
    }

    GetPSID(){
        return this.psid;
    }

    SendTextReply(message){
        messenger.SendTextReply(this.psid, message)
    }
};