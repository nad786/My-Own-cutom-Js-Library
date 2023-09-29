console.time('start');
let list = [];
for(let i=0;i<1000;i++) {
    list.push({name: "Nad", id: i});
}
const instance = MiniJs.create({
    todoList: list,
    todoItem: "",
    users: [{fname: "john", lname: "doe", attrVal: "name"}],
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
        instance.users.push(instance.user);
    }
})