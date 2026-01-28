const fs    = require('fs');

fs.readFile('week3/sample.txt', 'utf8', (err, data) => {
    if (err) throw err
    console.log('File content:', data);
    
    fs.writeFile('week3/output.txt', data.toUpperCase(), (err) => {
        if (err) throw err
        console.log("write done")

        fs.readFile('week3/output.txt', 'utf8', (err, newData) => {
            if (err) throw err
            console.log('New File content:', newData);
        }
    });
});
console.log("after readfile")


//promise based readfile and writefile
const fsPromises = require('fs').promises;
async function processFile() {
    try {
        const data = await fsPromises.readFile('week3/sample.txt', 'utf8');
        console.log('File content (Promise):', data);
        await fsPromises.writeFile('week3/output_promise.txt', data.toUpperCase());
        console.log("write done (Promise)");