const varName = "Test";
console.time("form");

const formInstance = MiniJsFormValidaion.buildForm({
    name: new FormControl("", [Validators.required, Validators.minLength(3), Validators.maxLength(10)]),
    isMarried: new FormControl(""),
    age: new FormControl("", [Validators.required, Validators.min(18), Validators.max(55)]),
    gender: new FormControl("", Validators.required),
    email: new FormControl("", [Validators.required, Validators.email]),
    group: new FormControl("", [Validators.required, Validators.custom((value) => {
        if(value ==2) {
            return "2 can't be selected";
        }
        return ""
    })]),
    city: {
        name: new FormControl("", [Validators.required]),
        place: new FormControl("",  [Validators.required])
    }
});

console.timeEnd("form");

