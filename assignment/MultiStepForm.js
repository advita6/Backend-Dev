const express = require('express');
const session = require('express-session');

const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: true
}));

// Step 1
app.get('/step1', (req, res) => {
    res.send('<form method="POST"><input name="name"/><button>Next</button></form>');
});

app.post('/step1', (req, res) => {
    req.session.name = req.body.name;
    res.redirect('/step2');
});

// Step 2
app.get('/step2', (req, res) => {
    res.send('<form method="POST"><input name="email"/><button>Next</button></form>');
});

app.post('/step2', (req, res) => {
    req.session.email = req.body.email;
    res.redirect('/result');
});

// Final
app.get('/result', (req, res) => {
    res.send(`Name: ${req.session.name}, Email: ${req.session.email}`);
});

app.listen(3000, () => console.log("Server running"));