const express = require('express');
const app = express();
app.use(express.json());

let credentials=[
    {email:"adv@gmail.com", password: "321"},
    {email:"ary@gmail.com", password: "123"},
]

// Get request
app.get("/auth/user",(req,res)=>{
    res.json({message: "User fetch successfull", credentials})
});

// Reset password route
// Put request
app.put("/auth/reset",(req,res)=>{
    const{email, password, newPassword}=req.body;
    // Find user
    const user=credentials.find(cred=> cred.email === email && cred.password === password);
    if(!user){
        return res.status(400).json("Invalid email or password");
    }
    // Update password
    user.password=newPassword;
    res.json("Password reset successful");
});

// Forgot password route
app.put("/auth/forgot",(req,res)=>{
    const{email, newPassword}=req.body;
    const user=credentials.find(cred=> cred.email === email);
    if(!user){
        return res.status(400).json("Invalid email");
    }
    user.password=newPassword;
    res.json("Password reset successful");  
})

// Reset email route
// Put request
app.put("/auth/reset-email",(req,res)=>{
    const{oldEmail, password, newEmail}=req.body;
    // Find user
    const user=credentials.find(
        cred=> cred.email === oldEmail && cred.password === password
    );
    if(!user){
        return res.status(400).json("Invalid email or password");
    }
    // Update email
    user.email=newEmail;
    res.json("Email reset successful");
})

app.listen(8000,()=>console.log("Server is running on port 8000"));
