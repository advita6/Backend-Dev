const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const ACCESS_SECRET = 'access-secret';
const REFRESH_SECRET = 'refresh-secret';

// Dummy users (for testing)
const users = [
    { id: 1, username: "john", password: "1234" }
];

// Store refresh tokens
const refreshTokens = new Set();

//Generate Access Token (15 min)
function generateAccessToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username },
        ACCESS_SECRET,
        { expiresIn: '15m' }
    );
}

//Generate Refresh Token (7 days)
function generateRefreshToken(user) {
    const token = jwt.sign(
        { id: user.id, username: user.username },
        REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    refreshTokens.add(token); // store it
    return token;
}

//LOGIN
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
        accessToken,
        refreshToken
    });
});


app.post('/token/refresh', (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({ message: "Token required" });
    }

    if (!refreshTokens.has(token)) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }

    jwt.verify(token, REFRESH_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Token expired or invalid" });
        }

        const newAccessToken = generateAccessToken(user);

        res.json({ accessToken: newAccessToken });
    });
});

//LOGOUT
app.post('/logout', (req, res) => {
    const { token } = req.body;

    if (token && refreshTokens.has(token)) {
        refreshTokens.delete(token); // invalidate
    }

    res.json({ message: "Logged out successfully" });
});

//AUTH MIDDLEWARE
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Access token missing" });
    }

    jwt.verify(token, ACCESS_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }

        req.user = user;
        next();
    });
}

//PROTECTED ROUTE
app.get('/protected', authenticateToken, (req, res) => {
    res.json({
        message: "Protected data accessed",
        user: req.user
    });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});