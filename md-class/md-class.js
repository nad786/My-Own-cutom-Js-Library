console.time("minijs")

const instance = MiniJs.create({
    display: 'show',
    active: true 
});
console.timeEnd("minijs")


document.getElementById("show-hide").addEventListener("click", (e) => {
    instance.display = instance.display == 'show' ? "hide" : 'show';
})
document.getElementById("toggle").addEventListener("click", (e) => {
    instance.active = !instance.active
})
