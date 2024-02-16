const instance = MiniJs.create({
    frequency: 'Yearly', 
});
document.getElementById("select-day").addEventListener("change", (e) => {
    instance.frequency = e.target.value;
})
