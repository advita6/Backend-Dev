const getSystemInfo = require("./systemInfo");
const logData = require("./logger");

console.log("System Monitor started...");

setInterval(() => {
    const systemInfo = getSystemInfo();
    logData(systemInfo);
}, 5000);
