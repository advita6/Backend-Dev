const express = require('express');
const session = require('express-session');

const app = express();
app.use(express.json());

app.use(session({
    secret: 'auth-secret',
    resave: false,
    saveUninitialized: false
}));

// Dummy data
const users = [
    { id: 1, username: "user1", role: "user" },
    { id: 2, username: "mod1", role: "moderator" },
    { id: 3, username: "admin1", role: "admin" }
];

const posts = [];

//Simulate login (for testing)
app.get('/login/:id', (req, res) => {
    const user = users.find(u => u.id == req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    req.session.user = user;
    res.json({ message: "Logged in", user });
});

//Authentication Middleware
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized: Please login" });
    }
    next();
};

//Role-based Middleware
const requireRole = (role) => {
    return (req, res, next) => {
        const user = req.session.user;

        if (user.role === role || user.role === "admin") {
            return next();
        }

        return res.status(403).json({ message: "Forbidden: Insufficient role" });
    };
};

// Ownership OR Moderator/Admin check
const isOwnerOrModerator = (req, res, next) => {
    const user = req.session.user;
    const post = posts.find(p => p.id == req.params.id);

    if (!post) {
        return res.status(404).json({ message: "Post not found" });
    }

    // Owner OR moderator OR admin
    if (
        post.userId === user.id ||
        user.role === "moderator" ||
        user.role === "admin"
    ) {
        req.post = post; // attach post for later use
        return next();
    }

    return res.status(403).json({ message: "Forbidden: Not allowed" });
};

//Create Post (User+)
app.post('/posts', isAuthenticated, (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: "Content required" });
    }

    const newPost = {
        id: posts.length + 1,
        content,
        userId: req.session.user.id
    };

    posts.push(newPost);

    res.status(201).json({ message: "Post created", post: newPost });
});

//Edit Post
app.put('/posts/:id', isAuthenticated, isOwnerOrModerator, (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: "Content required" });
    }

    req.post.content = content;

    res.json({ message: "Post updated", post: req.post });
});

//Delete Post (Moderator+)
app.delete('/posts/:id', isAuthenticated, requireRole('moderator'), (req, res) => {
    const index = posts.findIndex(p => p.id == req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: "Post not found" });
    }

    const deleted = posts.splice(index, 1);

    res.json({ message: "Post deleted", post: deleted[0] });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});