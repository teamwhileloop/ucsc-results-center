const express = require('express');
const router = express.Router();

const logger = require('../../../modules/logger');

router.get('/',function (req,res) {
    res.send(logger.getVirtualConsoleLog());
});

router.delete('/clear',function (req,res) {
    res.send(logger.clearVirtualConsoleLog());
});

module.exports = router;