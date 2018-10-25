const http = require('./app');
const io = require('socket.io')(http);
let logger = require('./modules/logger');

let onlineUsers = {};

io.on('connection', function(socket){
    socket.on('usr-auth', function (data) {
        onlineUsers[socket.id] = data.name;
        //logger.log("User " + data.name + " connected from " +  socket.handshake.address);
    });

    socket.on('disconnect', function () {
        delete onlineUsers[socket.id];
    });
});

setInterval(function () {
    let uniqueUsers =  Object.values(onlineUsers).filter(function (value, index, array) {
        return array.indexOf(value) === index;
    });

    let curTime = + new Date();
    if ((curTime - global.monitoring.lastPing) > 25*1000){
        if (global.monitoring.online){
            logger.log("Monitoring client went offline.", 'warn', true);
            global.monitoring.online = false;
        }
        global.monitoring.status = "Offline [" + new Date(global.monitoring.lastPing).toLocaleString('en-US', { timeZone: 'Asia/Colombo' }) + ']';
    }else if((curTime - global.monitoring.lastPing) > 15*1000){
        global.monitoring.status = "Not Responding";
        if (!global.monitoring.notResponding){
            logger.log("Monitoring client is not responding", 'warn', true);
            global.monitoring.notResponding = true;
        }
    }

    io.emit('statistics',{
        hits: global.APIhits,
        users: global.users,
        records: global.records,
        online: uniqueUsers.length,
        onlineUsers: uniqueUsers,
        monitoring: global.monitoring
    });
}, 1000);
