class MiniJs {
  elements = [];
  listElements = {};
  listContainer = {};
  targetMap = {
    "md-loop": "performLoopOperation",
    "md-if": "performIfStatementOperation",
    "md-text": "performTextOperation",
    "md-input": "performInputOperation",
    "md-attr": "performAttributeAddOpeartaion",
  };
  container = document;
  opertaionMapper = "performOperation";
  targetOperation = "performOperation";
  actionMapper = {
    loopCheck: {},
    "md-if": {},
    "md-text": {},
    "md-input": {},
    attrCheck: {},
  };
  //don't execute when changed from keyup event
  inputFlag = true;
  constructor(obj, rest = {}) {
    const { parentSelector = "html", target = null } = rest;
    if (target && this.targetMap[target]) {
      this.opertaionMapper = this.targetMap[target]
        ? this.targetMap[target]
        : "performOperation";
      this.targetOperation = "opertaionMapperExecution";
    }
    this.lib = ObservableSlim.create(obj, true, this.detectChanges.bind(this));
    this.container = document.querySelector(parentSelector);
    this.init(obj);
  }

  detectChanges(data) {
    this[this.targetOperation](data);
  }


  //common Operation
  init(obj) {
    this.mappedActionForPerformance(obj);
    const data = this.generateDefaultObjectType(obj);
    this.initForLoop(obj);
    this[this.targetOperation](data);
    if (
      this.targetOperation == "performOperation" ||
      this.targetOperation == "performInputOperation"
    ) {
      this.initInputChanges(data);
    }
  }

  performAllOperationForAllItsChildNodes({
    item,
    ele,
    selector,
    cb,
    flag = false,
  }) {
    if (ele.hasAttribute(`${selector}`)) {
      let textKey = ele.getAttribute(`${selector}`);
      if (item.type == "add" && flag) {
        let attrVal;
        if (textKey.startsWith("!")) {
          attrVal = `!${item.currentPath}.${textKey.slice(1)}`;
        } else {
          attrVal = item.currentPath + (textKey ? "." + textKey : "");
        }
        ele.setAttribute(`${selector}`, attrVal);
      }
      if (textKey && typeof item.newValue == "object") {
        if(textKey.startsWith("!")) {
          textKey = textKey.slice(1);
        }
        let val = this.getValueFromkeyWithDot(item.newValue, textKey);
        cb(ele, val);
      } else {
        cb(ele, item.newValue);
      }
    } else {
      const nodes = ele.children;
      for (let i = 0; i < nodes.length; i++) {
        this.performAllOperationForAllItsChildNodes({
          item,
          ele: nodes.item(i),
          selector,
          cb,
          flag,
        });
      }
    }
  }

