const instance = MiniJs.create({
    todoItem: "",
    // textarea: "",
    list: ["Default Item"],
    // person: { fname: "john", lname: "doe", email: "nad@nad.com" },
  });
//   document.getElementById("clickMe").addEventListener("click", (e) => {
//     instance.textarea = JSON.stringify(instance.person);
//   });
  document.getElementById("todo").addEventListener("click", (e) => {
    if(instance.todoItem) {
        instance.list.push(instance.todoItem);
    }
  });