//copying file using streams 
//pipe

 const fs=require('fs');

 const readStream=fs.createReadStream('./sample.txt');
 const writeStream=fs.createWriteStream('./copied_sample.txt');

 readStream.pipe(writeStream);