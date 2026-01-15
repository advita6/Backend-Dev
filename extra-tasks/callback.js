const greet = ()=>{
    console.log("morning");
}

function fun(cb){
    console.log("inside fun");
    cb();
}

fun(greet)


      