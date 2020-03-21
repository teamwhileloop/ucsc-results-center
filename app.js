// Logger Configurations
let log = require('perfect-logger');
let credentials = require('./modules/credentials');
const sysconfig = require('./modules/configurations');
let mysql = require('./modules/database');
const events = require('./modules/events');

log.setLogDirectory(sysconfig.logDirectory);
log.setLogFileName("ucscresultcenter-web");
if (!credentials.isDeployed){
    log.maintainSingleLogFile();
}
log.setApplicationInfo({
    name: "UCSC Results Center",
    banner: "Copyright 2019 Team whileLOOP",
    version: "1.0"
});
log.addStatusCode("mail", "MAIL", false, '', true);
log.addStatusCode("crit_nodb", "CRIT", false, 'red');
log.addStatusCode("fbmsg", "FBMS", false, '', true);
log.addStatusCode("socket", "SOCK", false, '', true);
log.setMaximumLogSize(500000);
log.setTimeZone("Asia/Colombo");
log.enableVirtualLogs();
log.initialize();

//*************************************************************************************************

const port = process.env.PORT || 3000;
let postman = require('./modules/postman');

const express = require('express');
const path = require('path');
const os = require('os');
const app = express();
const fs = require('fs');
const socketIO = require('./index');
const bodyParser = require('body-parser');
const messenger = require('./modules/messenger');


function loggerCallback(data = {}){
    if (data.code === 'WARN' || data.code === 'CRIT'){
        events.trigger('system_warn_err_thrown', data);
    }
}

function logDatabaseCallback(data){

    let dataJSON = "";
    if (data.details){
        log.writeData(data.details);
    }

    if (!mysql.connectedToDatabase)
        return;

    if (data.details && typeof data.details !== "string"){
        data.details.stackTrace = new Error().stack;
        dataJSON = JSON.stringify(data.details);

    }else{
        dataJSON = data.details || "";
    }
    dataJSON = dataJSON.substr(0, 2900);

    if (!credentials.isDeployed){
        return;
    }

    const query = "INSERT INTO `log` (`date`, `time`, `code`, `message`, `data`) VALUES (?, ?, ?, ?, ?);";
    mysql.ping(function (err) {
        if (err){
            log.writeData("No database connection for database callback");
            log.writeData(err);
        }else{
            mysql.query(query, [data.date, data.time, data.code, data.message, dataJSON], function (err, payload) {
                if (err){
                    log.crit_nodb("Failed to send log event to database");
                }
            })
        }
    });

}

log.setCallback(loggerCallback);
log.setDatabaseCallback(logDatabaseCallback);
// messenger.alertDeveloper(`Initializing UCSC Results Center Web Server: ${log.getLogFileName()}`);

let privateKey;
let certificate;
let httpsCredentials;
let certauth;
let apiSessionHits = 0;
let killLock = false;

// Global Variables
global.maintananceMode = {
    event: 'Server maintenance mode',
    status: false,
    message: 'System under maintenance',
    adminName: 'Administrator',
    activationCode: '',
    time: null
};

global.monitoring = {
    status: "Offline",
    lastPing: + new Date(),
    online: false,
    notResponding: false,
    forceScan: false
};


log.info(`Server initializing in ${credentials.isDeployed ? 'Production' : 'Development'} mode. Domain: ${sysconfig.domain}`);
log.debug(`Hostname: ${os.hostname()}`);

privacyPolicy  = fs.readFileSync('privacy.txt', 'utf8');

// Setup Express
const http = require('http').Server(app);
app.set('views', __dirname + '/');
app.engine('html', require('ejs').renderFile);
http.listen(port, function(){
    log.info('Server started and listening on PORT ' + port);
});

// Route Imports and Config
app.use(bodyParser.json());
app.use((req,res,next)=>{
    if (req.header('kill-lock') !== undefined && parseInt(req.header('kill-lock')) >= 0) {
        const tmpKillLock = parseInt(req.header('kill-lock')) === 1;
        if (tmpKillLock !== killLock) {
            killLock = tmpKillLock;
            log.debug(`Updating kill-lock to : ${killLock}`);
        }
    }
    else if (req.header('internal') === undefined){
        apiSessionHits += 1;
    }
    next();
});
const user = require('./routes/user');
const admin = require('./routes/admin/admin');
const apiV1 = require('./routes/api-v1');
const publicAPI = require('./routes/public');
const statistics = require('./routes/statistics');
const webhook = require('./routes/webhook/fb-webhook');
app.use('/user', user);
app.use('/admin', admin);
app.use('/v1.0', apiV1);
app.use('/v1.1', publicAPI);
app.use('/statistics', statistics);
app.use('/webhook', webhook);

// Static Files
app.use('/public',express.static(path.join(__dirname, 'public')));
app.use('/cdn',express.static(path.join(__dirname, 'node_modules')));

// Routing
app.get('/', function(req, res) {
    if (!global.maintananceMode.status){
        res.render('templates/web/index.html');
    }else {
        res.render('templates/web/maintenance.ejs', global.maintananceMode);
    }
});

app.get('/status', function(req, res) {
    const exec = require("child_process").exec;
    exec("pm2 status", (error, stdout, stderr) => {
        res.render('templates/web/pm2status.ejs', {status: stdout});
    })
});

app.get('/privacy', function(req, res) {
    res.send(privacyPolicy);
});

// Database disconnection endpoint for testing purposes
app.get('/disconnect', function (req, res) {
    if (!credentials.isDeployed){
        mysql.connectedToDatabase = false;
        mysql.end(function(err) {
            res.send(err || {});
        });
    }else{
        res.status(400).send("Cannot disconnect in production mode");
    }
});

app.get('/activate', function (req, res) {
    if (global.maintananceMode.status){
        res.render('templates/web/activation.html');
    }else{
        res.writeHead(302, {
            'Location': `https://${sysconfig.domain}/`
        });
        res.end();
    }
});

app.unlock('/activate/:code', function (req, res) {
    if (global.maintananceMode.status){
        if (global.maintananceMode.activationCode === req.params['code']){
            log.warn(`Server brought online via activation portal`);
            global.maintananceMode = {
                event: 'Server maintenance mode',
                status: false,
                time: Date().toLocaleString(),
                activationCode: ''
            };
            res.send({})
        }else {
            res.status(401).send({})
        }
    }else{
        res.status(400).send({});
    }
});


app.all('/*', function (req, res) {
    res.status(404).render('templates/web/not-found.html');
});


if (credentials.isDeployed || true){
    const interval = setInterval(function () {
        if (!mysql.connectedToDatabase)
            return;

        messenger.sendToEventSubscribers('system_restart',
            'Application Status Update:\n\nServer started: ' + new Date(),
            "APPLICATION_UPDATE");
        clearInterval(interval);
    }, 100);
}

if (process.env.SELF_TERMINATE)
{
    const timeout = parseInt(process.env.SELF_TERMINATE) * 1000 * 60;
    log.info(`Starting self termination timer: ${process.env.SELF_TERMINATE} min(s)`);
    setInterval(()=>{
        if (killLock) {
            log.debug('Avoiding self termination due to kill lock');
            apiSessionHits = 0;
            return;
        }

        if (apiSessionHits > 0)
        {
            log.debug(`Avoiding self termination due to user activity. ReqCount: ${apiSessionHits}`);
            apiSessionHits = 0;
            return;
        }

        log.info("Self terminating");
        const exec = require("child_process").exec;
        exec("shutdown -h now", (error, stdout, stderr) => {
            log.writeData(error || stdou || stderr);
        })

    }, timeout)
}



module.exports = http;
