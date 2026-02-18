const express = require('express');
const fs=require('fs');
const users = require("./MOCK_DATA.json");
const app=express();
app.use(express.urlencoded(({extended:false})));
// Rest API
//GET method

app.get("/users",(req,res)=>{
    const html=`
    <ul>
    ${users.map((user)=>`<li>${user.first_name} ${user.last_name}</li>`).join("")}
    </ul>
    `;
    res.send(html);
});

app.get("/api/users",(req,res)=>{
    res.json(users);
});  

app.get("/api/users/:id",(req,res)=>{
    const id=parseInt(req.params.id);
    const user=users.find((u)=>u.id===id);
    return res.json(user);
});

app.post(("/api/users"),(req,res)=>{
    //TO DO: create new user
    const{first_name,last_name, gender, email, job_title}=req.body;
    const newUser={
        id:users.length+1,
        first_name,
        last_name,
        gender,
        email,
        job_title
    };
    users.push(newUser);
    fs.writeFile("MOCK_DATA.json",JSON.stringify(users, null, 2),()=>
        res.status(201).json({message:"User created successfully",user:newUser})
    );
});
    
app.patch(("/api/users/:id"),(req,res)=>{
    //update existing user
    const id=parseInt(req.params.id);
    const userIndex=users.findIndex((u)=>u.id===id);
    if(userIndex===-1){
        return res.status(404).json({message:"User not found"});
    }
    const{first_name,last_name, gender, email, job_title}=req.body;
    users[userIndex]={...users[userIndex], first_name, last_name, gender, email, job_title};
    fs.writeFile("MOCK_DATA.json",JSON.stringify(users, null, 2),()=>
        res.status(200).json({message:"User updated successfully",user:users[userIndex]})
    );
});

app.delete(("/api/users/:id"),(req,res)=>{
    //delete existing user
    const id=parseInt(req.params.id);
    const userIndex=users.findIndex((u)=>u.id===id);
    if(userIndex===-1){
        return res.status(404).json({message:"User not found"});
    }
    const deletedUser=users.splice(userIndex,1);
    fs.writeFile("MOCK_DATA.json",JSON.stringify(users, null, 2),()=>
        res.status(200).json({message:"User deleted successfully",user:deletedUser[0]})
    );
});

// //same api with same route
// app.route("/api/users/:id")
//     .get((req,res)=>{
//         const id=req.params.id;
//         const user=users.find((u)=>u.id===id);
//         return res.json(user);
//     })
//     .patch((req,res)=>{
//         //TO DO: update new user
//         return res.json({message:"User updated successfully"});
//     })
//     .delete((req,res)=>{
//         //TO DO: delete new user
//         return res.json({message:"User deleted successfully"});
//     });

app.listen(8000,()=>console.log("Server is running on port 8000"));