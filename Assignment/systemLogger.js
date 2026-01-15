const os = require("os");
const fs = require("fs");

setInterval(() => {
    const info = `
Time: ${new Date().toLocaleString()}
Platform: ${os.platform()}
CPU Cores: ${os.cpus().length}
Free Memory: ${(os.freemem() / 1024 / 1024).toFixed(2)} MB
-------------------------
`;

    fs.appendFile("system.log", info, (err) => {
        if (err) console.error(err);
    });
}, 5000);
