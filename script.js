// const list = new MyLibrary({
//     list: [{name: "Hi", key: "testing", flag: true, label: "label1", value: "value1", nested1: {nested2: "Test"}}, 
//     {label: "lable2", value: "value2",name: "Hello", key: "testinginf"}], 
//     key: "Name", flag: false, nested1: {nested2: "Test"}}, {parentSelector: ".container"})

// const listArr  =new MyLibrary({listArr: {list: [{keyName: "test"}]}});


const person = new MyLibrary({name: "Nadeem"});

let obj = {name: ""};
document.querySelector('#test').addEventListener("keyup", (e) => {
    document.querySelector('#testlabel').textContent = e.target.value;
    obj.name = e.target.value;
})