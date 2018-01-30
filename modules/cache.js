const logger = require('./logger');

function initializeCache(){
    global.cache = {
        rank:{}
    };
}

initializeCache();

exports.reInitialize = function () {
    logger.log('Cache re-Initialized');
    initializeCache();
};

exports.cache = global.cache;

exports.clear = function (caches=['all'], pattern) {
    if (caches.indexOf('all') !== -1){
        logger.log('App cache completely cleared');
        initializeCache();
        return;
    }

    if (caches.indexOf('rank') !== -1){
        if (pattern !== undefined){
            logger.log('App cache RANK cleared for ' + pattern);
            delete global.cache.rank[pattern];
        }else{
            logger.log('App cache RANK completely cleared');
            global.cache.rank = {};
        }
    }

};