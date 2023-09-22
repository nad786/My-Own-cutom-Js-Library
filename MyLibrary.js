class MyLibrary {
  elements = [];
  listElements = {};
  listContainer = {};
  targetMap = {"loop": "performLoopOperation", if: "performIfStatementOperation", text: "performTextOperation", input: "performInputOperation", attr: "performAttraibuteAdding"};
  container = document;
  targetOperation = 'performOperation';
  actionMapper = {
    loopCheck: {},
    ifCheck: {},
    textCheck: {},
    inputCheck: {},
    attrCheck: {}
  };
  constructor(obj, rest = {}) {
    const { parentSelector = "html", target = null } = rest;
    if(target) {
      this.targetOperation = targetMap[target] ? targetMap[target] : "performOperation"
    }
    this.lib = ObservableSlim.create(obj, true, this.detectChanges.bind(this));
    this.container = document.querySelector(parentSelector);
    this.init(obj);
  }

  init(obj) {
    this.mappedActionForPerformance(obj)
    const data = this.generateDefaultObjectType(obj);
    this.initForLoop(obj);
    this[this.targetOperation](data);
    if(this.targetOperation == "performOperation" || this.targetOperation == 'performInputOperation') {
      this.initInputChanges(data);
    }
  }

  mappedActionForPerformance(obj) {
    const mappedKeys = this.generateKeyWithDotSeperated(obj);
    mappedKeys.forEach(item => {
      if(this.container.querySelector(`[md-for="${item}"]`)) {
        this.actionMapper.loopCheck[item] = true
      }
      if(this.container.querySelector(`[md-if="${item}"]`)) {
        this.actionMapper.ifCheck[item] = true;
      }
      if(this.container.querySelector(`[md-text="${item}"]`)) {
        this.actionMapper.textCheck[item] = true;
      }
      if(this.container.querySelector(`[md-input="${item}"]`)) {
        this.actionMapper.inputCheck[item] = true;
      }
      if(this.container.querySelector(`[md-attr*="${item}"]`)) {
        this.actionMapper.attrCheck[item] = true;
      }
    })
  }

  getMainKeyFromCurrentPath(currentPath) {
    let key = currentPath;
    if (currentPath.indexOf(".") >= 0) {
      key = currentPath.slice(0, currentPath.indexOf("."));
    }
    return key;
  }

  performOperation(data) {
    data.forEach((item) => {
      if (item.property != "length") {
        const key = this.getMainKeyFromCurrentPath(item.currentPath);
        if(this.actionMapper.loopCheck[key]) {
          this.performLoopOperation(item, key);
        }
        if(this.actionMapper.textCheck[item.currentPath]) {
          this.performTextOperation(item, key);
        }
        if(this.actionMapper.inputCheck[item.currentPath]) {
          this.performInputOperation(item, key);
        }
        if(this.actionMapper.ifCheck[item.currentPath]) {
          this.performIfStatementOperation(item, key);
        }
        if(this.actionMapper.attrCheck[item.currentPath]) {
          this.performAttraibuteAdding(item, key);
        }
      }
    });
  }

  performAttraibuteAdding(item, key) {
    const elements = this.container.querySelectorAll(
      `[md-attr*="${item.currentPath}"]`
    );
    if (elements.length) {
      elements.forEach((element) => {
        const multiAttr = element.getAttribute('md-attr').split(";");
        multiAttr.forEach(singleAttr => {
          const attr = singleAttr.split("=").map(item => item.trim());
          const val = this.getValueFromkeyWithDot(item.newValue, attr[1]);
          element.setAttribute(attr[0], val);
        })
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

  initForLoop(obj, key="") {
    if(key) key+=".";
    for (let item in obj) {
      if (Array.isArray(obj[item])) {
        const forList = this.container.querySelectorAll(`[md-for="${key+item}"]`);
        forList.forEach((element) => {
          if (!this.listContainer[item]) {
            this.listContainer[item] = [];
          }
          if (!this.listElements[item]) {
            this.listElements[item] = [];
          }
          this.listContainer[item].push(element);
          this.listElements[item].push(
            element.firstElementChild.cloneNode(true)
          );
          this.removeAllchildNodes(element);
        });
      } else if (typeof obj[item] == "object") {
        this.initForLoop(obj[item], key+item);
      }
    }
  }

  generateDefaultObjectType(data, nestedKey = "") {
    if (Array.isArray(data)) {
      return data.map((item, index) => {
        return {
          type: "add",
          target: data,
          currentPath: `${nestedKey ? nestedKey + "." : ""}${index}`,
          newValue: item,
        };
      });
    } else {
      let tempArr = [];
      for (let item in data) {
        if (typeof data[item] == "object") {
          const temp = this.generateDefaultObjectType(data[item], item);
          tempArr = [...tempArr, ...temp];
        } else {
          tempArr.push({
            type: "add",
            target: data,
            currentPath: `${nestedKey ? nestedKey + "." : ""}${item}`,
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

  detectChanges(data) {
    this[this.targetOperation](data);
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

  addPropertyInLoop({ item, key, elements }) {
    elements.forEach((element, index) => {
      const temp = element.querySelectorAll(`[md-text^="${item.currentPath}"]`);
      const tempInput = element.querySelectorAll(
        `[md-input^="${item.currentPath}"]`
      );
      const ifEle = element.querySelectorAll(`[md-if^="${item.currentPath}"]`);
      const ifNotEle = element.querySelectorAll(
        `[md-if^="!${item.currentPath}"]`
      );
      if (temp.length || tempInput.length || ifEle.length || ifNotEle.length) {
        this.updatePropertyInLoop({ item, key });
      } else {
        const ele = this.listElements[key][index].cloneNode(true);
        // this.operateNestedLoop(item, ele);
        this.modifyMdTextValue(item, ele, true);
        this.modifyMdInputValue(item, ele, true);
        this.hideShowLement(item, ele, true);
        element.appendChild(ele);
      }
    });
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
        item.newValue.forEach((tempArr, index) => {
          this.removeAllchildNodes(element);
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
    if(typeof obj == 'object') {
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

  static create(obj, rest = {}) {
    const instance = new MyLibrary(obj, rest);
    return instance.lib;
  }
}
