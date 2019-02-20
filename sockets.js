'use strict'

const ioRequire = require('socket.io')
var pm2 = require('pm2');
let socketio;
let namespaces = {}



const BuildSocketsConnection = (server) => {
    socketio = ioRequire(server, { transports: ['websocket', 'polling', 'long-polling'] });
    namespaces["test"] = socketio.of('/test');
}

const SendEvent = (namespace, event, emmetLoad, fromOtherProcess) => {
    console.log("cluster - " + process.env.pm_id)
    if (!fromOtherProcess && process.env.pm_id) {
        sendToOtherPm2Clusters(process.env.pm_id, process.env.name, namespace, event, emmetLoad)
    }
    if (namespaces[namespace]) {
        console.log("update socket cluster - " + process.env.pm_id)
        namespaces[namespace].emit(event, emmetLoad);
    }
    return true;
}

async function sendToOtherPm2Clusters(id, processName, namespace, event, emmetLoad) {
    try {
        const processIds = await getListRunningProcess(id, processName)
        const result = await Promise.all(processIds.map(id => sendUpdateToRunningProcesses(id, namespace, event, emmetLoad)))
        return true;
    } catch (err) {
        console.log("Error :" + err)
        return false;
    }


}

async function sendUpdateToRunningProcesses(id, namespace, event, emmetLoad) {
    console.log("Message to cluster - " + id + " departure!" )
    return await pm2.connect(() => {
        pm2.sendDataToProcessId({
            type: 'process:msg',
            data: {
                namespace: namespace,
                event: event,
                emmetLoad: emmetLoad
            },
            topic: process.env,
            id: Number(id)
        }, (err, res) => {
            if (err) {
                console.error(err)
                return Promise.reject(err)
            } else {
                return Promise.resolve(true)
            }
        });
    })
}

process.on('message', packet => {
    console.log("Message to cluster - " + process.env.pm_id + " arrive!" )
    SendEvent(packet.data.namespace, packet.data.event, packet.data.emmetLoad, true)
    process.send({
        type: 'process:msg',
        data: {
            success: true
        }
    });
    return true;
});

function getListRunningProcess(id, processName) {
    return new Promise((resolve, reject) => {
        pm2.list((err, list) => {
            if (err) {
                console.error("Error : " + err)
                reject(err)
            } else {
                resolve((list.filter(proc => proc.name == processName && proc.pm_id != id).map(item => item.pm_id)))
            }
        })
    })
}


module.exports = {
    BuildSocketsConnection,
    SendEvent
}