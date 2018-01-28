const http = require('./app');
const io = require('socket.io')(http);

io.on('connection', function(socket){
    // console.log('a user connected');
});

setInterval(function () {
    io.emit('statistics',{
        hits: global.APIhits,
        users: global.users,
        records: global.records,
        online: io.engine.clientsCount
    });
}, 1000);