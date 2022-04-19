"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Data = /** @class */ (function () {
    function Data(deviceId, sensor, isNight) {
        this.deviceId = deviceId;
        this.sensor = sensor;
        this.date = new Date();
        switch (this.sensor) {
            case "temperature":
                if (isNight) {
                    this.value = Math.floor(Math.random() * 6) + 8;
                }
                else {
                    this.value = Math.floor(Math.random() * 6) + 18;
                }
                break;
            case "humidity":
                if (isNight) {
                    this.value = Math.floor(Math.random() * 20) + 60;
                }
                else {
                    this.value = Math.floor(Math.random() * 20) + 40;
                }
                break;
            case "luminousFlux":
                if (isNight) {
                    this.value = Math.floor(Math.random() * 10) + 0;
                }
                else {
                    this.value = Math.floor(Math.random() * 700) + 0;
                }
                break;
            default:
                break;
        }
    }
    return Data;
}());
exports.Data = Data;
//# sourceMappingURL=Data.js.map