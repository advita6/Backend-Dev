const fs=require("fs");

fs.writeFileSync("file.txt","Hello World");

fs.readFile("./unknonwn.txt","utf-8",(err,data)=>{
    if(err){
        console.log("Error occurred:",err);
    }else{
        console.log("File data:",data);
    }
});

