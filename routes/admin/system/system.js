const express = require('express');
const router = express.Router();
const _ = require('lodash');

const logger = require('../../../modules/logger');

router.post('/maintenance',function (req,res) {
    global.maintananceMode = Object.assign({
        status: true,
        message: 'System under maintenance'
    }, req.body);
    res.send(global.maintananceMode);
});

module.exports = router;