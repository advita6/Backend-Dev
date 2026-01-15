const os = require("os");

function getSystemInfo() {
    return {
        cpuCount: os.cpus().length,
        freeMemoryMB: (os.freemem() / 1024 / 1024).toFixed(2),
        totalMemoryMB: (os.totalmem() / 1024 / 1024).toFixed(2),
        platform: os.platform(),
        timestamp: new Date().toISOString()
    };
}

module.exports = getSystemInfo;
