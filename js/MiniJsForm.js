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
     return { name: "pattern",
      value: regex};
    }
  }

  static custom(cb) {
    return () => {
      return {name: 'custom', value: cb}
    }
  }
}


class FormControl {
  value = "";
  ele = null;
  validators = [];
  constructor(value, validdator = []) {
    this.value = value;
    this.validators = Array.isArray(validdator) ? validdator : [validdator];
  }
}
class MiniJsFormValidaion {
  form = null;
  prefix = "md-";
  formObjReplicateWithControls = {};
  formObj = {};
  constructor({ prefix = "md-", selector = "form" } = {}) {
    this.prefix = prefix;
    this.form = document.querySelector(selector);
    this.objKey = this.form.getAttribute("formGroup")
  }

  buildControls(formControls = {}, options = {}) {
    const objKey = this.form.getAttribute("formGroup");
    this.objKey = objKey;
    this.formObjReplicateWithControls = {
      [objKey]: {
        controls: {},
      },
    };

    this.generateObjectFromControls(this.formObj[this.objKey], formControls)
    
    this.createMiniJSObj(this.formObj);

    ObservableSlim.observe(this.miniJSInstance.lib, (changes = []) => {
      changes = changes.filter(item => item.currentPath.endsWith(".value"));
      if(changes.length) {
        this.validateElement(changes);
      }
    });
    return this.miniJSInstance.lib;
  }

  generateObjectFromControls(obj = {}, formControls = {}, selector = "", objSelector = `${this.objKey}.controls`) {
   
    for (let key in formControls) {
      // this.formObjReplicateWithControls[objKey].controls[key] = formControls[key];

      if(formControls[key] instanceof FormControl) {
        obj.controls[key] = {
          valid: true,
          touched: false,
          errors: [],
          value: formControls[key].value,
          error: "",
          validators: formControls[key].validators
        };
        // const elements = this.form.querySelectorAll(`${selector ? selector :"div:not([formGroupName])"}  [formControlName="${key}"]`);
        const elements = document.querySelectorAll(`form[formGroup="${this.objKey}"] ${selector ? selector :":not([formGroupName])"}  [formControlName="${key}"]`)
        elements.forEach(ele => {
          ele.setAttribute(
            `${this.prefix}input`,
            `${objSelector}.${key}.value`
          );
          if(ele.getAttribute('type') == "checkbox" || ele.getAttribute('type') == "radio") {
            if(formControls[key]?.value == ele.value) {
              ele.checked = true;
            } else {
              ele.checked = false;
            }
          } else {
            ele.value = formControls[key]?.value;
          }
          this.updateTouchedProp(ele, objSelector, key);
          this.formValidation(formControls[key].validators, obj.controls[key], ele)
        });
      } else {
        selector += ` [formGroupName="${key}"]`;
        obj.controls[key] = {
          controls: {}
        };
        this.generateObjectFromControls( obj.controls[key], formControls[key], selector, objSelector + `.${key}.controls`);
      }
    }
  }

  validateElement(changes = []) {
    changes.forEach((item) => {
      const path = item.currentPath.split(".");
      path.pop();
      // const validators = this.miniJSInstance.getValueFromkeyWithDot(
      //   this.formObj,
      //   path.join(".")
      // )?.validators;
     
      const ele = this.form.querySelector(
        `[${this.prefix}input="${item.currentPath}"]`
      );
      
      if (ele) {
        const realObj = this.miniJSInstance.getValueFromkeyWithDot(
          this.miniJSInstance.lib,
          path.join(".")
        );

        if(realObj?.validators?.length) {
          this.formValidation(realObj.validators, realObj, ele);
        }

      }
     
    });
  }

