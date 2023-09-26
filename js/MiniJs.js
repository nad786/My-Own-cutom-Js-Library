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
    this.init(obj);
  }

  detectChanges(data) {
    if (data.length == 1 && Array.isArray(data[0].newValue)) {
      const key = data[0].currentPath.includes(".")
        ? this.getMainKeyFromCurrentPath(data[0].currentPath)
        : "";
      const temp = this.generateDefaultObjectType(data[0].target, key);
      this.performOperation([data[0], ...temp]);
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
      // if (textKey && typeof item.newValue == "object") {
      //   if (textKey.startsWith("!")) {
      //     textKey = textKey.slice(1);
      //   }
      //   let val = this.getValueFromkeyWithDot(item.newValue, textKey);
      //   cb(ele, val);
      // } else {
      //   cb(ele, item.newValue);
      // }
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
        this.performTextOperation(item, key);
        this.performInputOperation(item, key);
        this.performAttributeAddOpeartaion(item, key);
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

  //if opeartion
  performIfStatementOperation(item) {
    [`${item.currentPath}`, `!${item.currentPath}`].forEach((selector) => {
      const elements = this.container.querySelectorAll(`[md-if="${selector}"]`);
      if (elements.length) {
        elements.forEach((element) => {
          this.hideShowELement(item, element);
        });
      }
    });
  }

  hideShowELement(item, ele, flag = false) {
    this.performAllOperationForAllItsChildNodes({
      flag,
      item,
      ele,
      selector: "md-if",
      cb: (ele, val) => {
        const attr = ele.getAttribute("md-if");
        const display = ele.getAttribute("md-display") ?? "block";
        if ((val && attr[0] != "!") || (!val && attr[0] == "!")) {
          ele.style.display = display;
        } else {
          ele.style.display = "none";
        }
      },
    });
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
      `[md-input="${item.currentPath}"]`
    );
    if (elements.length) {
      elements.forEach((element) => {
        this.modifyMdInputValue(item, element);
      });
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
          var event = new Event("keyup");
          ele.dispatchEvent(event);
        },
      });
    }
  }

  performInputKeyUpEvent(e) {
    const attrArr = e.target.getAttribute("md-input").split(".");
    const targetKey = attrArr.pop();
    let obj = this.lib;
    attrArr.forEach((item) => {
      obj = obj?.[item];
    });
    obj[targetKey] = e.target.value;
    this.inputFlag = false;
    setTimeout(() => {
      this.inputFlag = true;
    }, 100);
  }

  initInputChanges(data) {
    if (this.container.querySelector("md-input")) {
      data.forEach((item) => {
        if (item.property != "length") {
          if (typeof item.newValue == "object") {
            const mainKey = item.currentPath;
            const objKeys = this.generateKeyWithDotSeperated(item.newValue);
            objKeys.forEach((key) => {
              const keyForEvent = `${mainKey}.${key}`;
              this.attachedKeyUpEvent(keyForEvent);
            });
          } else {
            const key = item.currentPath;
            this.attachedKeyUpEvent(key);
          }
        }
      });
    }
  }

  attachedKeyUpEvent(key) {
    const elements = this.container.querySelectorAll(`[md-input="${key}"]`);
    if (elements.length) {
      elements.forEach((element) => {
        if (element.tagName == "INPUT") {
          element.removeEventListener(
            "keyup",
            this.performInputKeyUpEvent.bind(this)
          );
          element.addEventListener(
            "keyup",
            this.performInputKeyUpEvent.bind(this)
          );
        } else if (element.tagName == "SELECT") {
          element.removeEventListener(
            "change",
            this.performInputKeyUpEvent.bind(this)
          );
          element.addEventListener(
            "change",
            this.performInputKeyUpEvent.bind(this)
          );
        }
      });
    }
  }

  //utility function
  //mapped action to work with only thos operation with value changes
  // mappedActionForPerformance(obj) {
  //   const mappedKeys = this.generateKeyWithDotSeperated(obj);
  //   mappedKeys.forEach((item) => {
  //     const key = this.getMainKeyFromCurrentPath(item);
  //     if (this.container.querySelector(`[md-for^="${key}"]`)) {
  //       this.actionMapper.loopCheck[key] = true;
  //     }
  //     if (this.container.querySelector(`[md-if*="${key}"]`)) {
  //       this.actionMapper["md-if"][key] = true;
  //     }
  //     if (this.container.querySelector(`[md-text^="${item}"]`)) {
  //       this.actionMapper["md-text"][item] = true;
  //     }
  //     if (this.container.querySelector(`[md-input^="${item}"]`)) {
  //       this.actionMapper["md-text"][item] = true;
  //     }
  //     if (this.container.querySelector(`[md-attr*="${key}"]`)) {
  //       this.actionMapper.attrCheck[key] = true;
  //     }
  //   });
  // }

  //get first key of curretn path
  getMainKeyFromCurrentPath(currentPath) {
    let key = currentPath;
    if (currentPath.indexOf(".") >= 0) {
      key = currentPath.slice(0, currentPath.indexOf("."));
    }
    return key;
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
      temp.push({
        type: "add",
        target: data,
        currentPath: `${nestedKey}length`,
        newValue: data.length,
      });
      return temp;
    } else {
      let tempArr = [];
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
        const forList = this.container.querySelectorAll(
          `[md-for="${key + item}"]`
        );
        forList.forEach((element) => {
          const targetKey = (key + item).split(".")[0];
          if (!this.listContainer[targetKey]) {
            this.listContainer[targetKey] = [];
            this.listElements[targetKey] = [];
          }
          this.listContainer[targetKey].push(element);
          this.listElements[targetKey].push(
            element.firstElementChild.cloneNode(true)
          );
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
      const temp = element.querySelector(`[md-text^="${item.currentPath}"]`);
      const tempInput = element.querySelector(
        `[md-input^="${item.currentPath}"]`
      );
      const ifEle = element.querySelector(`[md-if^="${item.currentPath}"]`);
      const ifNotEle = element.querySelector(`[md-if^="!${item.currentPath}"]`);
      const attrEle = element.querySelector(
        `[md-attr^="!${item.currentPath}"]`
      );
      if (temp || tempInput || ifEle || ifNotEle || attrEle) {
        this.updatePropertyInLoop({ item, key });
      } else {
        const varName = element.getAttribute("md-let");
        const ele = this.listElements[key][index].cloneNode(true);
        this.updateAllPropertyToChildrenInLoop(item, ele, varName);
        element.appendChild(ele);
      }
    });
  }

  updateAllPropertyToChildrenInLoop(item, ele, varName) {
    // if (ele.hasAttribute("md-for") || ele.querySelector("[md-for]")) {
    //   this.addNestedLoopOp(item, ele, item.currentPath, varName);
    // }

    const allNestedKeys = this.generateKeyWithDotSeperated(item.newValue);
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
        currentPath: item.currentPath + "." + currentKey,
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
          if (temp[1].startsWith(varName + ".")) {
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
        item.newValue.forEach((tempArr, index) => {
          this.addPropertyInLoop({
            item: {
              ...item,
              type: "add",
              currentPath: item.currentPath + `.${index}`,
              newValue: tempArr,
            },
            key,
            elements: [element],
          });
        });
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
    return instance.lib;
  }
}
