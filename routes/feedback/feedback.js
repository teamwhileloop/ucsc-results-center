const express = require('express');
const _ = require('lodash');
const router = express.Router();

let logger = require('../../modules/logger');
let mysql = require('../../modules/database');

router.post('/submit', function (req, res) {
    if (!req.body.text){
        res.status(400).send("No content");
        return;
    }
    if (req.body.text.length > 2990){
        res.status(400).send("Excess length");
        return;
    }
    const query = "INSERT INTO `feedback` (`fbid`, `text`, `state`) VALUES (?, ?, 0);";
    mysql.query(query, [req.facebookVerification.id, req.body.text], function (error, payload) {
        if (!error){
            res.send({
                succes: true
            })
        }else{
            logger.log(error.sqlMessage,'crit',true, JSON.stringify(_.assignIn(error,{
                meta: req.facebookVerification,
                env: req.headers.host
            })));
            res.status(500).send({ error: error });
        }
    });
});

router.get('/get', function (req, res) {
    const query = "SELECT `facebook`.`name`, " +
                        "`facebook`.`picture`, " +
                        "`facebook`.`index_number`, " +
                        "`facebook`.`state`, " +
                        "`feedback`.`text` " +
        "FROM `feedback` JOIN `facebook` ON `facebook`.`id` = `feedback`.`fbid` ORDER BY `feedback`.`feedback_id` DESC;";
    mysql.query(query, function (error, payload) {
        if (!error){
            res.send(payload)
        }else {
            logger.log(error.sqlMessage,'crit',true, JSON.stringify(_.assignIn(error,{
                meta: req.facebookVerification,
                env: req.headers.host
            })));
            res.status(500).send({ error: error });
        }
    })
});

module.exports = router;