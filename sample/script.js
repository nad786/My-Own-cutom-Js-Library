const list = [];
for(let i=0;i<10000;i++) {
    list.push( {title: "Text "+i, id: i});
}
console.time('minijs')
const instance = MiniJs.create({list})
console.timeEnd('minijs')
console.time('vanilla');
const parent = document.querySelector('#test');
// for(let i=0;i<list.length;i++) {
//     const li = document.createElement('li');
//     li.textContent = "Text "+list[i];
//     parent.appendChild(li);
// }
console.timeEnd('vanilla');
console.log("Completed")