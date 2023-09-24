const instance = MiniJs.create({display: true});
document.getElementById("toggle").addEventListener("click", (e) => {
    instance.display = !instance.display;
})