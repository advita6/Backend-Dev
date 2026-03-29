const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/ex1DB')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

const studentRoutes = require('./routes/studentroutes');
app.use('/students', studentRoutes);

app.listen(3000, () => console.log('Server running on port 3000'));