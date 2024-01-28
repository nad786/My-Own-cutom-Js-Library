const formInstance = new MiniJsFormValidaion();
formInstance.buildForm({
    name: new Controls(["te", [Validators.required, Validators.minLength(3), Validators.maxLength(10)]]),
    email: new Controls(["", [Validators.required, Validators.pattern("^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$")]]),
    group: new Controls(["4", [Validators.required, Validators.customValidation((value) => {
        if(value ==2) {
            return {error: true, msg: "2 can't be selected"}
        }
        return {error: false}
    })]])
});

