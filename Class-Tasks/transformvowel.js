const fs=require('fs');
const {Transform}=require('stream');

 const readStream=fs.createReadStream('./sample.txt');
 const writeStream=fs.createWriteStream('./copied_sample.txt');
 
const vowelReplace=new Transform({
    transform(chunk,encoding,callback){
       let vowel=chunk.toString().replace(/[AIEOU]/g,'*');
        callback(null,vowel);
    }   
})




 readStream.pipe(vowelReplace).pipe(writeStream);