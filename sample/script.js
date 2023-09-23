console.time('start')
const tempObj = MyLibrary.create(
    {list: [
        {name: "Hi", label: "label1", value: "value1"}, 
        {label: "lable2", value: "value2",name: "Hello"}], 
    key: "Name", flag: false, nested1: {nested2: "Test"}}, {parentSelector: ".container"})



class MainClass {
    task = {taskid: {10: "Some Value"}};
    name = "Nad"
    initEvents() {
        // document.querySelector('#test').addEventListener("keyup", this.fn.bind(this));
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
console.timeEnd("start")