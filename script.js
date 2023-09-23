// const tempObj = MyLibrary.create(
//     {list: [{name: "Hi", label: "label1", value: "value1"}, 
//     {label: "lable2", value: "value2",name: "Hello"}], 
//     key: "Name", flag: false, nested1: {nested2: "Test"}}, {parentSelector: ".container"})



class MainClass {
    persons = [{hobby: [{name: "First"}, {name: "second"}]}, {hobby: [{name: "1st"},{name: "2nd"}]}];
    initEvents() {
        document.querySelector('#test').addEventListener("keyup", this.fn.bind(this));
    }
    fn() {
        console.log("Hello");
    }
    get() {
        console.log("test");
    }
}
let obj = new MainClass();
obj.initEvents();
obj = MyLibrary.create(obj);
// o = MyLibrary.create({persons: {list: ["Hi", "Hello"]}});


// const listArr  =new MyLibrary({listArr: {list: [{keyName: "test"}]}});


// const person = new MyLibrary({name: "Nadeem"});

// let obj = {name: ""};
// document.querySelector('#test').addEventListener("keyup", (e) => {
//     document.querySelector('#testlabel').textContent = e.target.value;
//     obj.name = e.target.value;
// })