  //perform all all operation based on action mapper
  performOperation(data) {
    data.forEach((item) => {
      if (item.property != "length") {
        const key = this.getMainKeyFromCurrentPath(item.currentPath);
        if (this.actionMapper.loopCheck[key] || this.actionMapper.loopCheck[item.currentPath] == undefined) {
          this.performLoopOperation(item, key);
        }
        if (
          this.actionMapper["md-text"][item.currentPath] ||
          this.actionMapper["md-text"][key] || this.actionMapper["md-text"][item.currentPath] == undefined
        ) {
          this.performTextOperation(item, key);
        }
        if (
          this.actionMapper["md-text"][item.currentPath] ||
          this.actionMapper["md-text"][key] || this.actionMapper["md-text"][item.currentPath] == undefined
        ) {
          this.performInputOperation(item, key);
        }
        if (
          this.actionMapper["md-if"][item.currentPath] ||
          this.actionMapper["md-if"][key] || this.actionMapper["md-if"][item.currentPath] == undefined
        ) {
          this.performIfStatementOperation(item, key);
        }
        if (
          this.actionMapper.attrCheck[item.currentPath] ||
          this.actionMapper.attrCheck[key] || this.actionMapper.attrCheck[item.currentPath] == undefined
        ) {
          this.performAttributeAddOpeartaion(item, key);
        }
      }
    });
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
      if(val) {
        if(this.actionMapper[attr[0]]) {
          this.actionMapper[attr[0]][val] = true;
        }
        element.setAttribute(attr[0], val);
      }
    });
  }

  //if opeartion
  performIfStatementOperation(item, key) {
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
        const attr = ele.getAttribute("md-if")
          if(attr.startsWith("!")) {
            if(!val) {
              ele.style.display = "block";
            } else {
              ele.style.display = "none";
            }
          } else {
            if(val) {
              ele.style.display = "block";
            } else {
              ele.style.display = "none";
            }
          }
        if (
          (val && !ele.getAttribute("md-if").startsWith("!")) ||
          (!val && ele.getAttribute("md-if").startsWith("!"))
        ) {
          
        } else {
          
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
    if(this.inputFlag) {
      this.performAllOperationForAllItsChildNodes({
        flag,
        item,
        ele,
        selector: "md-input",
        cb: (ele, val) => {
          ele.value = val;
          var event = new Event('keyup');
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
      }, 100)
  }

  initInputChanges(data) {
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

  attachedKeyUpEvent(key) {
    const elements = this.container.querySelectorAll(`[md-input="${key}"]`);
    if (elements.length) {
      elements.forEach((element) => {
        element.removeEventListener(
          "keyup",
          this.performInputKeyUpEvent.bind(this)
        );
        element.addEventListener(
          "keyup",
          this.performInputKeyUpEvent.bind(this)
        );
      });
    }
  }

  //utility function
  //mapped action to work with only thos operation with value changes
  mappedActionForPerformance(obj) {
    const mappedKeys = this.generateKeyWithDotSeperated(obj);
    mappedKeys.forEach((item) => {
      const key = this.getMainKeyFromCurrentPath(item);
      if (this.container.querySelector(`[md-for^="${key}"]`)) {
        this.actionMapper.loopCheck[key] = true;
      }
      if (this.container.querySelector(`[md-if*="${key}"]`)) {
        this.actionMapper["md-if"][key] = true;
      }
      if (this.container.querySelector(`[md-text^="${item}"]`)) {
        this.actionMapper["md-text"][item] = true;
      }
      if (this.container.querySelector(`[md-input^="${item}"]`)) {
        this.actionMapper["md-text"][item] = true;
      }
      if (this.container.querySelector(`[md-attr*="${key}"]`)) {
        this.actionMapper.attrCheck[key] = true;
      }
    });
  }

  //get first key of curretn path
  getMainKeyFromCurrentPath(currentPath) {
    let key = currentPath;
    if (currentPath.indexOf(".") >= 0) {
      key = currentPath.slice(0, currentPath.indexOf("."));
    }
    return key;
  }

  //only execute target operation like, md-if, md-loop
  opertaionMapperExecution(data) {
    data.forEach((item) => {
      if (item.property != "length") {
        const key = this.getMainKeyFromCurrentPath(item.currentPath);
        this[this.opertaionMapper](item, key);
      }
    });
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
      return data.map((item, index) => {
        return {
          type: "add",
          target: data,
          currentPath: `${nestedKey}${index}`,
          newValue: item,
        };
      });
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
          }
          if (!this.listElements[targetKey]) {
            this.listElements[targetKey] = [];
          }
          this.listContainer[targetKey].push(element);
          this.listElements[targetKey].push(
            element.firstElementChild.cloneNode(true)
          );
          this.removeAllchildNodes(element);
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
        const ele = this.listElements[key][index].cloneNode(true);
        if (ele.hasAttribute("md-for") || ele.querySelector("[md-for]")) {
          this.addNestedLoopOp(item, ele, item.currentPath);
        }
        this.modifyMdTextValue(item, ele, true);
        this.modifyMdInputValue(item, ele, true);
        this.hideShowELement(item, ele, true);
        this.addAttraibuteInsideLoop(item, ele);
        element.appendChild(ele);
      }
    });
  }

  addNestedLoopOp(item, ele, key) {
    if (ele.hasAttribute("md-for")) {
      const values = this.getValueFromkeyWithDot(this.lib, key);
      const defaultNestedValues = this.generateDefaultObjectType(values);
      const node = ele.firstElementChild.cloneNode(true);
      ele.removeChild(ele.firstElementChild);
      defaultNestedValues.forEach((element, index) => {
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

  addAttraibuteInsideLoop(item, ele) {
    const attrEle = ele.querySelectorAll("[md-attr]");
    if (!attrEle.length) {
      return;
    }
    const generatePath = this.generateKeyWithDotSeperated(item.newValue);
    generatePath.forEach((key) => {
      attrEle.forEach((element) => {
        let attrVal = element.getAttribute("md-attr");
        if (attrVal.includes(key)) {
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
            this.actionMapper.attrCheck[path] = true;
            element.setAttribute(
              "md-attr",
              list.map((item) => item.join("=")).join(";")
            );
            this.updateAttributeValueForAttr(item, element, key);
            // this.
            const mainObj = {...this.lib}
            for(let key in this.lib) {
              if(this.actionMapper["md-if"][key]) {
                this.modifyMdInputValue({item, newValue: mainObj}, element, true);
              }
              if(this.actionMapper["md-input"][key]) {
                this.modifyMdInputValue({item, newValue: mainObj}, element, true);
              }
              if(this.actionMapper["md-text"][key]) {
                this.modifyMdTextValue({item, newValue: mainObj}, element, true);
              }
            }
          }
        }
      });
    });
  }

  static create(obj, rest = {}) {
    const instance = new MiniJs(obj, rest);
    return instance.lib;
  }
}
