const express = require('express');
const _ = require('lodash');
const router = express.Router();

let mysql = require('../../modules/database');

router.get('/undergraduate/:pattern', function (req, res) {
    let pattern = req.params['pattern'] || 0;
    if (parseInt(pattern) > 0 && ("" + pattern).length < 4){
        res.send([]);
        return;
    }

    let query = "SELECT `indexNumber`, `gpa`, `rank`, ( IF(`user_showcase` = 1, `name`, '')) as `name` FROM (" +
                        "SELECT `undergraduate`.`indexNumber`, `undergraduate`.`gpa`, `undergraduate`.`rank`, `undergraduate`.`user_showcase`, `undergraduate`.`privacy`, `facebook`.`name` " +
                        "FROM `undergraduate` " +
                        "LEFT JOIN `facebook` " +
                        "ON `undergraduate`.`indexNumber` = `facebook`.`index_number`) as tmp " +
        "WHERE (`indexNumber` LIKE CONCAT('%', ?,'%') OR IF(`user_showcase` = 1, `name` LIKE CONCAT('%', ?,'%'), 0)) " +
        "AND accessControl(?, `indexNumber`) ORDER BY `gpa` DESC LIMIT 10;";

    if (req.facebookVerification.power > 50){
        query = "SELECT `indexNumber`, `gpa`, `rank`, `name` FROM (" +
            "SELECT `undergraduate`.`indexNumber`, `undergraduate`.`gpa`, `undergraduate`.`rank`, `undergraduate`.`user_showcase`, `undergraduate`.`privacy`, `facebook`.`name` " +
            "FROM `undergraduate` " +
            "LEFT JOIN `facebook` " +
            "ON `undergraduate`.`indexNumber` = `facebook`.`index_number`) as tmp " +
            "WHERE (`indexNumber` LIKE CONCAT('%', ?,'%') OR `name` LIKE CONCAT('%', ?,'%')) " +
            "ORDER BY `gpa` DESC LIMIT 10;";
    }

    mysql.query(query,[pattern.toString(), pattern.toString(), req.facebookVerification.indexNumber || 0],function (err,payload) {
        if (!err){
            res.send(payload);
        } else{
            res.status(500).send({success:false,error:err});
        }
    });
});

module.exports = router;