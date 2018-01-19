// Environment variables
const port = process.env.PORT || 3000;

// Imports
let logger = require('./modules/logger');
let credentials = require('./modules/credentials');
let postman = require('./modules/postman');

const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');
const socketIO = require('./index');
const bodyParser = require('body-parser');

let privateKey;
let certificate;
let httpsCredentials;

// Setup Logger
if (!credentials.isDeployed){
    logger.disableDatabaseWrite();
}else {
    logger.enableDatabaseWrite();
    privateKey  = fs.readFileSync('/etc/letsencrypt/live/ucscresult.com/privkey.pem', 'utf8');
    certificate = fs.readFileSync('/etc/letsencrypt/live/ucscresult.com/fullchain.pem', 'utf8');
    httpsCredentials = {key: privateKey, cert: certificate};
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
const http = require('http').Server(app);
const https = require('https').Server(httpsCredentials, app);
app.set('views', __dirname + '/');
app.engine('html', require('ejs').renderFile);
http.listen(port, function(){
    logger.log('Server started and listening on PORT ' + port);
});
// Setup HTTPS
if (credentials.isDeployed){
    https.listen(443, function(){
        logger.log('Server started and listening on PORT ' + 443);
    });
}

// Route Imports and Config
app.use(bodyParser.json());
const user = require('./routes/user');
const admin = require('./routes/admin/admin');
const apiV1 = require('./routes/api-v1');
app.use('/user', user);
app.use('/admin', admin);
app.use('/v1.0', apiV1);

// Static Files
app.use('/public',express.static(path.join(__dirname, 'public')));
app.use('/cdn',express.static(path.join(__dirname, 'node_modules')));

// Routing
app.get('/', function(req, res) {
    // Redirect HTTPS traffic to HTTPS on production environment
    if (credentials.isDeployed && !req.secure){
        res.writeHead(302, {
            'Location': 'https://www.ucscresult.com'
        });
        res.end();
        return;
    }
    res.render('index.html');
});

module.exports = credentials.isDeployed ? https : http;