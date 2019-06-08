const messenger = require('../modules/messenger');
module.exports = function (data) {
    if (data.details && data.details.skipFacebookMessenger === true)
        return;

    messenger.sendToEventSubscribers('system_warn_err_thrown', `Event Raised: ${data.code}\n${data.message}`);
};