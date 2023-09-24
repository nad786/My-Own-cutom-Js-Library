class MiniJs {
  elements = [];
  listElements = {};
  listContainer = {};
  targetMap = {
    loop: "performLoopOperation",
    if: "performIfStatementOperation",
    text: "performTextOperation",
    input: "performInputOperation",
    attr: "performAttraibuteAdding",
  };
  container = document;
  opertaionMapper = "performOperation";
  targetOperation = "performOperation";
  actionMapper = {
    loopCheck: {},
    ifCheck: {},
    textCheck: {},
    inputCheck: {},
    attrCheck: {},
  };
  constructor(obj, rest = {}) {
    const { parentSelector = "html", target = null } = rest;
    if (target) {
      this.opertaionMapper = this.targetMap[target]
        ? this.targetMap[target]
        : "performOperation";
      this.targetOperation = "opertaionMapperExecution";
    }
    this.lib = ObservableSlim.create(obj, true, this.detectChanges.bind(this));
    this.container = document.querySelector(parentSelector);
    this.init(obj);
  }

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

  mappedActionForPerformance(obj) {
    const mappedKeys = this.generateKeyWithDotSeperated(obj);
    mappedKeys.forEach((item) => {
      const key = this.getMainKeyFromCurrentPath(item);
      if (this.container.querySelector(`[md-for^="${key}"]`)) {
        this.actionMapper.loopCheck[key] = true;
      }
      if (this.container.querySelector(`[md-if*="${key}"]`)) {
        this.actionMapper.ifCheck[key] = true;
      }
      if (this.container.querySelector(`[md-text^="${item}"]`)) {
        this.actionMapper.textCheck[item] = true;
      }
      if (this.container.querySelector(`[md-input^="${item}"]`)) {
        this.actionMapper.inputCheck[item] = true;
      }
      if (this.container.querySelector(`[md-attr*="${key}"]`)) {
        this.actionMapper.attrCheck[key] = true;
      }
    });
  }

  getMainKeyFromCurrentPath(currentPath) {
    let key = currentPath;
    if (currentPath.indexOf(".") >= 0) {
      key = currentPath.slice(0, currentPath.indexOf("."));
    }
    return key;
  }

  opertaionMapperExecution(data) {
    data.forEach((item) => {
      if (item.property != "length") {
        const key = this.getMainKeyFromCurrentPath(item.currentPath);
        this[this.opertaionMapper](item, key);
      }
    });
  }

  performOperation(data) {
    data.forEach((item) => {
      if (item.property != "length") {
        const key = this.getMainKeyFromCurrentPath(item.currentPath);
        if (this.actionMapper.loopCheck[key]) {
          this.performLoopOperation(item, key);
        }
        if (
          this.actionMapper.textCheck[item.currentPath] ||
          this.actionMapper.textCheck[key]
        ) {
          this.performTextOperation(item, key);
        }
        if (
          this.actionMapper.inputCheck[item.currentPath] ||
          this.actionMapper.inputCheck[key]
        ) {
          this.performInputOperation(item, key);
        }
        if (
          this.actionMapper.ifCheck[item.currentPath] ||
          this.actionMapper.ifCheck[key]
        ) {
          this.performIfStatementOperation(item, key);
        }
        if (
          this.actionMapper.attrCheck[item.currentPath] ||
          this.actionMapper.attrCheck[key]
        ) {
          this.performAttraibuteAdding(item, key);
        }
      }
    });
  }

  performAttraibuteAdding(item, key, ele) {
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
        item.newValue,
        key ? key : attr[1]
      );
      element.setAttribute(attr[0], val);
    });
  }

  performInputKeyUpEvent(e) {
    const attrArr = e.target.getAttribute("md-input").split(".");
    const targetKey = attrArr.pop();
    let obj = this.lib;
    attrArr.forEach((item) => {
      obj = obj?.[item];
    });
    if (obj[targetKey] != e.target.value) {
      obj[targetKey] = e.target.value;
    }
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

  performIfStatementOperation(item, key) {
    [`${item.currentPath}`, `!${item.currentPath}`].forEach((selector) => {
      const elements = this.container.querySelectorAll(`[md-if="${selector}"]`);
      if (elements.length) {
        elements.forEach((element) => {
          this.hideShowLement(item, element);
        });
      }
    });
  }

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

  performLoopOperation(item, key) {
    if (this.listContainer[key]) {
      this.performLoopEachItem({
        item,
        key,
        elements: this.listContainer[key],
      });
    }
  }

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

  performLoopEachItem({ item, key, elements }) {
    if (item.type == "add") {
      this.addPropertyInLoop({ item, key, elements });
    } else if (item.type == "update") {
      this.updatePropertyInLoop({ item, key, elements });
    } else if (item.type == "delete") {
      this.deletePropertInLoop({ item, key, elements });
    }
  }

  //
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
          if(flag) {
            this.actionMapper.attrCheck[path] = true;
          element.setAttribute(
            "md-attr",
            list.map((item) => item.join("=")).join(";")
          );
          this.updateAttributeValueForAttr(item, element, key);
          }
          
        }
      });
    });
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
        this.hideShowLement(item, ele, true);
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

  // operateNestedLoop(item, ele) {
  //   if(ele.hasAttribute("md-for")) {
  //       ele.setAttribute('md-for', item.currentPath+ "." +ele.getAttribute('md-for'))
  //   } else {
  //       ele.querySelectorAll('[md-for]').forEach(element => {
  //           console.log(element);
  //       })
  //   }

  // }

  removeAllchildNodes(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
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

  getValueFromkeyWithDot(obj, key) {
    if (typeof obj == "object") {
      key.split(".").map((item) => {
        obj = obj?.[item];
      });
    }
    return obj;
  }

  deletePropertInLoop({ item, key, elements }) {
    this.listContainer[key].forEach((ele) => {
      const nodes = ele.children;
      ele.removeChild(nodes[item.property]);
    });
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

  modifyMdInputValue(item, ele, flag = false) {
    this.performAllOperationForAllItsChildNodes({
      flag,
      item,
      ele,
      selector: "md-input",
      cb: (ele, val) => {
        ele.value = val;
      },
    });
  }

  hideShowLement(item, ele, flag = false) {
    this.performAllOperationForAllItsChildNodes({
      flag,
      item,
      ele,
      selector: "md-if",
      cb: (ele, val) => {
        if (
          (val && !ele.getAttribute("md-if").startsWith("!")) ||
          (!val && ele.getAttribute("md-if").startsWith("!"))
        ) {
          ele.style.display = "block";
        } else {
          ele.style.display = "none";
        }
      },
    });
  }

  performAllOperationForAllItsChildNodes({
    item,
    ele,
    selector,
    cb,
    flag = false,
  }) {
    if (ele.hasAttribute(`${selector}`)) {
      const textKey = ele.getAttribute(`${selector}`);
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
        let val = item.newValue[textKey];
        if (textKey.indexOf(".") >= 0) {
          val = this.getValueFromkeyWithDot(item.newValue, textKey);
        }
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

  detectChanges(data) {
    this[this.targetOperation](data);
  }

  static create(obj, rest = {}) {
    const instance = new MiniJs(obj, rest);
    return instance.lib;
  }
}