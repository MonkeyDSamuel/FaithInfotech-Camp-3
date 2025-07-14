//synchronous

console.log("1");
console.log("2");
console.log("3");


//asynchronous

console.log("1");


// setTimeout() is a built-in javaScript functionthat waits for
// a certain amount of time and then runs some code once

// setTimeout(function,milliseconds);
setTimeout(()=>{
    console.log("2");
},2000);    //wait for 2 seconds

console.log("3");

// setInterval()
// It is a built-in JavaScript function that runs a piece of code 
// again and again at fixed time intervals

setInterval(() => {
    console.log("This prints every 1 second");
}, 1000);

// fetch() is used to get data from a server like an API 
// It works asynchronously which MediaSession, that the browser doesn't store abd wait for the data-it keeps on going.

fetch('https://jsonplaceholder.typicode.com/posts/1')
.then(response=>response.json())
.then(data=>{
    console.log("Data from API", data);
})
.catch(error=>{
    console.log("Error",error);
});