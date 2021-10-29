/*
 * @autoAdd: false
 * @Author: depp.chen
 * @Date: 2021-10-15 14:39:37
 * @LastEditors: depp.chen
 * @LastEditTime: 2021-10-29 17:58:17
 * @Description: 扩展窗口js
 */
(function () {
  const vscode = acquireVsCodeApi();
  const markList = document.querySelector(".mark-list");

  let activeFileName = "";
  let allMarkData = [];
  let extensionPath = '';
  let liDataIndex = "data-order";
  let liMarkDataRange = "markData-range";
  let decorationTypeKey = "decoration-type";
  let attributeFileName = "file-name";
  let REGX_HTML_ENCODE = /“|&|’|<|>|[\x00-\x20]|[\x7F-\xFF]|[\u0100-\u2700]/g;

  /**
   * @description: 根据当前打开目录解析对应文件名
   * @author: depp.chen
   * @param { string } fileName : 文件名
   */
  function calculateFileName (fileName) {
    if (extensionPath) {
      fileName = fileName.substr(extensionPath.length);
    }
    return fileName;
  };

  /**
   * @description: 转义html
   * @author: depp.chen
   * @param { string } s ： html文本
   */  
  function encodeHtml(s) {
    return typeof s !== "string"
      ? s
      : s.replace(REGX_HTML_ENCODE, function ($0) {
          var c = $0.charCodeAt(0),
            r = ["&#"];
          c = c == 0x20 ? 0xa0 : c;
          r.push(c);
          r.push(";");
          return r.join("");
        });
  }

  markList.addEventListener("click", (e) => {
    let target = e.path.find((ele) => ele.className === "mark-item");
    if (target) {
      if (e.target.className === "delete-button") {
        // 删除
        let attributeDecorationTypeKey = target.getAttribute(decorationTypeKey);
        messageEventType["deleteMarkItem"](attributeDecorationTypeKey);
        vscode.postMessage({
          fileName: activeFileName,
          decorationTypeKey: attributeDecorationTypeKey,
        });
      } else {
        let range = target.getAttribute(liMarkDataRange);
        vscode.postMessage({
          range: range,
          fileName: activeFileName,
        });
      }
    } else {
      if (e.target.className === "file-name") {
        let fileName = e.target.getAttribute(attributeFileName);
        vscode.postMessage({
          type: 'openOrShowFile',
          fileName,
        });
      }
    }
  });
  
  // 创建集合元素
  function createMarkWrapper(fileName) {
    let wrapper = document.createElement("div");
    let shortFileName = calculateFileName(fileName);
    let fileNameTitle = document.createElement("h3");
    fileNameTitle.innerText = shortFileName;
    fileNameTitle.className = 'file-name';
    fileNameTitle.setAttribute(attributeFileName, fileName);
    wrapper.appendChild(fileNameTitle);
    return wrapper;
  }

  // 创建单项元素
  function createMarkItem(data, i) {
    let item = document.createElement("div");
    let rangeStr = data.range.join(",");
    item.setAttribute(liMarkDataRange, rangeStr);
    item.setAttribute(decorationTypeKey, data.textEditorDecorationTypeKey);
    item.setAttribute(liDataIndex, data.range[0]);
    item.className = "mark-item";
    item.innerHTML = `<span class='serial-number'>${i}</span>
    <div class='file-mark-text'>
      <div class='delete-button'>删除</div>
      <pre class='file-mark-text-pre'>${encodeHtml(data.fileMarkText)}</pre>
      <p class='mark-record'>${data.record ? data.record : ""}</p> 
    </div>`;
    return item;
  }

  const messageEventType = {
    /**
     * @description: 修改全部标记列表
     * @author: depp.chen
     * @param {
     *    {range: [number, number, number],
     *    record?: string | undefined,
     *    fileMarkText?: string | undefined,
     *    textEditorDecorationTypeKey: string}[]
     * } data : 全部修改的数据集合
     */
    changeAllMark: (data) => {
      if (data) {
        markList.innerHTML = "";
        if (data.extensionPath) {
          extensionPath = data.extensionPath;
        }
        let fragment = document.createDocumentFragment();
        for (let fileName in data) {
          let listWrapper =  createMarkWrapper(fileName);       
          data[fileName].forEach((e, i) => {
            let markItem = createMarkItem(e, i + 1);
            listWrapper.appendChild(markItem);
          });
          fragment.appendChild(listWrapper);
        }
        markList.appendChild(fragment);
      }
    },
    /**
     * @description: 新增标记
     * @author: depp.chen
     * @param {
     *    range: [number, number, number],
     *    record?: string | undefined,
     *    fileMarkText?: string | undefined,
     *    textEditorDecorationTypeKey: string
     * } data : 新增的数据行
     */
    addMarkItem: (data) => {
      let allMarkItem = markList.getElementsByClassName("mark-item");
      let firstRangeNum = data.range[0];
      let index = 1;
      let target = null;
      [...allMarkItem].forEach((e, i) => {
        let order = e.getAttribute(liDataIndex);
        if (order > firstRangeNum) {
          if (!target) {
            index = i + 1;
            target = e;
          }
          e.setAttribute(liDataIndex, order + 1);
          let serialNumber = e.querySelector(".serial-number");
          if (serialNumber) {
            serialNumber.innerText = i + 2;
          }
        }
      });
      if (target) {
        const li = createMarkItem(data, index);
        markList.insertBefore(li, target);
      } else {
        const li = createMarkItem(data, allMarkItem.length + 1);
        markList.appendChild(li);
      }
    },
    /**
     * @description: 删除标记
     * @author: depp.chen
     * @param { string } key : textEditorDecorationType唯一标识
     */
    deleteMarkItem: (key) => {
      let allMarkItem = markList.getElementsByClassName("mark-item");
      let index = [...allMarkItem].findIndex((e) => {
        return e.getAttribute(decorationTypeKey) === key;
      });
      if (index > -1) {
        markList.removeChild(allMarkItem[index]);
        let newAllMarkItem = markList.getElementsByClassName("mark-item");
        [...newAllMarkItem].forEach((ele, i) => {
          let serialNumber = ele.querySelector(".serial-number");
          if (serialNumber) {
            serialNumber.innerText = i + 1;
          }
        });
      }
    },
    /**
     * @description: 增加备注文本
     * @author: depp.chen
     * @param { key:string, record: string } data
     * key : textEditorDecorationType唯一标识
     * record : 备注文本
     */
    addMarkRecord: (data) => {
      let { key, record } = data;
      let allMarkItem = markList.getElementsByClassName("mark-item");
      let target = [...allMarkItem].find((e) => {
        return e.getAttribute(decorationTypeKey) === key;
      });
      if (target) {
        let recordDom = target.querySelector(".mark-record");
        recordDom.innerText = record;
      }
    },
  };

  // 获取扩展的数据
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (data.fileName) {
      activeFileName = data.fileName;
    }
    messageEventType[data.type](data.data);
  });
})();
