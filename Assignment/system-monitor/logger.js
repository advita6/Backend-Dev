const fs = require("fs");
const path = require("path");

const logFilePath = path.join(__dirname, "system-log.txt");

function logData(data) {
    const logEntry = `
Time: ${data.timestamp}
Platform: ${data.platform}
CPU Cores: ${data.cpuCount}
Free Memory: ${data.freeMemoryMB} MB
Total Memory: ${data.totalMemoryMB} MB
-----------------------------
`;

    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) console.error("Log error:", err);
    });
}

module.exports = logData;
