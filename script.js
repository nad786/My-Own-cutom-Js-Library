const tempObj = MyLibrary.create(
    {list: [{name: "Hi", label: "label1", value: "value1"}, 
    {label: "lable2", value: "value2",name: "Hello"}], 
    key: "Name", flag: false, nested1: {nested2: "Test"}}, {parentSelector: ".container"})

// const listArr  =new MyLibrary({listArr: {list: [{keyName: "test"}]}});


// const person = new MyLibrary({name: "Nadeem"});

// let obj = {name: ""};
// document.querySelector('#test').addEventListener("keyup", (e) => {
//     document.querySelector('#testlabel').textContent = e.target.value;
//     obj.name = e.target.value;
// })