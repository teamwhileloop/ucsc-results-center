const mysql = require('./database');
const logger = require('./logger');
const credentials = require('./credentials');

global.APIhits = 0;
global.users = 0;
global.records = 0;

exports.updateApiHits = function updateApiHits() {
    mysql.query('SELECT `value` from statistic WHERE `key`="apiHits"',function (err,payload) {
        if (!err){
            global.APIhits = parseInt(payload[0].value);
            logger.log("API hit counter initialized from " + global.APIhits);
        }else{
            logger.log("API hit retrieval failed." + JSON.stringify(err),'warn');
        }
    })
};


setInterval(function () {
    mysql.ping(function (err) {
        if (!err){
            if (credentials.isDeployed){
                mysql.query('UPDATE statistic SET `value`=? WHERE `key`="apiHits"',[global.APIhits],function (err,payload) {
                    if (err){
                        logger.log("API hit update failed." + JSON.decode(err),'warn');
                    }
                });
            }
            mysql.query('SELECT (SELECT COUNT(*) FROM `facebook`) as users, (SELECT COUNT(*) FROM `result`) as records;',function (err,payload) {
                if (!err){
                    global.users = payload[0].users;
                    global.records = payload[0].records;
                }else{
                    logger.log("API hit update failed." + JSON.decode(err),'warn');
                }
            });
        }
    });
}, 1000);