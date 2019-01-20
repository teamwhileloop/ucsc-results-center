const log = require('perfect-logger');
const system = require('./modules/system');
const sysconfig = require('../modules/configurations');

// let memoryData = new Array(17280*5);
// let cpuData = new Array(17280*5);

log.setLogDirectory(sysconfig.logDirectory);
log.setLogFileName("stat-daemon");

log.setApplicationInfo({
    name: "System Stat Daemon",
    banner: "Copyright 2019 Team whileLOOP",
    version: "1.0"
});
log.addStatusCode("stat", "STAT", false, '', true);
log.maintainSingleLogFile();
log.setMaximumLogSize(500000);
log.setTimeZone("Asia/Colombo");
log.initialize();


const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 8080;

const http = require('http').Server(app);
app.set('views', __dirname + '/');
app.engine('html', require('ejs').renderFile);
http.listen(port, function(){
    log.info(`System Stat Daemon Started on port ${port}`);
});

app.use(bodyParser.json());

// Static Files
app.use('/public',express.static(path.join(__dirname, '../public')));
app.use('/cdn',express.static(path.join(__dirname, '../node_modules')));

app.get('/', function(req, res) {
    res.render('../templates/web/ssd-index.html');
});

const io = require('socket.io')(http);

setInterval(function () {
    let statObject = {
        cpu: { load: system.getCpuUtilization()},
        memory: system.getMemory()
    };
    // memoryData.shift();
    // memoryData.push(statObject.memory);
    //
    // cpuData.shift();
    // cpuData.push(statObject.cpu.load);

    system.getAppData()
        .then((data)=>{
            statObject.appData = data;
            // console.log(`CPU: ${statObject.cpu.load}`);
            // console.log(`Memory: ${statObject.memory.perc}`);
            log.writeData(statObject.memory);
            log.writeData(statObject.cpu);

            io.emit('stat-daemon-data', statObject);
        });
}, 1000);