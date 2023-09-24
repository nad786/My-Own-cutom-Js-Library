const instance = MiniJs.create( {
    person: {fname: "john", lname: 'doe', email: "nad@nad.com" },
    outputPayload: ""
})
document.getElementById("submit").addEventListener("click", (e) => {
    instance.outputPayload = JSON.stringify(instance.person);
})