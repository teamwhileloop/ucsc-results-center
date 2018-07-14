const http = require('./app');
const io = require('socket.io')(http);

let onlineUsers = {};

io.on('connection', function(socket){
    socket.on('usr-auth', function (data) {
        onlineUsers[socket.id] = data.name;
    });

    socket.on('disconnect', function () {
        delete onlineUsers[socket.id];
    });
});

setInterval(function () {
    let uniqueUsers =  Object.values(onlineUsers).filter(function (value, index, array) {
        return array.indexOf(value) === index;
    });

    io.emit('statistics',{
        hits: global.APIhits,
        users: global.users,
        records: global.records,
        online: uniqueUsers.length,
        onlineUsers: uniqueUsers
    });
}, 1000);