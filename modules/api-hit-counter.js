const mysql = require('./database');
const log = require('perfect-logger');
const credentials = require('./credentials');

global.APIhits = 0;
global.users = 0;
global.records = 0;

exports.updateApiHits = function updateApiHits() {
    mysql.query('SELECT `value` from statistic WHERE `key`="apiHits"',function (err,payload) {
        if (!err){
            global.APIhits = parseInt(payload[0].value);
            log.info("API hit counter initialized from " + global.APIhits);
        }else{
            log.warn("API hit retrieval failed.", err);
        }
    })
};


setInterval(function () {
    mysql.ping(function (err) {
        if (!err){
            if (credentials.isDeployed){
                mysql.query('UPDATE statistic SET `value`=? WHERE `key`="apiHits"',[global.APIhits],function (err,payload) {
                    if (err){
                        log.warn("API hit update failed.", err);
                    }
                });
            }
            mysql.query('SELECT (SELECT COUNT(*) FROM `facebook`) as users, (SELECT COUNT(*) FROM `result`) as records;',function (err,payload) {
                if (!err){
                    global.users = payload[0].users;
                    global.records = payload[0].records;
                }else{
                    log.warn("API hit update failed." , err);
                }
            });
        }
    });
}, 1000);