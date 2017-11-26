// Environment variables
const port = process.env.PORT || 3000;

// Imports
let logger = require('./modules/logger');
let credentials = require('./modules/credentials');

const express = require('express');
const app = express();
const path = require('path');

// Setup Logger
if (!credentials.isDeployed){
    logger.disableDatabaseWrite();
}else {
    logger.enableDatabaseWrite();
}
logger.setStatusCodeLength(4);
logger.setStatusCodes({
    info : 'INFO',
    warn : 'WARN',
    crit : 'CRIT',
    log : 'LOG'
});
logger.setDefaultStatusCodeKey('info');

// Setup Express
app.set('views', __dirname + '/');
app.engine('html', require('ejs').renderFile);
app.listen(port, function(){
    logger.log('Server started and listening on PORT ' + port);
});

// Static Files
app.use('/',express.static(path.join(__dirname, 'public')));

// Routing
app.get('/', function(req, res) {
    res.render('index.html');
});
