const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/testDB')
.then(() => console.log("MongoDB Connected"));

//Schema
const userSchema = new mongoose.Schema({
    username: String,
    loginTime: Date,
    logoutTime: Date,
    lastActive: Date
});

//Middleware
userSchema.pre('save', function (next) {
    if (!this.loginTime) {
        this.loginTime = new Date();
    }
    this.lastActive = new Date();
    next();
});

userSchema.pre('findOneAndUpdate', function (next) {
    this.set({ lastActive: new Date() });
    next();
});

const User = mongoose.model('User', userSchema);

//Routes
app.post('/login', async (req, res) => {
    const user = new User({ username: req.body.username });
    await user.save();

    res.send("User logged in");
});

app.post('/logout/:id', async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, {
        logoutTime: new Date()
    });

    res.send("User logged out");
});

app.put('/update/:id', async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, {
        username: req.body.username
    });

    res.send("User updated (lastActive updated automatically)");
});

app.listen(3000, () => console.log("Server running on port 3000"));