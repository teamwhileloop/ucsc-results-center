const mysql = require('./database');
const logger = require('./logger');

exports.updateApiHits = function updateApiHits() {
    mysql.query('SELECT `value` from statistic WHERE `key`="apiHits"',function (err,payload) {
        if (!err){
            global.APIhits = parseInt(payload[0].value);
            logger.log("API hit counter initialized from " + global.APIhits);
        }else{
            logger.log("API hit retrieval failed." + JSON.decode(err),'warn');
        }
    })
};


setInterval(function () {
    mysql.ping(function (err) {
        if (!err){
            mysql.query('UPDATE statistic SET `value`=? WHERE `key`="apiHits"',[global.APIhits],function (err,payload) {
                if (err){
                    logger.log("API hit update failed." + JSON.decode(err),'warn');
                }
            });
        }
    });
}, 60000);