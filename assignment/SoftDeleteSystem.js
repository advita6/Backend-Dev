const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/testDB')
.then(() => console.log("MongoDB Connected"));


const itemSchema = new mongoose.Schema({
    name: String,
    isDeleted: {
        type: Boolean,
        default: false
    }
});

//Middleware to hide deleted data
itemSchema.pre(/^find/, function (next) {
    this.where({ isDeleted: false });
    next();
});

const Item = mongoose.model('Item', itemSchema);

//Routes
app.post('/item', async (req, res) => {
    const item = new Item({ name: req.body.name });
    await item.save();
    res.send(item);
});

app.get('/item', async (req, res) => {
    const items = await Item.find();
    res.send(items);
});

app.delete('/item/:id', async (req, res) => {
    await Item.findByIdAndUpdate(req.params.id, {
        isDeleted: true
    });

    res.send("Item soft deleted");
});

app.listen(3000, () => console.log("Server running on port 3000"));