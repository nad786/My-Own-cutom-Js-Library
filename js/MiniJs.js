class MiniJs {
  elements = [];
  listElements = {};
  listContainer = {};
  container = document;

  //don't execute when changed from keyup event
  inputFlag = true;
  constructor(obj, rest = {}) {
    const { parentSelector = "html", target = null } = rest;
    this.lib = ObservableSlim.create(obj, true, this.detectChanges.bind(this));
    this.container = document.querySelector(parentSelector);
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
    this.initForLoop(obj);
    this.performOperation(data);
    this.initInputChanges(data);
  }

  randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
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

  //perform all all operation based on action mapper
  performOperation(data) {
    data.forEach((item) => {
      const key = this.getMainKeyFromCurrentPath(item.currentPath);
      if (!item.currentPath.endsWith(".length")) {
        this.performLoopOperation(item, key);
        this.performAttributeAddOpeartaion(item, key);
        this.performTextOperation(item, key);
        this.performInputOperation(item, key);
        this.performClassOpeartion(item, key);
      }
      this.performIfStatementOperation(item, key);
    });
  }

  //class operation
  performClassOpeartion(item) {
    const elements = this.container.querySelectorAll(
      `[md-class*="${item.currentPath}"]`
    );
    if (elements.length) {
      elements.forEach((element) => {
        this.updateClassFromBindProperty(item, element);
      });
    }
  }

  updateClassFromBindProperty(item, ele) {
    const attr = ele.getAttribute("md-class");
    if (!attr.startsWith("{")) {
      attr.split(";").forEach((temp) => {
        temp = temp.split("=").map((temp) => temp.trim());
        this.addOrRemoveClassFromElement(this.lib, temp[1], temp[0], ele);
      });
    } else {
      const obj = JSON.parse(attr);
      for (let className in obj) {
        this.addOrRemoveClassFromElement(
          this.lib,
          obj[className],
          className,
          ele
        );
      }
    }
  }
  addOrRemoveClassFromElement(item, key, className, ele) {
    let flag = false;
    if (key.startsWith("!")) {
      flag = true;
      key = key.slice(1);
    }
    const val = this.getValueFromkeyWithDot(item, key);
    if (flag) {
      if (!val) {
        ele.classList.add(className);
      } else {
        ele.classList.remove(className);
      }
    } else {
      if (val) {
        ele.classList.add(className);
      } else {
        ele.classList.remove(className);
      }
    }
  }

  //attr opeartion
  performAttributeAddOpeartaion(item, key, ele) {
    const elements = this.container.querySelectorAll(
      `[md-attr*="${item.currentPath}"]`
    );
    if (elements.length) {
      elements.forEach((element) => {
        this.updateAttributeValueForAttr(item, element);
      });
    }
  }

  updateAttributeValueForAttr(item, element, key = "") {
    const multiAttr = element.getAttribute("md-attr").split(";");
    multiAttr.forEach((singleAttr) => {
      const attr = singleAttr.split("=").map((item) => item.trim());
      const val = this.getValueFromkeyWithDot(
        key ? item.newValue : this.lib,
        key ? key : attr[1]
      );
      if (val) {
        element.setAttribute(attr[0], val);
      }
    });
  }

  //if opeartion to perform 
  performIfStatementOperation(item) {
    const elements = this.container.querySelectorAll(
      `[md-if*="${item.currentPath}"]`
    );
    try {
      elements.forEach((ele) => {
        let attr = ele.getAttribute("md-if")
        let arr = attr.replaceAll(/[()]/g, '').split(/\s(&&|\|\|)\s/)
          .filter((item, index) => index % 2 == 0)
          .map((item) => {
            const temp = item.split(/[\s]*[!]*[=]*[==][\s]*/);
            return temp[0]?.[0] != "'" || temp[0]?.[0] != '"' || !isNaN(temp[0]) ? temp[0] : temp[1];
          })
          .map((item) => {
            if(item[0] == '!') {
              item = item.slice(1);
            }
            let val= this.getValueFromkeyWithDot(this.lib, item)
            const varName = "fnVar" + this.randomIntFromInterval(1,1000);
            attr = attr.replaceAll(item, varName);
            return `${varName}='${val}'`; 
          });
        let obj = { temp:  ""};
        console.log(arr);
        let func = new Function(...arr, `return ${attr}`);
        const display = ele.getAttribute("md-display") ?? "block";
        if (func.call(obj)) {
          ele.style.display = display;
        } else {
          ele.style.display = "none";
        }
      });
    } catch (err) {
      console.log(err);
    }

    

    // [`${item.currentPath}`, `!${item.currentPath}`].forEach((selector) => {
    //   const elements = this.container.querySelectorAll(`[md-if="${selector}"]`);
    //   if (elements.length) {
    //     elements.forEach((element) => {
    //       this.hideShowELement(item, element);
    //     });
    //   }
    // });
    // const elements = this.container.querySelectorAll(
    //   `[md-if^="${item.currentPath}"]`
    // );
    // if (elements.length) {
    //   elements.forEach((element) => {
    //     if(element.getAttribute('md-if').includes('=')) {
    //       this.hideShowELement(item, element);
    //     }
    //   });
    // }
  }

  hideShowELement(item, ele, flag = false) {
    const attr = ele.getAttribute("md-if");
    if (attr) {
      const display = ele.getAttribute("md-display") ?? "block";
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
          selector: "md-if",
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
      `[md-text="${item.currentPath}"]`
    );
    if (elements.length) {
      elements.forEach((element) => {
        this.modifyMdTextValue(item, element);
      });
    }
  }

  modifyMdTextValue(item, ele, flag = false) {
    this.performAllOperationForAllItsChildNodes({
      flag,
      item,
      ele,
      selector: "md-text",
      cb: (ele, val) => {
        ele.textContent = val;
      },
    });
  }

  //input opeartion
  performInputOperation(item) {
    const elements = this.container.querySelectorAll(
      `[md-input="${item.currentPath}"]:not([type="checkbox"],[type="radio"])`
    );
    if (elements.length) {
      elements.forEach((element) => {
        this.modifyMdInputValue(item, element);
      });
    } else {
      const elements = this.container.querySelectorAll(
        `[md-input="${item.currentPath}"][type="radio"]`
      );
      elements.forEach((element) => {
        if (element.value == item.newValue) {
          element.checked = true;
        }
      });

      const chechboxEle = this.container.querySelector(
        `[md-input="${item.currentPath}"][type="checkbox"]`
      );
      if (chechboxEle) {
        if (chechboxEle.value == item.newValue) {
          chechboxEle.checked = true;
        }
      }
    }
  }

  modifyMdInputValue(item, ele, flag = false) {
    if (this.inputFlag) {
      this.performAllOperationForAllItsChildNodes({
        flag,
        item,
        ele,
        selector: "md-input",
        cb: (ele, val) => {
          ele.value = val;
          const event = new Event("keyup");
          ele.dispatchEvent(event);
        },
      });
    }
  }

  performInputChangeEvent(e) {
    const attrArr = e.target.getAttribute("md-input").split(".");
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
    this.inputFlag = false;
    setTimeout(() => {
      this.inputFlag = true;
    }, 100);
  }

  initInputChanges(data) {
    if (this.container.querySelector("[md-input]")) {
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

  attachedEventToForm(key) {
    const elements = this.container.querySelectorAll(`[md-input="${key}"]`);
    if (elements.length) {
      elements.forEach((element) => {
        const typeattr = element.getAttribute("type");
        if (element.tagName == "INPUT" && (!typeattr || typeattr == "text")) {
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
      // const temp = data.map((item, index) => {
      //   return {
      //     type: "add",
      //     target: data,
      //     currentPath: `${nestedKey}${index}`,
      //     newValue: item,
      //   };
      // });
      if (nestedKey.endsWith("."))
        nestedKey = nestedKey.slice(0, nestedKey.length - 1);
      tempArr.push({
        type: "add",
        target: data,
        currentPath: `${nestedKey}`,
        newValue: data,
      });
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
          `[md-for="${targetKey}"]`
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
      // const temp = element.querySelector(`[md-text^="${item.currentPath}"]`);
      // const tempInput = element.querySelector(
      //   `[md-input^="${item.currentPath}"]`
      // );
      // const ifEle = element.querySelector(`[md-if^="${item.currentPath}"]`);
      // const ifNotEle = element.querySelector(`[md-if^="!${item.currentPath}"]`);
      // const attrEle = element.querySelector(
      //   `[md-attr^="!${item.currentPath}"]`
      // );
      // if (temp || tempInput || ifEle || ifNotEle || attrEle) {
      //   this.updatePropertyInLoop({ item, key });
      // } else {
      const ele = this.listElements[key][index].cloneNode(true);
      const varName = element.getAttribute("md-let");
      const filter = ele.getAttribute("md-filter");
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
        const varName = element.getAttribute("md-let");
        const filter = ele.getAttribute("md-filter");
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
      ele.setAttribute("md-filter", split.join("=="));
    }
    if (!equal) {
      return this.getValueFromkeyWithDot(this.lib, split[0]) != split[1];
    }
    return this.getValueFromkeyWithDot(this.lib, split[0]) == split[1];
  }

  updateAllPropertyToChildrenInLoop(item, ele, varName) {
    // if (ele.hasAttribute("md-for") || ele.querySelector("[md-for]")) {
    //   this.addNestedLoopOp(item, ele, item.currentPath, varName);
    // }
    const isCurrentValueisObject = typeof item.newValue == "object";
    const allNestedKeys = isCurrentValueisObject
      ? this.generateKeyWithDotSeperated(item.newValue)
      : [item.newValue];
    this.addAllAttributeToChildren("md-text", item, ele, varName);
    this.addAllAttributeToChildren("md-if", item, ele, varName);
    this.addAllAttributeToChildren("md-input", item, ele, varName);
    this.addAttrClassToChildred("md-attr", item, ele, varName, allNestedKeys);
    this.addAttrClassToChildred("md-class", item, ele, varName, allNestedKeys);
    const mainObj = { ...this.lib };
    allNestedKeys.forEach((currentKey) => {
      const obj = {
        ...item,
        newValue: mainObj,
        currentPath:
          item.currentPath + isCurrentValueisObject ? "" : "." + currentKey,
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
    const attr = ele.getAttribute(selector);
    if (attr) {
      if (attr.startsWith(varName + ".") || attr == varName) {
        ele.setAttribute(selector, attr.replace(varName, item.currentPath));
      }
    }
    const elements = ele.querySelectorAll(`[${selector}]`);
    elements.forEach((element) => {
      this.addAllAttributeToChildren(selector, item, element, varName);
    });
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
    const attr = ele.getAttribute("md-for");
    if (attr) {
      if (attr.startsWith(varName + ".")) {
        ele.setAttribute("md-for", attr.replace(varName, item.currentPath));
      }
      const values = this.getValueFromkeyWithDot(this.lib, key);
      const defaultNestedValues = this.generateDefaultObjectType(values);
      const node = ele.firstElementChild.cloneNode(true);
      ele.removeChild(ele.firstElementChild);
      defaultNestedValues.forEach((element) => {
        const clon = node.cloneNode(true);
        this.addNestedLoopAttribute(clon, "md-text", element.currentPath);
        this.addNestedLoopAttribute(clon, "md-input", element.currentPath);
        this.addNestedLoopAttribute(clon, "md-if", element.currentPath);
        ele.appendChild(clon);
      });
    } else {
      ele.querySelectorAll("[md-for]").forEach((element) => {
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
            `[md-text="${item.currentPath + "." + key}"]`
          );
          listEle.forEach((ele) => {
            const val = this.getValueFromkeyWithDot(item.newValue, key);
            ele.textContent = val;
          });
        });
      } else {
        const listEle = element.querySelectorAll(
          `[md-text="${item.currentPath}"]`
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
