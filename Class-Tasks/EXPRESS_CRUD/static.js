const express = require("express"); 
const app = express();
//serve files from the 'public' directory

//Absolute path: C:\Users\advitasingh\Desktop\Backend-Dev\branches\express-framework\Class-Tasks\EXPRESS_CRUD\public
//Relative path: ./public

// const staticPath = __dirname + "/public";
// const fullPath=path.join(__dirname,"public", "index.html");
//console.log("Full path is ", fullPath);

app.use(express.static("public"));
app.listen(8000, () => {console.log("Server is running on port 8000");});