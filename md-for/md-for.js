console.time('start');
console.log('start');
let list = [];
for(let i=0;i<2000;i++) {
    list.push({name: "Nad", id: i, title: "Nad "+i});
}
const instance = MiniJs.create({
    todoList: list,
    todoItem: "",
    test : {users: [{fname: "john", lname: "doe", inputVal: "tesing", attrVal: "attr value"}]},
    user: {fname: "", lname: "", attrVal: ""},
    name: "Nad",

})
console.timeEnd('start');
document.getElementById("todolist").addEventListener("click", (e) => {
    if(instance.todoItem) {
        instance.todoList.push(instance.todoItem);
    }
});
document.getElementById("addUser").addEventListener("click", (e) => {
    if(instance.user.fname) {
        instance.test.users.push(instance.user);
    }
})