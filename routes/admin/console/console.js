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
            return o.statusCode.toLowerCase() === filter.toLowerCase();
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
});

router.delete('/clear',function (req,res) {
    log.clearVirtualConsoleLog();
    res.send({});
});

router.get('/generate/:count',function (req,res) {
    let count = parseInt(req.params['count']) || 0;
    _.forEach(_.range(count),function (n) {
        log.info(`Dummy log with content ${Math.random().toString(36).substr(2, 6)}`);
    });
    res.send({});
});

module.exports = router;