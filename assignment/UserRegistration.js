const express = require('express');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

const users = []; // In-memory DB 

//Password Validation 
function validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }

    return errors;
}

// Routes
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

   
    if (!username || !email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
        return res.status(400).json({
            message: "Password validation failed",
            errors: passwordErrors
        });
    }

    
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(409).json({
            message: "Email already registered"
        });
    }

    try {
        
        const hashedPassword = await bcrypt.hash(password, 10);

        //Store user
        const newUser = {
            username,
            email,
            password: hashedPassword
        };

        users.push(newUser);

        
        res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});


app.listen(3000, () => {
    console.log("Server running on port 3000");
});