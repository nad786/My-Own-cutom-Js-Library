const instance = MiniJs.create({
    todoList: ["first list"],
    todoItem: "",
    users: [{fname: "john", lname: "doe", attrVal: "name"}],
    user: {fname: "", lname: "", attrVal: ""},
    name: "Nad"

}, {target: 'loop'})
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