let arr=["apple","mango","oranges"];

// let a=arr[0];
// let b=arr[1];        old way of extracting values from array
// let c=arr[2];

const[a,b,c]=arr;  //new way of extracting values from array    

let obj={                 //js obejct

    name:"John",
    age:30,
    city:"New York"
}

// let jsondata={
//     "name":"John",            //json data
//     "age":30,
//     "city":"New York"
// }

let username=obj.name;   //old way of extracting values from object
let userage=obj.age;
let usercity=obj.city;

const{ name,age,city}=obj;   //new way of extracting values from object

console.log(JSON.stringify.stringify(obj)); //converting js object to json string

