const express = require('express');
const router = express.Router();
const log = require('perfect-logger');
const credentials = require('../../modules/credentials');
const messengerAPI = require('./messenger-api');
const MessengerUser = require('./messenger-user');

const VERIFY_TOKEN = credentials.facebook.verifyToken;

router.get('/', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    log.debug('Facebook webhook challenge recieved.');
    log.writeData(req.query);

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            res.status(200).send(challenge);
            log.info("Facebook WebHook verified");
        } else {
            log.warn(`Facebook WebHook verification failed. {mode:${mode}, token:${token}`);
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

router.post('/', (req, res) => {
    let body = req.body;
    log.debug("Facebook webhook event recieved");
    log.writeData(body);
    if (body.object === 'page') {
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