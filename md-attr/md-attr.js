const instance = MiniJs.create({
    dynamicAttr: "login",
    attrValue: "",
    className: "green"
})
document.getElementById('btn').addEventListener("click", (e) => {
    instance.dynamicAttr = instance.attrValue;
})
document.getElementById('btn1').addEventListener("click", (e) => {
    instance.className = instance.className == 'green' ? "blue" : "green";
})