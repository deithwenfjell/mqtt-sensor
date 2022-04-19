"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var uuid_1 = require("uuid");
var Data_1 = require("./Data");
var process_1 = require("process");
var timers_1 = require("timers");
//TREBA: FR/FW, deň/noc cyklus!!! 
// globálne ID pre device
var defaultDeviceId; // ⇨ '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
// nastavenia
var intervalValue = 60000;
var logger = false;
var sendTimer;
//lifecycle 1h = 3600000ms, 1/2h = 1800000ms
var livecycleHalf = 1800000;
var lifecycleEnd = 3600000;
var isNight = false;
//generovanie dát
var dataList = new Array();
//zápis z a do súboru
var fs = require('fs');
fs.exists('logs/logfile.txt', function (exists) {
    if (exists) {
        console.log('Log file found.');
        fs.readFile('logs/logfile.txt', function readFileCallback(err, data) {
            if (err) {
                console.log(err);
            }
            else {
                var output = data.toString();
                console.log(output);
                console.log(output.slice(13, 49));
                defaultDeviceId = output.slice(13, 49);
            }
        });
    }
    else {
        console.log('Log file not found.');
        defaultDeviceId = uuid_1.v4();
    }
});
//pripojenie http localhost
var http = require('http');
var hostname = '127.0.0.1';
var port = 3000;
var server = http.createServer(function (req, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain'); //json možno
    res.end(JSON.stringify(dataList)); //data
});
server.listen(port, hostname, function () {
    console.log("Server running at http://" + hostname + ":" + port + "/");
});
//mqtt
var mqtt = require('mqtt');
var options = {
    username: 'kozel',
    password: 'fallout'
};
var client = mqtt.connect('mqtt://167.71.34.148/', options);
client.on('connect', function () {
    client.subscribe('dataTransfer', function (err) {
        if (!err) {
            console.log("MQTT INFO: Data transfer connection successfully established.");
            sendTimer = setInterval(generateData, intervalValue); //interval generovania a posielania dát
            //dobehnutie programu
            setTimeout(function () {
                timers_1.clearInterval(sendTimer);
                saveGeneratedDataToFile();
                setTimeout(function () {
                    console.log("Program execution ended successfully!");
                    process_1.exit();
                }, 5000);
            }, lifecycleEnd);
            //prepnutie nočného režimu
            setTimeout(function () {
                isNight = true;
                console.log("Switched to night cycle.");
            }, livecycleHalf);
        }
    });
    client.subscribe('settings/function', function (err) {
        if (!err) {
            console.log("MQTT INFO: settings/function connection successfully established.");
        }
    });
    client.subscribe('settings/interval', function (err) {
        if (!err) {
            console.log("MQTT INFO: settings/interval connection successfully established.");
        }
    });
});
client.on('message', function (topic, message) {
    switch (topic) {
        case 'dataTransfer':
            console.log(message.toString());
            break;
        case 'settings/function':
            console.log(message.toString());
            var func = JSON.parse(message);
            if (func.functionName == 'shutdown') {
                console.log("Shutting down.");
                timers_1.clearInterval(sendTimer);
                saveGeneratedDataToFile();
                setTimeout(function () {
                    console.log("Program execution ended successfully!");
                    process_1.exit();
                }, 5000);
            }
            if (func.functionName == 'logger') {
                setLogger(func);
            }
            break;
        case 'settings/interval':
            console.log(message.toString());
            var inter = JSON.parse(message);
            intervalValue = +inter.timeInterval;
            console.log("Time interval set to: ", intervalValue);
            generateData();
            timers_1.clearInterval(sendTimer);
            sendTimer = setInterval(generateData, intervalValue);
            break;
        default:
            break;
    }
});
function saveGeneratedDataToFile() {
    return new Promise(function (resolve, reject) {
        console.log(JSON.stringify(dataList));
        dataList.forEach(function (json) {
            var str = JSON.stringify(json);
            fs.appendFile('logs/logfile.txt', str + "\n", function (err) {
                if (err) {
                    console.log(err);
                }
            });
        });
    });
}
function setLogger(func) {
    if (func.enable == "true") {
        logger = true;
    }
    else {
        logger = false;
    }
    console.log("Logger function set to: ", logger);
}
function generateData() {
    var temperatureData, humidityData, luminousFluxData;
    temperatureData = new Data_1.Data(defaultDeviceId, "temperature", isNight);
    humidityData = new Data_1.Data(defaultDeviceId, "humidity", isNight);
    luminousFluxData = new Data_1.Data(defaultDeviceId, "luminousFlux", isNight);
    client.publish('dataTransfer', JSON.stringify(temperatureData));
    dataList.push(temperatureData);
    client.publish('dataTransfer', JSON.stringify(humidityData));
    dataList.push(humidityData);
    client.publish('dataTransfer', JSON.stringify(luminousFluxData));
    dataList.push(luminousFluxData);
    if (logger == true) {
        console.log('Temperature ->', temperatureData.value, '\t Refreshed at ->', temperatureData.date);
        console.log('Humidity ->', humidityData.value, '\t \t Refreshed at ->', humidityData.date);
        console.log('Luminous Flux ->', luminousFluxData.value, '\t Refreshed at ->', luminousFluxData.date);
        console.log();
    }
}
//# sourceMappingURL=app.js.map