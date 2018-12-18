const express = require('express');
const _ = require('lodash');
const router = express.Router();
const log = require('perfect-logger');

let mysql = require('../../../modules/database');

router.post('/add', function (req, res) {
    let alert = {
        title: "Notice",
        text: "",
        template: "info",
        autoDismiss: 1,
        autoDismissDelay: 5000,
        showAlways: 0
    };

    if (req.body['title'] === undefined){
        res.status(400).send({success: false, error: "Title cannot be empty"});
    }

    if (req.body['text'] === undefined){
        res.status(400).send({success: false, error: "Text cannot be empty"});
    }

    if (['info', 'warn', 'success', 'error'].indexOf(req.body['template']) === -1){
        res.status(400).send({success: false, error: "Invalid template"});
    }

    alert = Object.assign(alert, req.body);
    let query = "INSERT INTO `alerts` (`title`, `text`, `template`, `autoDismiss`, `autoDismissDelay`, `showAlways`) " +
        "VALUES (?, ?, ?, ?, ?, ?);";
    mysql.query(query,[
        alert.title,
        alert.text,
        alert.template,
        alert.autoDismiss > 0 ? 1 : 0,
        alert.autoDismissDelay > 0 ? alert.autoDismissDelay : 5000,
        alert.showAlways > 0 ? 1 : 0
    ],function (err,payload) {
        if (!err){
            res.send(payload);
            log.info(`New alert '${ alert.title}' added by ${req.facebookVerification.name}`)
        } else{
            log.crit(`Failed to add new alert as requested by ${req.facebookVerification.name}`, err);
            res.status(500).send({success:false,error:err});
        }
    });
});

router.get('/list', function (req, res) {
    let query = "SELECT * FROM alerts";
    mysql.query(query, function (err,payload) {
        if (!err){
            res.send(payload);
        } else{
            log.crit(`Failed to list alerts as requested by ${req.facebookVerification.name}`, err);
            res.status(500).send({success:false,error:err});
        }
    });
});

router.delete('/delete/:id', function (req, res) {
    let id = parseInt(req.params['id']);
    let query = "DELETE FROM `alerts` WHERE `id`=?;";
    mysql.query(query, [id],function (err,payload) {
        if (!err){
            log.info(`Alert #${id} was deleted as requested by ${req.facebookVerification.name}`);
            res.send(payload);
        } else{
            log.crit(`Failed to delete alert as requested by ${req.facebookVerification.name}`, err);
            res.status(500).send({success:false,error:err});
        }
    });
});

module.exports = router;