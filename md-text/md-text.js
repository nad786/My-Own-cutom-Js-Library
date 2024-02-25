console.time('start');
const instance = MiniJs.create({
    frequency: 'Yearly', 
    temp: "test",
    tempfrequency: "tetsing"
});
document.getElementById("select-day").addEventListener("change", (e) => {
    console.time('changed');
    instance.frequency = e.target.value;
    console.timeEnd('changed');
})
console.timeEnd('start');