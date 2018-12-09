const express = require('express');
const _ = require('lodash');
const router = express.Router();

let logger = require('../../modules/logger');
let mysql = require('../../modules/database');

router.post('/subject', function (req, res) {
    const query = "SELECT COUNT(`grade`) as `count`, `grade` FROM `result` WHERE `subject`=? AND `index` LIKE ? GROUP BY `grade`;";
    if (!req.body.subject){
        res.status(400).send({success:false,error:"subject is missing"});
        return;
    }

    let pattern = '%';
    if (req.body.pattern){
        pattern = req.body.pattern + '%'
    }

    mysql.query(query, [req.body.subject, pattern], function (err, payload) {
        if (!err){
            res.send(payload);
        }else {
            res.status(500).send({success:false,error: err});
        }
    })
});

module.exports = router;