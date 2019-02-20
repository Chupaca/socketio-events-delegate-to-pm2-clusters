'use strict'

const express = require("express")
const http = require("http")
const app = express()
app.set('port', (process.env.PORT || 3000));
const server = http.createServer(app)
const socketio = require("./sockets")

/* 
    For start need use in terminal : pm2 start process.yml
    in logs you'll see results sockets updates
*/


socketio.BuildSocketsConnection(server)
server.listen(app.get('port'), () => {
    console.log('Express server listening on port ' + 1333);
});

function sendSocketTest(){
    if(process.env.pm_id == 0){
        return socketio.SendEvent('test', 'test', 'test')
    }
}
setTimeout(()=> sendSocketTest() ,5000)



process.on('uncaughtException', function (error) {
    if (!error) {
        console.error("UncaughtException reject of null!");
    } 
    else if (error.stack) {
        console.error(error.stack);
    }
    else {
        console.error(error);
    }
});

process.on('unhandledRejection', function (reason) {
    if (!reason) {
        console.error("UnhandledRejection reject of null!");
    }else if (reason.stack) {
        console.error(reason.stack);
    }
    else {
        console.error(reason);
    }
});