// IMPORTS
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("xss");

const app = express();

// CONFIG 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// DATABASE
mongoose.connect("mongodb://127.0.0.1:27017/shopeasy");

// SCHEMAS
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: { type: String, default: "user" }
});

const productSchema = new mongoose.Schema({
  name: String,
  price: Number
});

const reviewSchema = new mongoose.Schema({
  user: String,
  text: String
});

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Review = mongoose.model("Review", reviewSchema);

// SESSION (MongoStore) 
app.use(session({
  secret: "superSecretKey",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: "mongodb://127.0.0.1:27017/shopeasy",
    ttl: 60 * 60 // 1 hour
  }),
  cookie: {
    httpOnly: true,
    secure: false, // true in production
    maxAge: 60 * 60 * 1000
  }
}));

// HELMET 
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.youtube.com"],
      imgSrc: ["'self'", "https://cdn.example.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: ["https://www.youtube.com"],
      connectSrc: ["'self'", "https://payment-gateway.com"]
    }
  }
}));

// RATE LIMIT 
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts"
});
app.use("/login", loginLimiter);

// MIDDLEWARE
function isAuth(req, res, next) {
  if (!req.session.userId) return res.send("Login required");
  next();
}

function isAdmin(req, res, next) {
  if (req.session.role !== "admin") return res.send("Admin only");
  next();
}

//ROUTES

// REGISTER
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  await User.create({
    email,
    password: hashed
  });

  res.send("User registered");
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.send("User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send("Invalid credentials");

  req.session.userId = user._id;
  req.session.role = user.role;

  res.send("Login successful");
});

// ================== PRODUCT SEARCH (Injection Safe) ==================
app.get("/search", async (req, res) => {
  const query = req.query.q || "";

  // sanitize input
  const safeQuery = query.replace(/[^a-zA-Z0-9 ]/g, "");

  const products = await Product.find({
    name: { $regex: safeQuery, $options: "i" }
  });

  res.json(products);
});

//ADD PRODUCT (Validation)
app.post("/add-product", isAuth, isAdmin, async (req, res) => {
  const { name, price } = req.body;

  if (price < 0) {
    return res.send("Invalid price");
  }

  await Product.create({ name, price });
  res.send("Product added ");
});

//REVIEW (XSS SAFE)
app.post("/review", isAuth, async (req, res) => {
  const cleanReview = xss(req.body.review);

  await Review.create({
    user: req.session.userId,
    text: cleanReview
  });

  res.send("Review added safely ");
});

// ADMIN ROUTE 
app.get("/admin", isAuth, isAdmin, (req, res) => {
  res.send("Welcome Admin ");
});

//LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.send("Logged out");
});

// SERVER 
app.listen(3000, () => {
  console.log("Server running on port 3000 ");
});