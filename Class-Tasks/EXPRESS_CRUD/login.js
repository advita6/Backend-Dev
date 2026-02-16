import express from "express";

const app = express();
app.use(express.json());

// In-memory users
const credentials = [
  { email: "aman@gmail.com", password: "Abc@1234" },
  { email: "yash@gmail.com", password: "Xyz@1234" },
];

// Regex validations
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Register API
app.post("/auth/register", (req, res) => {
  const { email, password } = req.body;

  // Email validation
  if (!emailRegex.test(email)) {
    return res.status(400).send("Invalid email format");
  }

  // Password validation
  if (!passwordRegex.test(password)) {
    return res.status(400).send(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol"
    );
  }

  // Check existing user
  const existingUser = credentials.find((cred) => cred.email === email);
  if (existingUser) {
    return res.status(400).send("User Already Exist");
  }

  // Register
  credentials.push({ email, password });
  res.send("Registered Successfully");
});

// Login API
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  // Email validation
  if (!emailRegex.test(email)) {
    return res.status(400).send("Invalid email format");
  }

  const user = credentials.find(
    (cred) => cred.email === email && cred.password === password
  );

  if (user) {
    res.send({ message: "Login Successful", user });
  } else {
    res.status(401).send("Invalid Credentials");
  }
});

// Start server
app.listen(8000, () => {
  console.log("Server Started on port 8000");
});