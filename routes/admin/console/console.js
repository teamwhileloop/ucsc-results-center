const express = require('express');
const router = express.Router();
const _ = require('lodash');

const log = require('perfect-logger');

router.get('/',function (req,res) {
    let page = parseInt(req.query.page);
    let count = parseInt(req.query.count) || 20;
    let filter = req.query.filter;
    let logs = log.getVirtualConsoleLog();
    let paginatedResults = [];

    let result = _.filter(logs,function (o) {
        if (filter){
            return o.code.toLowerCase() === filter.toLowerCase();
        }else{
            return true;
        }
    });

    if (page){
        paginatedResults = result.slice((page -1)*count, ((page -1)*count) + count);
    }
    res.send({
        meta:{
            page: page,
            count: count,
            filter: filter || 'all',
            total: result.length,
            totalPages: Math.ceil(result.length / count)
        },
        data: page ? paginatedResults : result
    });
    log.debug(`Console log sent as requested by ${req.facebookVerification.name}`);
});

router.delete('/clear',function (req,res) {
    log.clearVirtualConsoleLog();
    res.send({});
    log.info(`Console logs cleared as requested by ${req.facebookVerification.name}`);
});

router.get('/generate/:count/:type',function (req,res) {
    if (['info', 'warn', 'crit'].indexOf(req.params['type']) === -1){
        res.status(400).send("Unknown type");
        return;
    }
    let count = parseInt(req.params['count']) || 0;
    _.forEach(_.range(count),function (n) {
        log[req.params['type']](`Dummy log with content ${Math.random().toString(36).substr(2, 6)}`, req.facebookVerification);
    });
    res.send({});
});

router.get('/download', function (req, res) {
    const allLogs = log.getAllLogFileNames();
    log.debug(`Web system log page(@${req.query.page || 'current'}) requested by ${req.facebookVerification.name}`);
    if (req.query.page){
        let logNumb = parseInt(req.query.page);
        if (logNumb > allLogs.length || logNumb < 1){
            res.set('total-pages', allLogs.length);
            res.set('cur-page', logNumb);
            res.status(404).send({})
        }else {
            res.set('total-pages', allLogs.length);
            res.set('cur-page', logNumb);
            res.download(allLogs[logNumb - 1]);
        }
    }else{
        res.download(log.getLogFileName());
        res.set('total-pages', allLogs.length);
        res.set('cur-page', allLogs.length);
    }
});

module.exports = router;