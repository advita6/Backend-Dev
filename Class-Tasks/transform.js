const fs=require('fs');
const {Transform}=require('stream');

 const readStream=fs.createReadStream('./sample.txt');
 const writeStream=fs.createWriteStream('./copied_sample.txt');
 
const upperCaseTransform=new Transform({
    transform(chunk,encoding,callback){
        this.push(chunk.toString().toUpperCase());
        let upperCase=chunk.toString().toUpperCase();
        callback(null,upperCase);
    }   
})




 readStream.pipe(upperCaseTransform).pipe(writeStream);