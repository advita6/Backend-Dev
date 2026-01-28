const fs=require('fs');
const path=require('path');

const filePath=path.join(__dirname,'sample.txt');

fs.readFile(filePath,'utf8',(err,data)=>{
    if(err) throw err;
    console.log('File content:',data);
});

//stream based readfile

// const readStream=fs.createReadStream(filePath,{
//     highWaterMark:64  //size of each chunk in bytes
// });

// readStream.on("data",(chunk)=>{         //nodejs event based programming
//     console.log("New chunk received:");
//     console.log(chunk);
// })

// readStream.on("end",()=>{
//     console.log("data finish")
// })

//write stream

const writeStream=fs.createWriteStream(./output.txt,{
    flags:'a'  //append mode    
});

 writeStream.write("Hello World\n");
 writeStream.write("This is written using write stream\n");
 writeStream.end("This is the end of the file\n");

 writeStream.end();

 writeStream.on("finish",()=>{
    console.log("Write completed");
 });

//copying file using streams
 const fs=require('fs');
