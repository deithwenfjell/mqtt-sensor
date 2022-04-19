import { v4 as uuidv4 } from 'uuid';
import { Data } from './Data';
import { Interval } from './settings/Interval';
import { Function } from './settings/Function';
import { exit } from 'process';
import { clearInterval } from 'timers';

//TREBA: FR/FW, deň/noc cyklus!!! 

// globálne ID pre device
var defaultDeviceId: string; // ⇨ '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'

// nastavenia
var intervalValue: number = 60000;
var logger: boolean = false;
var sendTimer: NodeJS.Timeout;

//lifecycle 1h = 3600000ms, 1/2h = 1800000ms
var livecycleHalf: number = 1800000;
var lifecycleEnd: number = 3600000;
var isNight: boolean = false;

//generovanie dát
let dataList = new Array<Data>();

//zápis z a do súboru
var fs = require('fs');
fs.exists('logs/logfile.txt', (exists) => {
  if (exists) {
    console.log('Log file found.');
    fs.readFile('logs/logfile.txt', function readFileCallback(err, data) {
      if (err) {
        console.log(err);
      } else {
        let output: string = data.toString();
        console.log(output);
        console.log(output.slice(13, 49));
        defaultDeviceId = output.slice(13, 49);
      }
    });

  } else {
    console.log('Log file not found.');
    defaultDeviceId = uuidv4();
  }
});

//pripojenie http localhost
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain'); //json možno
  res.end(JSON.stringify(dataList)); //data
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

//mqtt
const mqtt = require('mqtt');
var options = {
  username: 'kozel',
  password: 'fallout' 
}
const client = mqtt.connect('mqtt://167.71.34.148/', options);

client.on('connect', () => {
  client.subscribe('dataTransfer', (err) => {
    if (!err) {
      console.log("MQTT INFO: Data transfer connection successfully established.");
      sendTimer = setInterval(generateData, intervalValue); //interval generovania a posielania dát

      //dobehnutie programu
      setTimeout(() => {
        clearInterval(sendTimer);
        saveGeneratedDataToFile();
        setTimeout(() => {
          console.log("Program execution ended successfully!");
          exit();
        }, 5000);
      }, lifecycleEnd);

      //prepnutie nočného režimu
      setTimeout(() => {
        isNight = true;
        console.log("Switched to night cycle.");
      }, livecycleHalf);
    }
  });

  client.subscribe('settings/function', (err) => {
    if (!err) {
      console.log("MQTT INFO: settings/function connection successfully established.");
    }
  });

  client.subscribe('settings/interval', (err) => {
    if (!err) {
      console.log("MQTT INFO: settings/interval connection successfully established.");
    }
  });
});

client.on('message', (topic, message) => {
  switch (topic) {

    case 'dataTransfer':
      console.log(message.toString());
      break;

    case 'settings/function':
      console.log(message.toString());
      let func: Function = JSON.parse(message);

      if (func.functionName == 'shutdown') {
        console.log("Shutting down.");
        clearInterval(sendTimer);
        saveGeneratedDataToFile();
        setTimeout(() => {
          console.log("Program execution ended successfully!");
          exit();
        }, 5000);
        
      }
      if (func.functionName == 'logger') {
        setLogger(func);
      }
      break;

    case 'settings/interval':
      console.log(message.toString());
      let inter: Interval = JSON.parse(message);
      intervalValue = +inter.timeInterval;
      console.log("Time interval set to: ", intervalValue);

      generateData();
      clearInterval(sendTimer);
      sendTimer = setInterval(generateData, intervalValue);

      break;

    default:
      break;
  }

});



function saveGeneratedDataToFile() {
  return new Promise<any>((resolve, reject) => {
    console.log(JSON.stringify(dataList));
    dataList.forEach((json) => {
      let str: string = JSON.stringify(json);
      fs.appendFile('logs/logfile.txt', `${str}\n`, (err) => {
        if (err) {
          console.log(err);
        }
      });
    });
  });
  
}

function setLogger(func: Function) {
  if (func.enable == "true") {
    logger = true;
  }
  else {
    logger = false;
  }
  console.log("Logger function set to: ", logger);
}

function generateData() {
  let temperatureData: Data, humidityData: Data, luminousFluxData: Data;
    temperatureData = new Data(defaultDeviceId, "temperature", isNight);
    humidityData = new Data(defaultDeviceId, "humidity", isNight);
    luminousFluxData = new Data(defaultDeviceId, "luminousFlux", isNight);

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
