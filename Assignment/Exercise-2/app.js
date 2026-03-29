const express = require('express');
const mongoose = require('mongoose');
const Student = require('./models/student');

const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/ex2DB')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

app.use(express.json());

// 1. GPA between 3.0 and 3.5
app.get('/gpa-range', async (req, res) => {
    const data = await Student.find({ gpa: { $gte: 3.0, $lte: 3.5 } });
    res.json(data);
});

// 2. >5 courses
app.get('/more-than-5-courses', async (req, res) => {
    const data = await Student.find({
        $expr: { $gt: [{ $size: "$courses" }, 5] }
    });
    res.json(data);
});

// 3. Top 10
app.get('/top-10', async (req, res) => {
    const data = await Student.find().sort({ gpa: -1 }).limit(10);
    res.json(data);
});

// 4. Count by city
app.get('/count-by-city', async (req, res) => {
    const data = await Student.aggregate([
        { $group: { _id: "$city", count: { $sum: 1 } } }
    ]);
    res.json(data);
});

app.listen(3001, () => console.log('Server running on port 3001'));