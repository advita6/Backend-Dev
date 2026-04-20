const express = require('express');
const session = require('express-session');

const app = express();

app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 10000 } // 10 sec session
}));

app.get('/', (req, res) => {
    if (!req.session.startTime) {
        req.session.startTime = Date.now();
    }

    const remaining = req.session.cookie.maxAge;

    if (remaining < 5000) {
        res.send("Session going to expire!");
    } else {
        res.send("Session active");
    }
});

app.listen(3000, () => console.log("Server running"));