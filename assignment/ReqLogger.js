const express = require('express');
const fs = require('fs');

const app = express();
const PORT = 3000;

//Middleware 
app.use((req, res, next) => {
    const start = Date.now(); // start time

    // response is finished
    res.on('finish', () => {
        const end = Date.now();
        const responseTime = end - start;

        const log = `${new Date().toISOString()} | ${req.method} | ${req.url} | ${res.statusCode} | ${responseTime}ms\n`;

        // Append log to file
        fs.appendFile('logs.txt', log, (err) => {
            if (err) console.error("Error writing log:", err);
        });
    });

    next();
});

//routes
app.get('/', (req, res) => {
    res.send("Home Page");
});

app.get('/about', (req, res) => {
    res.send("About Page");
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});