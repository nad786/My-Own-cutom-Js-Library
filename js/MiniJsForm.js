class Validators {
  static get required() {
    return () => {
      return { name: "required", value: true };
    };
  }
 
  static minLength(length) {
    return () => {
      return { name: "minLength", value: length };
    };
  }
 
  static maxLength(length) {
    return () => {
      return {
        name: "maxLength",
        value: length,
      };
    };
  }
 
  static get email() {
    return () => {
      return {
        name: "email",
        value: true,
      };
    };
  }
 
  static min(num) {
    return () => {
      return {
        name: "min",
        value: num,
      };
    };
  }
 
  static max(num) {
    return () => {
      return {
        name: "max",
        value: num,
      };
    };
  }
 
  static pattern(regex) {
    return () => {
      return { name: "pattern", value: regex };
    };
  }
 
  static custom(cb) {
    return () => {
      return { name: "custom", value: cb };
    };
  }
}
 
class FormControl {
  value = "";
  ele = null;
  validators = [];
  constructor(value, validdator = [], allowedChar = "") {
    this.value = value;
    const validatorFn = Array.isArray(validdator) ? validdator : [validdator];
    this.validators = validatorFn.map((fn) => fn());
    this.allowedChar = allowedChar;
  }
}
class MiniJsFormValidaion {
  form = null;
  prefix = null;
  formObj = {};
  errorMsg = {};
  cacheElements = {};
  detectValueChanges = {};
  allControlKeysForEvent = [];
  constructor({ prefix = "md-", selector = "form" } = {}) {
    this.prefix = prefix;
    this.form = document.querySelector(selector);
    this.objKey = this.form.getAttribute("formGroup");
  }

  buildControls(formControls = {}, options = {}) {
    const objKey = this.form.getAttribute("formGroup");
    this.objKey = objKey;
    this.generateObjectFromControls(this.formObj[this.objKey], formControls);
    this.createMiniJSObj(this.formObj, options);
    ObservableSlim.observe(this.miniJSInstance.lib, (changes = []) => {
      changes = changes.filter((item) => item.currentPath.endsWith(".value"));
      if (changes.length) {
        this.validateElement(changes);
      }
    });
    return this.miniJSInstance.lib;
  }

  generateObjectFromControls(
    obj = {},
    formControls = {},
    selector = "",
    objSelector = `${this.objKey}.controls`
  ) {
    for (let key in formControls) {
      // this.formObjReplicateWithControls[objKey].controls[key] = formControls[key];

      if (formControls[key] instanceof FormControl) {
        obj.controls[key] = {
          valid: true,
          touched: false,
          dirty: false,
          value: formControls[key].value,
          error: "",
          validators: formControls[key].validators,
        };
        //update key for input events
        const currentPath = `${objSelector}.${key}.value`;
        this.allControlKeysForEvent.push({
          currentPath,
          newValue: formControls[key].value,
        });

        // const elements = this.form.querySelectorAll(`${selector ? selector :"div:not([formGroupName])"}  [formControlName="${key}"]`);
        const elements = document.querySelectorAll(
          `form[formGroup="${this.objKey}"] ${
            selector ? selector : ":not([formGroupName])"
          }  [formControlName="${key}"]`
        );
        if (elements.length) {
          elements.forEach((ele) => {
            ele.setAttribute(
              `${this.prefix}allowedChar`,
              formControls[key].allowedChar
            );
            ele.setAttribute(
              `${this.prefix}input`,
              `${objSelector}.${key}.value`
            );
            if (ele.getAttribute("type") == "radio") {
              if (formControls[key]?.value == ele.value) {
                ele.checked = true;
              } else {
                ele.checked = false;
              }
            } else if (ele.getAttribute("type") == "checkbox") {
              let arr = formControls[key]?.value;
              if (!Array.isArray(arr)) {
                arr = [arr];
              }
              if (arr.includes(ele.value)) {
                ele.checked = true;
              } else {
                ele.checked = false;
              }
            } else {
              ele.value = formControls[key]?.value;
            }
            // this.updateTouchednDirtyProp(ele, objSelector, key);
            this.formValidation(
              formControls[key].validators,
              obj.controls[key],
              ele,
              key
            );
          });
        } else {
          console.log("Not Found");
          const elements = document.querySelectorAll(
            `form[formGroup="${this.objKey}"] ${
              selector ? selector : ":not([formGroupName])"
            }  [formControlName*="${key}"]`
          );
          if (elements.length) {
            formControls[key] = [];
          }
          elements.forEach((ele) => {
            if (ele.getAttribute("type") == "checkbox") {
              const controlName = ele.getAttribute("formControlName");
              ele.setAttribute(
                `${this.prefix}input`,
                `${objSelector}.${controlName}.value`
              );
            }
          });
        }
      } else {
        selector += ` [formGroupName="${key}"]`;
        obj.controls[key] = {
          controls: {},
        };
        this.generateObjectFromControls(
          obj.controls[key],
          formControls[key],
          selector,
          objSelector + `.${key}.controls`
        );
      }
    }

    obj.valid = false;
  }

