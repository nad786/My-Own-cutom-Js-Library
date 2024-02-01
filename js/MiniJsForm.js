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

  static customValidation(cb) {
    return () => {
      return {name: 'custom', value: cb}
    }
  }
}

class Controls {
  value = "";
  ele = null;
  validators = [];
  constructor(values) {
    if (Array.isArray(values)) {
      this.value = values[0];
      this.validators = Array.isArray(values[1]) ? values[1] : [values[1]];
    } else {
      this.value = this.values;
    }
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
    let formObj = {
      [objKey]: {
        controls: {},
        valid: true,
      },
    };
    this.formObjReplicateWithControls = {
      [objKey]: {
        controls: {},
      },
    };
    for (let key in formControls) {
      this.formObjReplicateWithControls[objKey].controls[key] = formControls[key];
      this.formObj[this.objKey].controls[key] = {
        valid: true,
        touched: false,
        errors: [],
        value: this.formObjReplicateWithControls[objKey].controls[key].value,
        error: ""
      };
      const elements = this.form.querySelectorAll(`[formControlName="${key}"]`);
      elements.forEach(ele => {
        ele.setAttribute(
          `${this.prefix}input`,
          `${this.objKey}.controls.${key}.value`
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
        this.updateTouchedProp(ele, key);
        this.formValidation(formControls[key].validators, this.formObj[this.objKey].controls[key], ele)
      });

    }

    this.createMiniJSObj(this.formObj);

    ObservableSlim.observe(this.miniJSInstance.lib, (changes) => {
      this.validateElement(changes);
    });
    return this.miniJSInstance.lib;
  }

  validateElement(changes = []) {
    changes.forEach((item) => {
      const path = item.currentPath.split(".");
      path.pop();
      const validators = this.miniJSInstance.getValueFromkeyWithDot(
        this.formObjReplicateWithControls,
        path.join(".")
      )?.validators;
      const realObj = this.miniJSInstance.getValueFromkeyWithDot(
        this.miniJSInstance.lib,
        path.join(".")
      );
      const ele = this.form.querySelector(
        `[${this.prefix}input="${item.currentPath}"]`
      );
      
      if (validators?.length && ele) {
        this.formValidation(validators, realObj, ele);
      }
     
    });
  }

  formValidation(validationObj = [], targetObj = {}, ele) {
    let error = false;
    this.formObj[this.objKey].valid = false;
    for(let validation of validationObj) {
      const validatorProp = validation();
      switch (validatorProp?.name) {
        case "required":
          if(ele.getAttribute("type") == 'checkbox' && !ele.checked) {
            ele.setCustomValidity("Field is mandatory");
            error = true;
            targetObj.valid = false;
            targetObj.error = "Field is mandatory";
            targetObj.errors  = [{error: "Missing"}]
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
            targetObj.errors  = [{error: "Missing"}]
            return;
          }
          
        } if (!ele.value ) {
            ele.setCustomValidity("Field is mandatory");
            error = true;
            targetObj.valid = false;
            targetObj.error = "Field is mandatory";
            targetObj.errors  = [{error: "Missing"}]
            return;
          }
          break;
        case "minLength":
          if (ele.value.length < validatorProp.value) {
            ele.setCustomValidity(`Min Length is ${validatorProp.value}`);
            error = true;
            targetObj.valid = false;
            targetObj.error = `Min Length is ${validatorProp.value}`;
            return;
          }
          break;
        case "maxLength":
          if (ele.value.length > validatorProp.value) {
            ele.setCustomValidity(`Max Length is ${validatorProp.value}`);
            error = true;
            targetObj.valid = false;
            targetObj.error = `Max Length is ${validatorProp.value}`;
            return;
          }
          break;

          case "pattern":
          if (!new RegExp(validatorProp.value).test(ele.value)) {
            ele.setCustomValidity(`Pattern mismatch`);
            error = true;
            targetObj.valid = false;
            targetObj.error = `Pattern mismatch`;
            return;
          }
          break;

          case "min":
            if (parseInt(ele.value) <= validatorProp.value) {
              ele.setCustomValidity(`Min value is ${validatorProp.value}`);
              error = true;
              targetObj.valid = false;
              targetObj.error = `Min value is ${validatorProp.value}`;
              return;
            }
            break;
            case "max":
              if (parseInt(ele.value) >= validatorProp.value) {
                ele.setCustomValidity(`Max value is ${validatorProp.value}`);
                error = true;
                targetObj.valid = false;
                targetObj.error = `Max value is ${validatorProp.value}`;
                return;
              }
              break;
        default:
          let cbResponse = validatorProp.value(ele.value);
          if(typeof cbResponse == 'string') {
            cbResponse = {
              error: true,
              msg: "Custom validation failed"
            }
          }
          if(cbResponse.error) {
            ele.setCustomValidity(cbResponse?.msg ? cbResponse?.msg: "Error");
            error = true;
            targetObj.valid = false;
            targetObj.error = cbResponse?.msg;
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

  updateTouchedProp(ele, key) {
    ele.addEventListener("focus", (e) => {
      this.formObj[this.objKey].controls[key].touched = true;
    })
  }

  createMiniJSObj(obj, rest) {
    this.miniJSInstance = new MiniJs(obj, rest);
    this.miniJSInstance.init(obj);
  }

  getValues() {
    const formKey = this.form.getAttribute("formGroup");
    const result = {};
    for(let key in this.formObj[formKey].controls) {
      result[key] = this.formObj[formKey].controls[key].value;
    }
    return result;
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
