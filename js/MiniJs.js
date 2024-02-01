class MiniJs {
  prefix = "";
  elements = [];
  listElements = {};
  listContainer = {};
  container = document;
  allKey = [];
  constructor(obj, rest = {}) {
    const { parentSelector = "html", prefix = "md-" } = rest;
    this.lib = ObservableSlim.create(obj, true, this.detectChanges.bind(this));
    this.container = document.querySelector(parentSelector);
    this.prefix = prefix;
  }

  detectChanges(data) {
    if (data.length == 1 && typeof data[0].newValue == "object") {
      let item;
      let currentPath = data[0].currentPath;
      let isArray = Array.isArray(data[0].newValue) || !isNaN(data[0].property);
      if (isArray) {
        item = data;
        item.push({
          type: "add",
          newValue: data[0].newValue.length,
          currentPath: `${data[0].currentPath}.length`,
          target: data[0],
        });
      } else {
        let split = currentPath.split(".");
        let targetKey = currentPath;
        if (split.length > 1) {
          targetKey = split.pop();
        }
        item = this.generateDefaultObjectType(
          this.getValueFromkeyWithDot(data[0].target, targetKey),
          currentPath
        );
      }
      this.performOperation(item);
    } else {
      this.performOperation(data);
    }
  }

  //common Operation
  init(obj) {
    // this.mappedActionForPerformance(obj);
    const data = this.generateDefaultObjectType(obj);
    data.forEach((item) => {
      this.allKey.push(item.currentPath);
    });
    this.initForLoop(obj);
    this.performOperation(data);
    this.initInputChanges(data);
  }

  initClassAndAttributeValue() {
    this.container.querySelectorAll();
    // if (this.container.querySelector(`[${this.prefix}input]`)) {
    //   this.addFormEventToResetitsValue();
    //   data.forEach((item) => {
    //     if (item.property != "length") {
    //       if (typeof item.newValue == "object") {
    //         const mainKey = item.currentPath;
    //         const objKeys = this.generateKeyWithDotSeperated(item.newValue);
    //         objKeys.forEach((key) => {
    //           const keyForEvent = `${mainKey}.${key}`;
    //           this.attachedEventToForm(keyForEvent);
    //         });
    //       } else {
    //         const key = item.currentPath;
    //         this.attachedEventToForm(key);
    //       }
    //     }
    //   });
    // }
  }

  convertStringToFunction(str) {
    const arr = str
      .replaceAll(/[\s+()]/g, "")
      .replaceAll(/(&&|\|\|)/g, "__")
      .replaceAll(/(!*)(=+)/g, "__")
      .split("__")
      .filter((item) => item[0] != '"' && item[0] != "'" && isNaN(item))
      .map((item) => {
        if (item[0] == "!") {
          item = item.replaceAll("!", "");
        }
        let val = this.getValueFromkeyWithDot(this.lib, item);
        let varName = item;
        if (item.includes(".")) {
          varName = "fnVar" + this.randomIntFromInterval(1, 1000);
          str = str.replaceAll(item, varName);
        }
        if (isNaN(val) || val === "") {
          return `${varName}='${val}'`;
        }
        return `${varName}=${val}`;
      });
    return new Function(...arr, `return ${str}`);
  }

  randomIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  performAllOperationForAllItsChildNodes({
    item,
    ele,
    selector,
    cb,
    flag = false,
  }) {
    let textKey = ele.getAttribute(`${selector}`);
    if (textKey) {
      if (textKey.startsWith("!")) {
        textKey = textKey.slice(1);
      }
      let val = this.getValueFromkeyWithDot(item.newValue, textKey);
      cb(ele, val);
    } else {
      const nodes = ele.querySelectorAll(`[${selector}]`);
      nodes.forEach((node) => {
        this.performAllOperationForAllItsChildNodes({
          item,
          ele: node,
          selector,
          cb,
          flag,
        });
      });
    }
  }


  replaceAllKeyToValueWithRegex(attr) {
  
    const matches = this.getAllKeyFromAttrWithBraces(attr);
    matches.forEach(key => {
      if(key) {
        const regex = new RegExp(`{{\\s*(${key}?)\\s*}}`);
        if(regex.exec(attr)) {
          attr = attr.replace(regex, (match, variable) => {
            const result = this.getValueFromkeyWithDot(this.lib, key)
            return (result || result ==0 ) ? result : "";
          });
        }
      }
    });
    return attr;
  }


  getAllKeyFromAttrWithBraces(attr) {
    const pattern = /\{\{(.+?)\}\}/g;
    let matches = [];
    let match;
    while ((match = pattern.exec(attr)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }


  //perform all all operation based on action mapper
  performOperation(data) {
    data.forEach((item) => {
      const key = this.getMainKeyFromCurrentPath(item.currentPath);
      if (!item.currentPath.endsWith(".length")) {
        this.performLoopOperation(item, key);
        this.performAttributeAddOpeartaion(item, key);
        this.performTextOperation(item, key);
        this.performInputOperation(item, key);
        this.performDisabledValue(item)
      }
      this.performClassOpeartion(item, key);
      this.performIfStatementOperation(item, key);
    });
  }

  //md-disabled
  performDisabledValue(item) {
    const elements = this.container.querySelectorAll(
      `[${this.prefix}enabled="${item.currentPath}"]`
    );
    elements.forEach((element) => {
      if(this.getValueFromkeyWithDot(this.lib, item.currentPath)) {
        element.disabled = false;
      } else {
        element.disabled = true;
      }
    });


  }

  //class operation
  performClassOpeartion(item) {
    const elements = this.container.querySelectorAll(
      `[${this.prefix}class*="${item.currentPath}"]`
    );
    elements.forEach((element) => {
      this.updateClassFromBindProperty(element);
    });
  }

  updateClassFromBindProperty(ele) {
    const attr = ele.getAttribute(`${this.prefix}class`);
    if (!attr.startsWith("{")) {
      attr.split(";").forEach((temp) => {
        const tempArr = temp.split("=").map((temp) => temp.trim());
        temp = temp.substring(temp.indexOf("=") + 1);
        const className = this.removeQuoteAndDoubleQuote(tempArr[0]);
        this.addOrRemoveClassFromElement(temp.trim(), className, ele);
      });
    } else {
      const obj = JSON.parse(attr);
      for (let className in obj) {
        this.addOrRemoveClassFromElement(obj[className], className, ele);
      }
    }
  }

  removeQuoteAndDoubleQuote(str) {
    return str.replace(/['"]+/g, "");
  }

  addOrRemoveClassFromElement(key, className, ele) {
    const func = this.convertStringToFunction(key);
    if (func()) {
      ele.classList.add(className);
    } else {
      ele.classList.remove(className);
    }
  }

  //attr opeartion
  performAttributeAddOpeartaion(item, key, ele) {
    const elements = this.container.querySelectorAll(
      `[${this.prefix}attr*="${item.currentPath}"]`
    );
    if (elements.length) {
      elements.forEach((element) => {
        this.updateAttributeValueForAttr(item, element);
      });
    }
  }

  updateAttributeValueForAttr(item, element, key = "") {
    const multiAttr = element.getAttribute(`${this.prefix}attr`).split(";");
    multiAttr.forEach((singleAttr) => {
      const attr = singleAttr.split("=").map((item) => item.trim());
      let val = this.getValueFromkeyWithDot(
        key ? item.newValue : this.lib,
        key ? key : attr[1]
      );
      if (val) {
        const attrName = this.removeQuoteAndDoubleQuote(attr[0]);
        element.setAttribute(attrName, val);
      }
    });
  }

  //if opeartion to perform
  performIfStatementOperation(item) {
    const elements = this.container.querySelectorAll(
      `[${this.prefix}if*="${item.currentPath}"]`
    );
    try {
      elements.forEach((ele) => {
        let attr = ele.getAttribute(`${this.prefix}if`);
        // let arr = attr
        //   .replaceAll(/[\s+()]/g, "")
        //   .replaceAll(/(&&|\|\|)/g, "__")
        //   .replaceAll(/(!*)(=+)/g, "__")
        //   .split('__')
        //   .filter(item => item[0] != '"' && item[0] != "'" && isNaN(item))
        //   .map((item) => {
        //     if (item[0] == "!") {
        //       item = item.replaceAll("!", "");
        //     }
        //     let val = this.getValueFromkeyWithDot(this.lib, item);
        //     let varName = item;
        //     if (item.includes(".")) {
        //       varName = "fnVar" + this.randomIntFromInterval(1, 1000);
        //       attr = attr.replaceAll(item, varName);
        //     }
        //     if(isNaN(val)) {
        //       return `${varName}='${val}'`;
        //     }
        //     return `${varName}=${val}`;
        //   });
        // console.log(arr);
        // let func = new Function(...arr, `return ${attr}`);
        let func = this.convertStringToFunction(attr);
        const display = ele.getAttribute(`${this.prefix}display`) ?? "initial";
        if (func()) {
          ele.style.display = display;
        } else {
          ele.style.display = "none";
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  hideShowELement(item, ele, flag = false) {
    const attr = ele.getAttribute(`${this.prefix}if`);
    if (attr) {
      const display = ele.getAttribute(`${this.prefix}display`) ?? "initial";
      if (attr.includes("=")) {
        const data = this.checkCondition(item, ele, "", attr, false);
        if (data) {
          ele.style.display = display;
        } else {
          ele.style.display = "none";
        }
      } else {
        this.performAllOperationForAllItsChildNodes({
          flag,
          item,
          ele,
          selector: `${this.prefix}if`,
          cb: (ele, val) => {
            if ((val && attr[0] != "!") || (!val && attr[0] == "!")) {
              ele.style.display = display;
            } else {
              ele.style.display = "none";
            }
          },
        });
      }
    }
  }

  //text opeartion
  performTextOperation(item) {
    const elements = this.container.querySelectorAll(
      `[${this.prefix}text*="${item.currentPath}"]`
    );
    if (elements.length) {
      elements.forEach((element) => {
        this.modifyMdTextValue(item, element);
      });
    }
  }

  modifyMdTextValue(item, ele, flag = false) {
    let attr = ele.getAttribute(`${this.prefix}text`);
    if(!attr) {
      const elements = ele.querySelectorAll(`[${this.prefix}text]`);
      elements.forEach(element => {
        this.modifyMdTextValue(item, element, flag);
      });
      return;
    }
    let val;
    if (attr == item.currentPath) {
      val = this.getValueFromkeyWithDot(this.lib, attr);

    } else if (!flag && attr?.includes("{{")) {
        val = this.replaceAllKeyToValueWithRegex(attr, this.allKey);
    } else {
      return;
    }

    ele.textContent = val;
  }

  //input opeartion
  performInputOperation(item) {
    const elements = this.container.querySelectorAll(
      `[${this.prefix}input="${item.currentPath}"]:not([type="checkbox"],[type="radio"])`
      // `[${this.prefix}input="${item.currentPath}"]`
    );
    if (elements.length) {
      elements.forEach((element) => {
        this.modifyMdInputValue(item, element);
      });
    } else {
      const elements = this.container.querySelectorAll(
        `[${this.prefix}input="${item.currentPath}"][type="radio"]`
      );
      elements.forEach((element) => {
        if (element.value == item.newValue) {
          element.checked = true;
        }
      });

      const chechboxEle = this.container.querySelector(
        `[${this.prefix}input="${item.currentPath}"][type="checkbox"]`
      );
      if (chechboxEle) {
        if (chechboxEle.value == item.newValue) {
          chechboxEle.checked = true;
        }
      }
    }
  }

  modifyMdInputValue(item, ele, flag = false) {
    this.performAllOperationForAllItsChildNodes({
      flag,
      item,
      ele,
      selector: `${this.prefix}input`,
      cb: (ele, val) => {
        ele.value = val;
        // const event = new Event("change");
        // ele.dispatchEvent(event);
      },
    });
  }

  performInputChangeEvent(e) {
    const attrArr = e.target.getAttribute(`${this.prefix}input`).split(".");
    const targetKey = attrArr.pop();
    let obj = this.lib;
    attrArr.forEach((item) => {
      obj = obj?.[item];
    });
    if (e.target.type == "checkbox" || e.target.type == "radio") {
      if (e.target.checked) {
        obj[targetKey] = e.target.value;
      } else {
        obj[targetKey] = "";
      }
    } else {
      obj[targetKey] = e.target.value;
    }
  }

  initInputChanges(data) {
    if (this.container.querySelector(`[${this.prefix}input]`)) {
      this.addFormEventToResetitsValue();
      data.forEach((item) => {
        if (item.property != "length") {
          if (typeof item.newValue == "object") {
            const mainKey = item.currentPath;
            const objKeys = this.generateKeyWithDotSeperated(item.newValue);
            objKeys.forEach((key) => {
              const keyForEvent = `${mainKey}.${key}`;
              this.attachedEventToForm(keyForEvent);
            });
          } else {
            const key = item.currentPath;
            this.attachedEventToForm(key);
          }
        }
      });
    }
  }

  // //nad-form
  addFormEventToResetitsValue() {
    const forms = this.container.querySelectorAll("form");
    forms.forEach((myForm) => {
      myForm.addEventListener("reset", (e) => {
        const elements = e.target.querySelectorAll(`[${this.prefix}input]`);
        elements.forEach((element) => {
          const attrArr = element
            .getAttribute(`${this.prefix}input`)
            .split(".");
          const targetKey = attrArr.pop();
          let obj = this.lib;
          attrArr.forEach((item) => {
            obj = obj?.[item];
          });
          obj[targetKey] = "";
        });
      });
    });
  }

  attachedEventToForm(key) {
    const elements = this.container.querySelectorAll(
      `[${this.prefix}input="${key}"]`
    );
    if (elements.length) {
      elements.forEach((element) => {
        const typeattr = element.getAttribute("type");
        // if (element.tagName == "INPUT" && (!typeattr || typeattr == "text")) {
          if (element.tagName == "INPUT" && (!typeattr || typeattr != "radio" || typeattr != "checkbox")) {
          element.removeEventListener(
            "keyup",
            this.performInputChangeEvent.bind(this)
          );
          element.addEventListener(
            "keyup",
            this.performInputChangeEvent.bind(this)
          );
        } else {
          element.removeEventListener(
            "change",
            this.performInputChangeEvent.bind(this)
          );
          element.addEventListener(
            "change",
            this.performInputChangeEvent.bind(this)
          );

          if (element.tagName == "SELECT" && typeof jQuery != "undefined") {
            jQuery(this.container).on("select2:select", element, (e) => {
              this.performInputChangeEvent(e);
            });
          }
        }
      });
    }
  }

  //utility function
  //get first key of curretn path
  getMainKeyFromCurrentPath(currentPath) {
    let key = currentPath.split(".");
    if (key.length > 1) {
      key = currentPath.split(".");
      if (!isNaN(key[key.length - 1])) {
        key.pop();
      }
    }
    return key.join(".");
  }

  getValueFromkeyWithDot(obj, key) {
    if (typeof obj == "object") {
      key.split(".").map((item) => {
        obj = obj?.[item];
      });
    }
    return obj;
  }

  generateDefaultObjectType(data, nestedKey = "") {
    let tempArr = [];
    if (nestedKey) nestedKey += ".";
    if (Array.isArray(data)) {
      const temp = data.map((item, index) => {
        return {
          type: "add",
          target: data,
          currentPath: `${nestedKey}${index}`,
          newValue: item,
        };
      });
      if (nestedKey.endsWith(".")) {
        nestedKey = nestedKey.slice(0, nestedKey.length - 1);
      }
      tempArr = [...tempArr, ...temp];  
      // tempArr.push({
      //   type: "add",
      //   target: data,
      //   currentPath: `${nestedKey}`,
      //   newValue: data,
      // });
      tempArr.push({
        type: "add",
        target: data,
        currentPath: `${nestedKey}.length`,
        newValue: data.length,
      });
      return tempArr;
    } else {
      for (let item in data) {
        if (typeof data[item] == "object") {
          const temp = this.generateDefaultObjectType(
            data[item],
            nestedKey + item
          );
          tempArr = [...tempArr, ...temp];
        } else {
          tempArr.push({
            type: "add",
            target: data,
            currentPath: `${nestedKey}${item}`,
            newValue: data[item],
          });
        }
      }
      return tempArr;
    }
  }

  generateKeyWithDotSeperated(obj = {}, key = "") {
    if (key) {
      key += ".";
    }
    let keys = [];
    if (typeof obj == "object" && !Array.isArray(obj)) {
      for (let item in obj) {
        const tempKeys = this.generateKeyWithDotSeperated(
          obj[item],
          key + item
        );
        keys = [...keys, ...tempKeys];
      }
    }
    if (key) {
      keys.push(key.slice(0, key.lastIndexOf(".")));
    }
    return keys;
  }

  removeAllchildNodes(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  //loop operation
  performLoopEachItem({ item, key, elements }) {
    if (item.type == "add") {
      this.addPropertyInLoop({ item, key, elements });
    } else if (item.type == "update") {
      this.updatePropertyInLoop({ item, key, elements });
    } else if (item.type == "delete") {
      this.deletePropertInLoop({ item, key, elements });
    }
  }

  initForLoop(obj, key = "") {
    if (key) key += ".";
    for (let item in obj) {
      if (Array.isArray(obj[item])) {
        const targetKey = key + item;
        const forList = this.container.querySelectorAll(
          `[${this.prefix}for="${targetKey}"]`
        );
        forList.forEach((element) => {
          if (!this.listContainer[targetKey]) {
            this.listContainer[targetKey] = [];
            this.listElements[targetKey] = [];
          }
          const clonEle = element.firstElementChild.cloneNode(true);
          this.listContainer[targetKey].push(element);
          this.listElements[targetKey].push(clonEle);
          this.removeAllchildNodes(element);
          // element.removeChild(element.firstElementChild);
        });
      } else if (typeof obj[item] == "object") {
        this.initForLoop(obj[item], key + item);
      }
    }
  }

  performLoopOperation(item, key) {
    if (this.listContainer[key]) {
      this.performLoopEachItem({
        item,
        key,
        elements: this.listContainer[key],
      });
    }
  }

  addPropertyInLoop({ item, key, elements }) {
    elements.forEach((element, index) => {
      const ele = this.listElements[key][index].cloneNode(true);
      const varName = element.getAttribute(`${this.prefix}let`);
      const filter = ele.getAttribute(`${this.prefix}filter`);
      if (Array.isArray(item.newValue)) {
        const frag = document.createDocumentFragment();
        item.newValue.forEach((tempItem, idx) => {
          const ele = this.listElements[key][index].cloneNode(true);
          const obj = {
            ...item,
            currentPath: item.currentPath + "." + idx,
            newValue: tempItem,
          };
          if (filter && !this.checkCondition(obj, ele, varName, filter)) {
            return;
          }
          this.updateAllPropertyToChildrenInLoop(obj, ele, varName);
          frag.appendChild(ele);
        });
        element.appendChild(frag);
      } else {
        const varName = element.getAttribute(`${this.prefix}let`);
        const filter = ele.getAttribute(`${this.prefix}filter`);
        if (filter && !this.checkCondition(item, ele, varName, filter)) {
          return;
        }
        this.updateAllPropertyToChildrenInLoop(item, ele, varName);
        element.appendChild(ele);
      }
      // }
    });
  }

  checkCondition(item, ele, key, filter, fromLoop = true) {
    let equal = true;
    let split = filter.split("==").map((item) => item.trim());
    if (split.length == 1) {
      equal = false;
      split = filter.split("!=").map((item) => item.trim());
    }
    if (fromLoop) {
      if (split[0].startsWith(key + ".")) {
        split[0] = split[0].replace(key, item.currentPath);
      }
      ele.setAttribute(`${this.prefix}filter`, split.join("=="));
    }
    if (!equal) {
      return this.getValueFromkeyWithDot(this.lib, split[0]) != split[1];
    }
    return this.getValueFromkeyWithDot(this.lib, split[0]) == split[1];
  }

  updateAllPropertyToChildrenInLoop(item, ele, varName) {
    const isCurrentValueisObject = typeof item.newValue == "object";
    const allNestedKeys = isCurrentValueisObject
      ? this.generateKeyWithDotSeperated(item.newValue)
      : [item.newValue];
    this.addAllAttributeToChildren(`${this.prefix}text`, item, ele, varName);
    this.addAllAttributeToChildren(`${this.prefix}if`, item, ele, varName);
    this.addAllAttributeToChildren(`${this.prefix}input`, item, ele, varName);
    this.addAttrClassToChildred(
      `${this.prefix}attr`,
      item,
      ele,
      varName,
      allNestedKeys
    );
    this.addAttrClassToChildred(
      `${this.prefix}class`,
      item,
      ele,
      varName,
      allNestedKeys
    );
    const mainObj = { ...this.lib };
    allNestedKeys.forEach((currentKey) => {
      const obj = {
        ...item,
        newValue: mainObj,
        currentPath:
          item.currentPath + "." + currentKey,
      };
      this.modifyMdInputValue(obj, ele, true);
      this.modifyMdTextValue(obj, ele, true);
      this.hideShowELement(obj, ele, true);
    });

    // this.performIfStatementOperation
  }

  addAttrClassToChildred(selector, item, ele, varName, keys) {
    const attr = ele.getAttribute(selector);
    if (attr) {
      if (attr.includes(varName)) {
        const arr = attr.split(";").map((temp) => {
          temp = temp.split("=").map((temp) => temp.trim());
          if (temp[1] == varName || temp[1].startsWith(varName + ".")) {
            temp[1] = temp[1].replace(varName, item.currentPath);
          }
          return temp;
        });
        ele.setAttribute(selector, arr.map((item) => item.join("=")).join(";"));
      }
    }
    const elements = ele.querySelectorAll(`[${selector}]`);
    elements.forEach((element) => {
      this.addAttrClassToChildred(selector, item, element, varName, keys);
    });
  }

  addAllAttributeToChildren(selector, item, ele, varName) {
    let attr = ele.getAttribute(selector);
    if (attr) {
      if (attr == varName) {
        ele.setAttribute(selector, attr.replace(varName, item.currentPath));
      } else if (
        attr.startsWith(varName + ".") ||
        (selector == `${this.prefix}if` && attr.startsWith("!" + varName + "."))
      ) {
        ele.setAttribute(
          selector,
          attr.replaceAll(varName + ".", item.currentPath + ".")
        );
      } else if(attr && attr.includes("{{")) {
        attr = this.replaceVarNameInStringLiteral(varName, attr, item.currentPath);
        ele.setAttribute(
          selector,
          attr
        );
      }
    }
    const elements = ele.querySelectorAll(`[${selector}]`);
    elements.forEach((element) => {
      this.addAllAttributeToChildren(selector, item, element, varName);
    });
  }

  //replace attr name with {{name.key}}
  replaceVarNameInStringLiteral(varName, attr, currentPath) {


    const matches = this.getAllKeyFromAttrWithBraces(attr);
    matches.forEach(key => {
      if(key) {
        const regex = new RegExp(`{{\\s*(${key}?)\\s*}}`);
        if(regex.exec(attr)) {
          attr = attr.replace(regex, (match, variable) => {
            const result = match.replace(varName, currentPath);
            return (result || result ==0 ) ? result : match;
          });
        }
      }
    });

    // let teampArr1 = attr.split("{{");
    // let teampArr2 = teampArr1[1].split("}}");
    // let actualVarName = teampArr2[0];
    // teampArr2[0] = actualVarName.split(".").map(item => {
    //   if(item == varName) {
    //     return currentPath;
    //   }
    //   return item;
    // }).join(".");
    // teampArr1[1] = teampArr2.join("}}")
    // return teampArr1.join("{{")
    return attr;
  }

  //attr for attr and class
  addAttrInLoop(item, element, key, selector, cb) {
    let attrVal = element.getAttribute(selector);
    if (attrVal?.includes(key)) {
      let flag = false;
      let path = "";
      const list = attrVal.split(";").map((temp) => {
        temp = temp.split("=").map((temp) => temp.trim());
        if (temp[1] == key) {
          flag = true;
          path = item.currentPath + "." + key;
          temp[1] = path;
        }
        return temp;
      });
      if (flag) {
        cb(item, list, element, key);
      }
    }
  }

  addNestedLoopOp(item, ele, key, varName) {
    const attr = ele.getAttribute(`${this.prefix}for`);
    if (attr) {
      if (attr.startsWith(varName + ".")) {
        ele.setAttribute(
          `${this.prefix}for`,
          attr.replace(varName, item.currentPath)
        );
      }
      const values = this.getValueFromkeyWithDot(this.lib, key);
      const defaultNestedValues = this.generateDefaultObjectType(values);
      const node = ele.firstElementChild.cloneNode(true);
      ele.removeChild(ele.firstElementChild);
      defaultNestedValues.forEach((element) => {
        const clon = node.cloneNode(true);
        this.addNestedLoopAttribute(
          clon,
          `${this.prefix}text`,
          element.currentPath
        );
        this.addNestedLoopAttribute(
          clon,
          `${this.prefix}input`,
          element.currentPath
        );
        this.addNestedLoopAttribute(
          clon,
          `${this.prefix}if`,
          element.currentPath
        );
        ele.appendChild(clon);
      });
    } else {
      ele.querySelectorAll(`[${this.prefix}for]`).forEach((element) => {
        console.log(element);
      });
    }
  }

  addNestedLoopAttribute(ele, selector, path) {
    if (ele.hasAttribute(selector)) {
      const key = ele.getAttribute(selector);
      ele.setAttribute(selector, path + `${key ? "." + key : ""}`);
    } else {
      const elements = ele.querySelectorAll(`[${selector}]`);
      elements.forEach((element) => {
        this.addNestedLoopAttribute(element, selector, path);
      });
    }
  }

  updatePropertyInLoop({ item, key, elements }) {
    this.listContainer[key].forEach((element, index) => {
      if (Array.isArray(item.newValue)) {
        this.removeAllchildNodes(element);
        this.addPropertyInLoop({ item, key, elements: [element] });
      } else if (typeof item.newValue == "object") {
        const keys = this.generateKeyWithDotSeperated(item.newValue);
        keys.forEach((key) => {
          const listEle = element.querySelectorAll(
            `[${this.prefix}text="${item.currentPath + "." + key}"]`
          );
          listEle.forEach((ele) => {
            const val = this.getValueFromkeyWithDot(item.newValue, key);
            ele.textContent = val;
          });
        });
      } else {
        const listEle = element.querySelectorAll(
          `[${this.prefix}text="${item.currentPath}"]`
        );
        listEle.forEach((ele) => {
          ele.textContent = item.newValue;
        });
      }
    });
  }

  deletePropertInLoop({ item, key, elements }) {
    this.listContainer[key].forEach((ele) => {
      const nodes = ele.children;
      ele.removeChild(nodes[item.property]);
    });
  }

  static create(obj, rest = {}) {
    const instance = new MiniJs(obj, rest);
    instance.init(obj);
    return instance.lib;
  }

  
}
