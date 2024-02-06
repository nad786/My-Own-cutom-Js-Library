// class A {
//     key = 'value';
//     get userId() {
//         return 1001;
//     }
//     #name = '';
//     set name(name) {
//         this.#name = name
//     }
//     get name() {
//         return this.#name
//     }

//     clickMe(e) {
//         this.name = e.target.value;
//     }

//     initEvents() {
//         document.getElementById("keyup").addEventListener('keyup', (e) => {
//             this.clickMe(e);
//         }) 
//     }
// }

// const o = MiniJs.create(new A());
// o.initEvents();
const o = MiniJs.create({list: [{val: "Hi"}, {val: ""}, {val: "Hello"}], username: "nad"}, {prefix: "nadeem-"});

MiniJs.formValidation({obj: o});