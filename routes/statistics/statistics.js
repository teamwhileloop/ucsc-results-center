const express = require('express');
const _ = require('lodash');
const router = express.Router();

let mysql = require('../../modules/database');

function getRank(number) {
    const orgNumber = number;
    if (number>14){
        number = parseInt(number.toString().substr(1,2));
    }
    switch (number){
        case 1:
            return orgNumber + "st";
        case 2:
            return orgNumber + "nd";
        case 3:
            return orgNumber + "rd";
        default:
            return orgNumber + "th";
    }
};

router.post('/subject', function (req, res) {
    const query = "call subjectwise_stat(?, ?);";
    if (!req.body.subject || !req.body.pattern){
        res.status(400).send({success:false,error:"subject or pattern is missing"});
        return;
    }

    let pattern = '';
    if (req.body.pattern){
        pattern = req.body.pattern.toString().substr(0,2)
    }

    mysql.query(query, [req.body.subject, pattern], function (err, payload) {
        if (!err){
            res.send({
                subject: req.body.subject,
                batch: getRank(parseInt(pattern) - 2) + ' Batch',
                data: payload[0]
            });
        }else {
            res.status(500).send({success:false,error: err});
        }
    })
});

module.exports = router;