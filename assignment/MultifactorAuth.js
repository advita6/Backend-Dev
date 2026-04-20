const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

//Dummy OTP 
const otpStore = {
    "ananya": "123456"
};

//MFA Middleware
const verifyMFA = (req, res, next) => {
    const token = req.headers['authorization'];
    const otp = req.headers['otp'];

    if (!token) return res.status(401).send("Token missing");

    try {
        const decoded = jwt.verify(token, "secretKey");

        const validOtp = otpStore[decoded.username];

        if (!otp || otp !== validOtp) {
            return res.status(403).send("Invalid OTP");
        }

        req.user = decoded;
        next();

    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
};

//Login Route
app.post('/login', (req, res) => {
    const { username } = req.body;

    const token = jwt.sign({ username }, "secretKey");

    res.json({
        token,
        otp: "123456" // demo OTP
    });
});

//Protected Route
app.get('/secure', verifyMFA, (req, res) => {
    res.send("Secure Data Accessed");
});

app.listen(3000, () => console.log("Server running on port 3000"));