const express = require('express');
const session = require('express-session');

const app = express();
app.use(express.json());

// ✅ Session setup
app.use(session({
    secret: 'cart-secret',
    resave: false,
    saveUninitialized: false
}));

// ✅ Initialize Cart Middleware
const initCart = (req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = []; // cart = array of items
    }
    next();
};

app.use(initCart);

//Add 
app.post('/cart/add', (req, res) => {
    const { productId, name, price, quantity } = req.body;

    if (!productId || !name || !price || !quantity) {
        return res.status(400).json({ message: "All fields required" });
    }

    // Check if item already exists
    const existingItem = req.session.cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        req.session.cart.push({ productId, name, price, quantity });
    }

    res.json({ message: "Item added to cart", cart: req.session.cart });
});

//Update 
app.put('/cart/update/:productId', (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    const item = req.session.cart.find(i => i.productId === productId);

    if (!item) {
        return res.status(404).json({ message: "Item not found" });
    }

    item.quantity = quantity;

    res.json({ message: "Quantity updated", cart: req.session.cart });
});

//Remove
app.delete('/cart/remove/:productId', (req, res) => {
    const { productId } = req.params;

    req.session.cart = req.session.cart.filter(item => item.productId !== productId);

    res.json({ message: "Item removed", cart: req.session.cart });
});

//Get Cart + Total Price
app.get('/cart', (req, res) => {
    const cart = req.session.cart;

    const total = cart.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);

    res.json({
        cart,
        totalPrice: total
    });
});

//Clear Cart
app.delete('/cart/clear', (req, res) => {
    req.session.cart = [];
    res.json({ message: "Cart cleared" });
});

// Start server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});