  validateElement(changes = []) {
    changes.forEach((item) => {
      const path = item.currentPath.split(".");
      path.pop();
      if(!this.cacheElements[item.currentPath]) {
        this.cacheElements[item.currentPath] = this.form.querySelector(
          `[${this.prefix}input="${item.currentPath}"]`
        );
      }
      const ele = this.cacheElements[item.currentPath];
      if (ele) {
        const realObj = this.miniJSInstance.getValueFromkeyWithDot(
          this.miniJSInstance.lib,
          path.join(".")
        );

        if (realObj?.validators?.length) {
          this.formValidation(realObj.validators, realObj, ele, path.pop());
        }
      }
    });
  }

  formValidation(validationObj = [], targetObj = {}, ele = null, key) {
    let error = false;
    this.formObj[this.objKey].valid = false;
    for (let validatorProp of validationObj) {
      // const validatorProp = validation();
      let errorMsg = "Fields";
      const customErrorMsg = this.errorMsg[key];
      switch (validatorProp?.name) {
        case "required":
          if (ele.getAttribute("type") == "checkbox" && !ele.checked) {
            errorMsg =  customErrorMsg.required ? customErrorMsg.required : "Mandatory Field";
            error = true;
          }
          if (ele.getAttribute("type") == "radio") {
            const name = ele.getAttribute("name");
            const allRadioButton = this.form.elements[name];
            let flag = false;
            allRadioButton.forEach((radioBtn) => {
              if (radioBtn.checked) {
                flag = true;
              }
            });
            if (!flag) {
              errorMsg =  customErrorMsg?.required ? customErrorMsg.required : "Mandatory Field";
              error = true;
            }
          }
          if (!ele.value) {
            errorMsg =  customErrorMsg?.required ? customErrorMsg.required : "Mandatory Field";
            error = true;
          }
          break;
        case "minLength":
          if (ele.value.length < validatorProp.value) {
            errorMsg =  customErrorMsg?.minLength ? customErrorMsg.minLength : `Min Length is ${validatorProp.value}`;
            error = true;
          }
          break;
        case "maxLength":
          if (ele.value.length > validatorProp.value) {
            errorMsg =  customErrorMsg?.maxLength ? customErrorMsg.maxLength : `Max Length is ${validatorProp.value}`;
            error = true;
          }
          break;

        case "pattern":
          if (!new RegExp(validatorProp.value).test(ele.value)) {
            errorMsg =  customErrorMsg?.pattern ? customErrorMsg.pattern : "Pattern mismatch";
            error = true;
          }
          break;

        case "min":
          if (parseInt(ele.value) <= validatorProp.value) {
            errorMsg =  customErrorMsg?.min ? customErrorMsg.min : `Min value is ${validatorProp.value}`;
            error = true;
          }
          break;
        case "max":
          if (parseInt(ele.value) >= validatorProp.value) {
            errorMsg =  customErrorMsg?.max ? customErrorMsg.max : `Max value is ${validatorProp.value}`;
            error = true;
          }
          break;
        case "email":
          if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.exec(ele.value)) {
            errorMsg =  customErrorMsg?.email ? customErrorMsg.email : `Invalid Email`;
            error = true;
          }
          break;
        default:
          let cbResponse = validatorProp.value(ele.value);
          if (typeof cbResponse == "boolean") {
            cbResponse = {
              error: cbResponse,
              msg: cbResponse ? "" : "Custom validation failed",
            };
          } else if (typeof cbResponse == "string") {
            cbResponse = {
              error: !!cbResponse,
              msg: cbResponse,
            };
          }
          if (cbResponse.error) {
            errorMsg = cbResponse?.msg ? cbResponse?.msg : "Error";
            error = true;
          }
      }
      if(error) {
        ele.setCustomValidity(errorMsg);
        targetObj.valid = false;
        targetObj.error = errorMsg;
        return;
      }
    }
    

