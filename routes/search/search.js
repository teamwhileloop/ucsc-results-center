const express = require('express');
const _ = require('lodash');
const router = express.Router();

let logger = require('../../modules/logger');
let mysql = require('../../modules/database');

router.get('/undergraduate/:pattern', function (req, res) {
    let pattern = req.params['pattern'] || 0;
    let query = "SELECT " +
                "   `indexNumber`, `gpa`, `rank` " +
                "FROM `undergraduate` " +
                "WHERE " +
                "   `indexNumber` LIKE CONCAT('%',?,'%') AND " +
                "   accessControl(?, `indexNumber`) " +
                "ORDER BY `gpa` " +
                "DESC LIMIT 10;";
    mysql.query(query,[pattern.toString(), req.facebookVerification.indexNumber || 0],function (err,payload) {
        if (!err){
            res.send(payload);
        } else{
            res.status(500).send({success:false,error:err});
        }
    });
});

module.exports = router;