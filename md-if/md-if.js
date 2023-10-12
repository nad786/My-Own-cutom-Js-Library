console.time("minijs")

const instance = MiniJs.create({
    display: true, 
    key: "test1",
    test: {key: "test1"},
    num: 101,
    key: 'pkg',
    display: 'hide',
    length: 10,
    obj: {key: 'show'},
    userName: 'userName',
    arr: [],
    flag: true,
    display: false
});
console.timeEnd("minijs")

function func() {
    console.log("Hello");
}


// document.getElementById("toggle-key").addEventListener("click", (e) => {
//     instance.key = instance.key == 'test' ? "someother" : "test";
// })
// document.getElementById("toggle-test-key").addEventListener("click", (e) => {
//     instance.test.key = instance.test.key == 'test' ? "someother" : "test";
// })
// document.getElementById("toggle-num").addEventListener("click", (e) => {
//     instance.num = instance.num == 10 ? 11 : 10;
// })
// document.getElementById("toggle").addEventListener("click", (e) => {
//     instance.display = !instance.display;
// })