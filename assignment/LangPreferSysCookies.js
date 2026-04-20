const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());

// Set language
app.get('/set-lang/:lang', (req, res) => {
    res.cookie('lang', req.params.lang, { maxAge: 900000 });
    res.send("Language set");
});

// Get language
app.get('/', (req, res) => {
    const lang = req.cookies.lang || 'en';

    if (lang === 'hi') {
        res.send("नमस्ते");
    } else {
        res.send("Hello");
    }
});

app.listen(3000, () => console.log("Server running"));