    if (!error) {
      if (ele.getAttribute("type") == "radio") {
        const name = ele.getAttribute("name");
        const allRadioButton = this.form.elements[name];
        allRadioButton.forEach((ele) => {
          ele.setCustomValidity("");
        });
      }
      ele.setCustomValidity("");
      targetObj.valid = true;
      targetObj.error = "";
    }
    this.formObj[this.objKey].valid = this.form.checkValidity?.();
  }

  addEventListenerToForm() {
    this.timer = null;
    this.form.addEventListener("focus", this.boundFormFocusEvent);
    this.form.addEventListener("keydown", this.boundFormKeyDownEvent);
    this.form.addEventListener("change",this.boundFormChangeEvent);
    if (typeof jQuery != "undefined") {
      $(this.form).on("select2:select", this.boundFormChangeEvent);
    }
  }

  boundFormFocusEvent = this.formFocusEvent.bind(this);
  boundFormKeyDownEvent = this.formKeyDownEvent.bind(this);
  boundFormChangeEvent = this.formChangeEvent.bind(this);

  formFocusEvent(e) {
    const obj = this.getTargetObjectOfFormControlELement(e.target);
    obj.touched = true;
  }

  formKeyDownEvent(e) {
    let allowedChar = e.target.getAttribute(`${this.prefix}allowedChar`);
    if (allowedChar) {
      if (allowedChar.startsWith("/")) {
        allowedChar = allowedChar.substring(1, allowedChar.length - 1);
      }
      const regex = new RegExp(allowedChar);
      if (!regex.test(e.key)) {
        e.preventDefault();
        return false;
      }
    }

    const obj = this.getTargetObjectOfFormControlELement(e.target);
    obj.dirty = true;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      obj.value = e.target.value;
    }, 300);
  }

  formChangeEvent(e) {
    const obj = this.getTargetObjectOfFormControlELement(e.target);
    obj.dirty = true;
    obj.value = e.target.value;
  }

  getTargetObjectOfFormControlELement(ele) {
    const splittedKey = ele.getAttribute(`${this.prefix}input`).split(".");
    splittedKey.pop();
    return this.miniJSInstance.getValueFromkeyWithDot(
      this.formObj,
      splittedKey.join(".")
    );
  }

  createMiniJSObj(obj, rest) {
    this.miniJSInstance = new MiniJs(obj, {
      ...rest,
      detectValueChanges: this.detectValueChanges,
    });
    const data = this.miniJSInstance.generateDefaultObjectType(obj);

    // this.initForLoop(obj);
    this.miniJSInstance.performOperation(data);
    // this.miniJSInstance.initInputChanges(this.allControlKeysForEvent);
  }

  updateControls(obj = {}) {
    this.generateObjectFromControls(this.formObj[this.objKey], obj);
  }

  getValues(obj = this.formObj[this.objKey].controls) {
    const result = {};
    for (let key in obj) {
      if (obj[key]?.controls) {
        result[key] = this.getValues(obj[key].controls);
      } else {
        if (Array.isArray(obj[key].value)) {
          result[key] = [...obj[key].value];
        } else {
          result[key] = obj[key].value;
        }
      }
    }
    return result;
  }

  patchValues(obj = {}, formObj = this.formObj[this.objKey]) {
    for (let key in obj) {
      if (typeof obj[key] == "object") {
        this.patchValues(obj[key], formObj.controls[key]);
      } else {
        formObj.controls[key].value = obj[key];
      }
    }
  }

  updateDetectChanges(obj = {}) {
    for (let key in obj) {
      const split = key.split(".");
      this.detectValueChanges[
        this.objKey +
          "." +
          split.map((item) => `controls.${item}`).join(".") +
          ".value"
      ] = obj[key];
    }
  }

  destroy() {
    ObservableSlim.remove(this.formObj);
    this.form.removeEventListener("focus", this.boundFormFocusEvent);
    this.form.removeEventListener("keydown", this.boundFormKeyDownEvent);
    this.form.removeEventListener("change",this.boundFormChangeEvent);
    if (typeof jQuery != "undefined") {
      $(this.form).off("select2:select", this.boundFormChangeEvent);
    }
  }

  static buildForm(obj, options = {}) {
    const instance = new MiniJsFormValidaion(options);
    instance.updateDetectChanges(options.detectValueChanges);
    instance.errorMsg = options.errorMsg ? options.errorMsg: {};
    instance.addEventListenerToForm();
    instance.formObj = {
      [instance.objKey]: {
        controls: {},
      },
    };
    instance.formObj = instance.buildControls(obj, {
      ...options,
      parentSelector: options?.selector ? options.selector : "form",
    });
    return {
      patchValues: instance.patchValues.bind(instance),
      destroy: instance.destroy.bind(instance),
      updateControls: instance.updateControls.bind(instance),
      getValues: instance.getValues.bind(instance),
      [instance.objKey]: instance.formObj[instance.objKey],
    };
  }
}