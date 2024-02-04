const varName = "Test";
const formInstance = new MiniJsFormValidaion();
formInstance.buildForm({
    name: new FormControl("te", [Validators.required, Validators.minLength(3), Validators.maxLength(10)]),
    isMarried: new FormControl("", [Validators.required]),
    age: new FormControl("", [Validators.required, Validators.min(18), Validators.max(55)]),
    gender: new FormControl("male", Validators.required),
    email: new FormControl("", [Validators.required, Validators.pattern("^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$")]),
    group: new FormControl("4", [Validators.required, Validators.custom((value) => {
        if(value ==2) {
            return "2 can't be selected";
        }
        return ""
    })]),
    city: {
        name: new FormControl("blr", [Validators.required]),
        place: new FormControl("",  [Validators.required])
    }
});

