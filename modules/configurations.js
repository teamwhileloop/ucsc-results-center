exports.enableEmails = process.env.ENABLE_EMAILS === '1';
exports.enableMessenger = process.env.MESSENGER_INTERGRATIONS === '1';
exports.logDirectory = process.env.WEB_LOG_PATH || './web-logs';