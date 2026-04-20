const express = require('express');
const session = require('express-session');

const app = express();
app.use(express.json());

app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: true
}));

// Login
app.post('/login', (req, res) => {
    const { username } = req.body;

    
    req.session.user = {
        username,
        role: username === 'admin' ? 'admin' : 'user'
    };

    res.send("Logged in");
});

// Middleware
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).send("Access Denied");
    }
};

// Admin route
app.get('/admin', isAdmin, (req, res) => {
    res.send("Welcome Admin Panel");
});

app.listen(3000, () => console.log("Server running"));