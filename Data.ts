export class Data {
    deviceId: string;
    sensor: string;
    value: number;
    date: Date

    constructor(deviceId: string, sensor: string, isNight: boolean) {
        this.deviceId = deviceId;
        this.sensor = sensor;
        this.date = new Date();

        switch (this.sensor) {
            case "temperature":
                if (isNight) {
                    this.value = Math.floor(Math.random() * 6) + 8;
                } else {
                    this.value = Math.floor(Math.random() * 6) + 18;
                }
                break;

            case "humidity":
                if (isNight) {
                    this.value = Math.floor(Math.random() * 20) +60;
                } else {
                    this.value = Math.floor(Math.random() * 20) +40;
                }
                break;

            case "luminousFlux":
                if (isNight) {
                    this.value = Math.floor(Math.random() * 10) +0;
                } else {
                    this.value = Math.floor(Math.random() * 700) +0;
                }
                break;

            default:
                break;
        }

    }
    
    // refreshData(data: Data, interval: number) {
    //     let i: number = 0;
    //     setInterval( () => data = new Data(this.deviceId, "teplota", 10), interval);
    //     console.log('Refreshed.', i++);
    // }

    // generateData(): Data {
    //     console.log("Data generated!")
    //     return this.constructor();
    // }
    

      


}

