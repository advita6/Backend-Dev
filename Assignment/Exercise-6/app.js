const express = require('express');
const mongoose = require('mongoose');
const Book = require('./models/Book');

const app = express();
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/libraryDB')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// 1. Add new book
app.post('/books', async (req, res) => {
    const book = await Book.create(req.body);
    res.json(book);
});

// 2. Find books by author
app.get('/books/author/:author', async (req, res) => {
    const books = await Book.find({ author: req.params.author });
    res.json(books);
});

// 3. Update book availability
app.put('/books/:id', async (req, res) => {
    const book = await Book.findByIdAndUpdate(
        req.params.id,
        { available: req.body.available },
        { new: true }
    );
    res.json(book);
});

app.listen(3002, () => console.log('Server running on port 3002'));