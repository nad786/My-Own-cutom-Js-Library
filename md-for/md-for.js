console.time('start');
console.log('start');
let list = [];
for(let i=0;i<10;i++) {
    list.push({name: "Nad", id: i, title: "Nad "+i, success: i%2==0, isActive: i%2==0});
}
const instance = MiniJs.create({
    todoList: list,
    todoItem: "",
    test : {users: [{fname: "john", lname: "doe", inputVal: "tesing", attrVal: "attr value"}]},
    user: {fname: "t", lname: "te", inputVal: "test"},
})
console.timeEnd('start');
document.getElementById("todolist").addEventListener("click", (e) => {
    if(instance.todoItem) {
        instance.todoList.push({id: instance.todoItem, name: instance.todoItem, title: instance.todoItem});
    }
});
document.getElementById("addUser").addEventListener("click", (e) => {
    if(instance.user.fname) {
        instance.test.users.push({...instance.user});
    }
})