  formValidation(validationObj = [], targetObj = {}, ele) {
    let error = false;
    this.formObj[this.objKey].valid = false;
    targetObj.errors = {
      required: false,
      minLength: false,
      maxLength: false,
      min: false,
      max: false,
      pattern: false,
      custom: false

    }
    for(let validation of validationObj) {
      const validatorProp = validation();
      switch (validatorProp?.name) {
        case "required":
          if(ele.getAttribute("type") == 'checkbox' && !ele.checked) {
            ele.setCustomValidity("Field is mandatory");
            error = true;
            targetObj.valid = false;
            targetObj.error = "Field is mandatory";
            targetObj.errors['required'] = true
          return;
        }
         if(ele.getAttribute("type") == 'radio') {
          const name = ele.getAttribute('name');
          const allRadioButton = this.form.elements[name];
          let flag = false;
          allRadioButton.forEach(radioBtn => {
            if(radioBtn.checked) {
              flag = true;
            }
          })
          if(!flag) {
            ele.setCustomValidity("Field is mandatory");
            error = true;
            targetObj.valid = false;
            targetObj.error = "Field is mandatory";
            targetObj.errors['required'] = true
            return;
          }
          
        } if (!ele.value ) {
            ele.setCustomValidity("Field is mandatory");
            error = true;
            targetObj.valid = false;
            targetObj.error = "Field is mandatory";
            targetObj.errors['required'] = true
            return;
          }
          break;
        case "minLength":
          if (ele.value.length < validatorProp.value) {
            ele.setCustomValidity(`Min Length is ${validatorProp.value}`);
            error = true;
            targetObj.valid = false;
            targetObj.error = `Min Length is ${validatorProp.value}`;
            targetObj.errors['minLength'] = true
            return;
          }
          break;
        case "maxLength":
          if (ele.value.length > validatorProp.value) {
            ele.setCustomValidity(`Max Length is ${validatorProp.value}`);
            error = true;
            targetObj.valid = false;
            targetObj.error = `Max Length is ${validatorProp.value}`;
            targetObj.errors['maxLength'] = true
            return;
          }
          break;

          case "pattern":
          if (!new RegExp(validatorProp.value).test(ele.value)) {
            ele.setCustomValidity(`Pattern mismatch`);
            error = true;
            targetObj.valid = false;
            targetObj.error = `Pattern mismatch`;
            targetObj.errors['pattern'] = true
            return;
          }
          break;

          case "min":
            if (parseInt(ele.value) <= validatorProp.value) {
              ele.setCustomValidity(`Min value is ${validatorProp.value}`);
              error = true;
              targetObj.valid = false;
              targetObj.error = `Min value is ${validatorProp.value}`;
              targetObj.errors['min'] = true
              return;
            }
            break;
            case "max":
              if (parseInt(ele.value) >= validatorProp.value) {
                ele.setCustomValidity(`Max value is ${validatorProp.value}`);
                error = true;
                targetObj.valid = false;
                targetObj.error = `Max value is ${validatorProp.value}`;
                targetObj.errors['max'] = true
                return;
              }
              break;
            case "email":
              if(!String(ele.value)
              .toLowerCase()
              .match(
                /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/
              )) {
                ele.setCustomValidity(`Invalid Email`);
                error = true;
                targetObj.valid = false;
                targetObj.error = `Invalid Email`;
                targetObj.errors['email'] = true
                return;
              }
              break;
        default:
          let cbResponse = validatorProp.value(ele.value);
          if(typeof cbResponse == 'boolean') {
            cbResponse = {
              error: cbResponse,
              msg: "Custom validation failed"
            }
          } else if(typeof cbResponse == 'string') {
            cbResponse = {
              error: !!cbResponse,
              msg: cbResponse
            }
          }
          if(cbResponse.error) {
            ele.setCustomValidity(cbResponse?.msg ? cbResponse?.msg: "Error");
            error = true;
            targetObj.valid = false;
            targetObj.error = cbResponse?.msg;
            targetObj.errors["custom"] = true 
          }
      }
    };
    if (!error) {
      if(ele.getAttribute("type") == 'radio') {
        const name = ele.getAttribute('name');
        const allRadioButton = this.form.elements[name];
        allRadioButton.forEach(ele => {
          ele.setCustomValidity("");
        })
      }
        ele.setCustomValidity("");
        targetObj.valid = true;
        targetObj.error = "";
        
    }
    this.formObj[this.objKey].valid = this.form.checkValidity();
  }

  updateTouchedProp(ele, objSelector, key) {
    ele.addEventListener("focus", (e) => {
      const obj = this.miniJSInstance.getValueFromkeyWithDot(this.formObj, objSelector)
      obj[key].touched = true;
    })
  }

  createMiniJSObj(obj, rest) {
    this.miniJSInstance = new MiniJs(obj, rest);
    this.miniJSInstance.init(obj);
  }

  getValues(obj = this.formObj[this.objKey].controls) {
    const result = {};
    for(let key in obj) {
      if(obj[key]?.controls) {
        result[key] = this.getValues(obj[key].controls);
      } else {
        result[key] = obj[key].value;
      }
    }
    return result;
  }

  patchValues(obj = {}, formObj = this.formObj[this.objKey]) {
    for(let key in obj) {
      if(typeof obj[key] == 'object') {
        this.patchValues(obj[key], formObj.controls[key]);
      } else {
        formObj.controls[key].value = obj[key];
      }
    }
  }

  buildForm(obj, options = {}) {
    // const instance = new MiniJsFormValidaion(options);

    this.formObj = {
      [this.objKey] : {
        controls: {

        }
      }
    }
    this.formObj = this.buildControls(obj, options);
  }
}
