console.log("first")

function login(cb){
    setTimeout(()=>{
        console.log("login");
        cb();
    },2000);
}

function userDetail(){
    setTimeout(()=>{
        console.log("user details");
    },1000);
}

login(()=>{
    userDetail();
      password()
    
        }
);

 