console.time("minijs")

const instance = MiniJs.create({
    display: 'show',
    active: true 
});
console.timeEnd("minijs")



document.getElementById("toggle").addEventListener("click", (e) => {
    instance.active = !instance.active
})
