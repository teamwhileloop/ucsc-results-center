// Logger Configurations
let log = require('perfect-logger');
const sysconfig = require('./modules/configurations');

log.setLogDirectory(sysconfig.logDirectory);
log.setLogFileName("ucscresultcenter");
log.setApplicationInfo({
    name: "UCSC Result Center",
    banner: "Copyright 2019 Team whileLOOP",
    version: "1.0"
});
log.addStatusCode("mail", "MAIL", false, '', true);
log.addStatusCode("crit_nodb", "CRIT", false, 'red');
log.addStatusCode("fbmsg", "FBMS", false, '', true);
log.addStatusCode("socket", "SOCK", false, '', true);
log.setMaximumLogSize(8000000);
log.setTimeZone("Asia/Colombo");
log.initialize();

//*************************************************************************************************

const port = process.env.PORT || 3000;
let credentials = require('./modules/credentials');
let postman = require('./modules/postman');

const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');
const socketIO = require('./index');
const bodyParser = require('body-parser');
const messenger = require('./modules/messenger');

function loggerCallback(data){
    if (data.code === 'WARN' || data.code === 'CRIT'){
        messenger.sendToEventSubscribers('system_warn_err_thrown', `Event Raised: ${data.code}\n${data.message}`);
    }
}

function logDatabaseCallback(data){
    return; //TODO: Implement
}

log.setCallback(loggerCallback);
log.setDatabaseCallback(logDatabaseCallback);

let privateKey;
let certificate;
let httpsCredentials;

// Global Variables
global.maintananceMode = {
    event: 'Server maintenance mode',
    status: false,
    message: 'System under maintenance',
    adminName: 'Administrator'
};

global.monitoring = {
    status: "Offline",
    lastPing: + new Date(),
    online: false,
    notResponding: false,
    forceScan: false
};

// Setup Logger
if (credentials.isDeployed){
    privateKey  = fs.readFileSync(credentials.ssl.key, 'utf8');
    certificate = fs.readFileSync(credentials.ssl.cert, 'utf8');
    httpsCredentials = {key: privateKey, cert: certificate};
}

privacyPolicy  = fs.readFileSync('privacy.txt', 'utf8');

// Setup Express
const http = require('http').Server(app);
const https = require('https').Server(httpsCredentials, app);
app.set('views', __dirname + '/');
app.engine('html', require('ejs').renderFile);
http.listen(port, function(){
    log.info('Server started and listening on PORT ' + port);
});
// Setup HTTPS
if (credentials.isDeployed){
    https.listen(443, function(){
        log.info('Server started and listening on PORT ' + 443);
    });
}

// Route Imports and Config
app.use(bodyParser.json());
const user = require('./routes/user');
const admin = require('./routes/admin/admin');
const apiV1 = require('./routes/api-v1');
const statistics = require('./routes/statistics');
const webhook = require('./routes/webhook/fb-webhook');
app.use('/user', user);
app.use('/admin', admin);
app.use('/v1.0', apiV1);
app.use('/statistics', statistics);
app.use('/webhook', webhook);

// Static Files
app.use('/public',express.static(path.join(__dirname, 'public')));
app.use('/cdn',express.static(path.join(__dirname, 'node_modules')));

// Routing
app.get('/', function(req, res) {
    // Redirect HTTPS traffic to HTTPS on production environment
    if (credentials.isDeployed && (!req.secure || req.headers.host !== 'www.ucscresult.com')){
        res.writeHead(302, {
            'Location': 'https://www.ucscresult.com'
        });
        res.end();
        return;
    }
    if (!global.maintananceMode.status){
        res.render('templates/web/index.html');
    }else {
        res.render('templates/web/maintenance.ejs', global.maintananceMode);
    }
});

app.get('/test', function(req, res) {
    res.render('templates/web/test.html');
});

app.get('/privacy', function(req, res) {
    res.send(privacyPolicy);
});

if (credentials.isDeployed){
    messenger.sendToEventSubscribers('system_restart',
        'Application Status Update:\n\nServer started: ' + new Date(),
        "APPLICATION_UPDATE");
}


module.exports = credentials.isDeployed ? https : http;