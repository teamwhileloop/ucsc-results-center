const express = require('express');
const router = express.Router();

router.get('/', function (req, res) {
    res.send({
        hits: global.APIhits,
        users: global.users,
        records: global.records
    })
});

module.exports = router;