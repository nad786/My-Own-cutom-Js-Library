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
  constructor(value, validdator = []) {
    this.value = value;
    const validatorFn = Array.isArray(validdator) ? validdator : [validdator];
    this.validators = validatorFn.map((fn) => fn());
  }
}
class MiniJsFormValidaion {
  form = null;
  prefix = "md-";
  formObj = {};
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
          errors: [],
          value: formControls[key].value,
          error: "",
          validators: formControls[key].validators,
        };
        //update key for input events
        const currentPath = `${objSelector}.${key}.value`;
        this.allControlKeysForEvent.push({currentPath, newValue: formControls[key].value});

        // const elements = this.form.querySelectorAll(`${selector ? selector :"div:not([formGroupName])"}  [formControlName="${key}"]`);
        const elements = document.querySelectorAll(
          `form[formGroup="${this.objKey}"] ${
            selector ? selector : ":not([formGroupName])"
          }  [formControlName="${key}"]`
        );
        if (elements.length) {
          elements.forEach((ele) => {
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
            this.updateTouchednDirtyProp(ele, objSelector, key);
            this.formValidation(
              formControls[key].validators,
              obj.controls[key],
              ele
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

        if (realObj?.validators?.length) {
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
      custom: false,
    };
    for (let validatorProp of validationObj) {
      // const validatorProp = validation();
      switch (validatorProp?.name) {
        case "required":
          if (ele.getAttribute("type") == "checkbox" && !ele.checked) {
            ele.setCustomValidity("Mandatory Field");
            error = true;
            targetObj.valid = false;
            targetObj.error = "Mandatory Field";
            targetObj.errors["required"] = true;
            return;
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
              ele.setCustomValidity("Mandatory Field");
              error = true;
              targetObj.valid = false;
              targetObj.error = "Mandatory Field";
              targetObj.errors["required"] = true;
              return;
            }
          }
          if (!ele.value) {
            ele.setCustomValidity("Mandatory Field");
            error = true;
            targetObj.valid = false;
            targetObj.error = "Mandatory Field";
            targetObj.errors["required"] = true;
            return;
          }
          break;
        case "minLength":
          if (ele.value.length < validatorProp.value) {
            ele.setCustomValidity(`Min Length is ${validatorProp.value}`);
            error = true;
            targetObj.valid = false;
            targetObj.error = `Min Length is ${validatorProp.value}`;
            targetObj.errors["minLength"] = true;
            return;
          }
          break;
        case "maxLength":
          if (ele.value.length > validatorProp.value) {
            ele.setCustomValidity(`Max Length is ${validatorProp.value}`);
            error = true;
            targetObj.valid = false;
            targetObj.error = `Max Length is ${validatorProp.value}`;
            targetObj.errors["maxLength"] = true;
            return;
          }
          break;

        case "pattern":
          if (!new RegExp(validatorProp.value).test(ele.value)) {
            ele.setCustomValidity(`Pattern mismatch`);
            error = true;
            targetObj.valid = false;
            targetObj.error = `Pattern mismatch`;
            targetObj.errors["pattern"] = true;
            return;
          }
          break;

        case "min":
          if (parseInt(ele.value) <= validatorProp.value) {
            ele.setCustomValidity(`Min value is ${validatorProp.value}`);
            error = true;
            targetObj.valid = false;
            targetObj.error = `Min value is ${validatorProp.value}`;
            targetObj.errors["min"] = true;
            return;
          }
          break;
        case "max":
          if (parseInt(ele.value) >= validatorProp.value) {
            ele.setCustomValidity(`Max value is ${validatorProp.value}`);
            error = true;
            targetObj.valid = false;
            targetObj.error = `Max value is ${validatorProp.value}`;
            targetObj.errors["max"] = true;
            return;
          }
          break;
        case "email":
          if (
            !String(ele.value)
              .toLowerCase()
              .match(/^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/)
          ) {
            ele.setCustomValidity(`Invalid Email`);
            error = true;
            targetObj.valid = false;
            targetObj.error = `Invalid Email`;
            targetObj.errors["email"] = true;
            return;
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
            ele.setCustomValidity(cbResponse?.msg ? cbResponse?.msg : "Error");
            error = true;
            targetObj.valid = false;
            targetObj.error = cbResponse?.msg;
            targetObj.errors["custom"] = true;
          }
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
    this.formObj[this.objKey].valid = this.form.checkValidity();
  }

  updateTouchednDirtyProp(ele, objSelector, key) {
    ele.addEventListener("focus", (e) => {
      const obj = this.miniJSInstance.getValueFromkeyWithDot(
        this.formObj,
        objSelector
      );
      obj[key].touched = true;
    });

    ele.addEventListener("keypress", (e) => {
      const obj = this.miniJSInstance.getValueFromkeyWithDot(
        this.formObj,
        objSelector
      );
      obj[key].dirty = true;
    });
    
  }

  createMiniJSObj(obj, rest) {
    this.miniJSInstance = new MiniJs(obj, rest);
    const data = this.miniJSInstance.generateDefaultObjectType(obj);

    // this.initForLoop(obj);
    this.miniJSInstance.performOperation(data);
    this.miniJSInstance.initInputChanges(this.allControlKeysForEvent);
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

  static buildForm(obj, options = {}) {
    // const instance = new MiniJsFormValidaion(options);
    const instance = new MiniJsFormValidaion();
    instance.formObj = {
      [instance.objKey]: {
        controls: {},
      },
    };
    instance.formObj = instance.buildControls(obj, {...options, parentSelector: (options?.selector ? options.selector : "form")});
    return {patchValues: instance.patchValues.bind(instance), getValues: instance.getValues.bind(instance), [instance.objKey]: instance.formObj[instance.objKey]};
  }
}
