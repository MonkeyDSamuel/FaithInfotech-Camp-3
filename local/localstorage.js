localStorage.setItem("name","Binu");
console.log(`Your name is ${localStorage.getItem("name")}`);
// localStorage.removeItem("name"); 

let userdetail = {
    name: "Samuel",
    age: 25,
}
localStorage.setItem("user", JSON.stringify(userdetail));

let user = JSON.parse(localStorage.getItem("user"));
console.log(user);