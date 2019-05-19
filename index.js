const http = require('./app');
const io = require('socket.io')(http);
const log = require('perfect-logger');

let onlineUsers = {};
let dailyUsers = [];
let today = -1;

io.on('connection', function(socket){
    socket.on('usr-auth', function (data) {
        onlineUsers[socket.id] = data.name;
        log.socket("User " + data.name + " connected from " +  socket.handshake.address);

        if (dailyUsers.indexOf(data.name) === -1) {
            dailyUsers.push(data.name);
        }
    });

    socket.on('disconnect', function () {
        if (onlineUsers[socket.id] !== undefined){
            log.socket("User " + onlineUsers[socket.id] + " disconnected");
        }
        delete onlineUsers[socket.id];
    });
});

setInterval(function () {
    let uniqueUsers =  Object.values(onlineUsers).filter(function (value, index, array) {
        return array.indexOf(value) === index;
    });

    let curTime = + new Date();
    let todayDate = new Date().getDate();
    if (todayDate !== today)
    {
        log.debug("Resetting statistics for new day. " + new Date().toUTCString() + " -> " + dailyUsers.length);
        today = todayDate;
        dailyUsers = [];
    }
    if ((curTime - global.monitoring.lastPing) > 100*1000){
        if (global.monitoring.online){
            global.monitoring.online = false;
            log.warn("Monitoring client went offline.", global.monitoring);
        }
        global.monitoring.status = "Offline [" + new Date(global.monitoring.lastPing).toLocaleString('en-US', { timeZone: 'Asia/Colombo' }) + ']';
    }else if((curTime - global.monitoring.lastPing) > 30*1000){
        if (global.monitoring.online && !global.monitoring.notResponding){
            log.warn("Monitoring client is not responding. Last known status: " + global.monitoring.status, global.monitoring);
            global.monitoring.notResponding = true;
        }
        global.monitoring.status = "Not Responding";
    }

    io.emit('statistics',{
        hits: global.APIhits,
        users: global.users,
        dailyUsersCount: dailyUsers.length,
        records: global.records,
        online: uniqueUsers.length,
        onlineUsers: uniqueUsers,
        monitoring: global.monitoring
    });
}, 1000);
