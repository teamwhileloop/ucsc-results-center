const express = require('express');
const router = express.Router();
const logger = require('../../modules/logger');
const messengerAPI = require('./messenger-api');
const MessengerUser = require('./messenger-user');

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

router.get('/', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            res.status(200).send(challenge);
            logger.log("Facebook WebHook verified");
        } else {
            logger.log(`Facebook WebHook verification failed. {mode:${mode}, token:${token}`, warn);
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

router.post('/', (req, res) => {
    let body = req.body;
    if (body.object === 'page') {
        console.log(body);
        body.entry.forEach(function(entry) {
            let webhook_event = entry.messaging[0];
            let user = new MessengerUser(webhook_event.sender);
            messengerAPI.processMessage(user, webhook_event.message.text);
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }

});


module.exports = router;