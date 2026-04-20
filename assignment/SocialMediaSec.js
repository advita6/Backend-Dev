const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const helmet = require("helmet");
const xss = require("xss");
const validator = require("validator");
const cors = require("cors");

const app = express();
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/connecthub");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  bio: String,
  profilePic: String
});

const postSchema = new mongoose.Schema({
  userId: String,
  content: String
});

const messageSchema = new mongoose.Schema({
  from: String,
  to: String,
  text: String
});

const User = mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);
const Message = mongoose.model("Message", messageSchema);

app.use(session({
  secret: "connecthub_secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: "mongodb://127.0.0.1:27017/connecthub",
    ttl: 60 * 30
  }),
  cookie: {
    httpOnly: true,
    maxAge: 30 * 60 * 1000
  }
}));

app.use(helmet());

app.use(cors({
  origin: ["http://localhost:3000", "https://myapp.com"],
  credentials: true
}));

function sanitizePost(content) {
  return xss(content, {
    whiteList: {
      b: [],
      i: [],
      a: ["href"]
    }
  });
}

function cleanInput(input) {
  return xss(input.trim());
}

function isValidURL(url) {
  return validator.isURL(url, { protocols: ["http", "https"], require_protocol: true });
}

function validateAndSanitize(req, res, next) {
  for (let key in req.body) {
    if (typeof req.body[key] === "string") {
      req.body[key] = cleanInput(req.body[key]);
    }
  }
  next();
}

app.use(validateAndSanitize);

function isAuth(req, res, next) {
  if (!req.session.userId) return res.send("Login required");
  next();
}

app.post("/register", async (req, res) => {
  let { username, email, password, bio, profilePic } = req.body;

  if (!validator.isEmail(email)) {
    return res.send("Invalid email");
  }

  if (profilePic && !isValidURL(profilePic)) {
    return res.send("Invalid profile picture URL");
  }

  const hashed = await bcrypt.hash(password, 10);

  await User.create({
    username,
    email,
    password: hashed,
    bio: cleanInput(bio),
    profilePic
  });

  res.send("User registered");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.send("User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send("Invalid password");

  req.session.userId = user._id;

  res.send("Login success");
});

app.post("/post", isAuth, async (req, res) => {
  const safeContent = sanitizePost(req.body.content);

  await Post.create({
    userId: req.session.userId,
    content: safeContent
  });

  res.send("Post created");
});

app.post("/message", isAuth, async (req, res) => {
  const { to, text } = req.body;

  await Message.create({
    from: req.session.userId,
    to,
    text: cleanInput(text)
  });

  res.send("Message sent");
});

app.get("/messages/:userId", isAuth, async (req, res) => {
  const messages = await Message.find({
    $or: [
      { from: req.session.userId, to: req.params.userId },
      { from: req.params.userId, to: req.session.userId }
    ]
  });

  res.json(messages);
});

app.post("/profile", isAuth, async (req, res) => {
  let { bio, profilePic } = req.body;

  if (profilePic && !isValidURL(profilePic)) {
    return res.send("Invalid URL");
  }

  await User.findByIdAndUpdate(req.session.userId, {
    bio: cleanInput(bio),
    profilePic
  });

  res.send("Profile updated");
});

app.post("/follow/:id", isAuth, async (req, res) => {
  res.send(`Followed user ${req.params.id}`);
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.send("Logged out");
});

app.listen(3000);