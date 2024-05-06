/*
 * @autoAdd: false
 * @Author: depp.chen
 * @Date: 2021-10-15 14:39:37
 * @LastEditors: depp.chen
 * @LastEditTime: 2024-04-24 18:16:29
 * @Description: 扩展窗口js
 */
(function () {
  const vscode = acquireVsCodeApi();
  // 最外层元素
  const markList = document.querySelector(".mark-list");
  // 属性名枚举
  const elementAttributeName = {
    // 标记项序号属性
    markItemOrder: "data-order",
    // 标记项range范围合并属性
    markItemRange: "markData-range",
    // 标记项vscode装饰key属性
    decorationTypeKey: "decoration-type",
    // 文件名属性
    attributeFileName: "file-name",
    // 文件对于编辑器行号属性
    attributeViewColumn: "view-column",
  };

  let rootPath = "";
  let REGX_HTML_ENCODE = /“|&|’|<|>|[\x00-\x20]|[\x7F-\xFF]|[\u0100-\u2700]/g;

  /**
   * @description: 根据当前打开目录解析对应文件名
   * @author: depp.chen
   * @param { string } fileName : 文件名
   */
  function calculateFileName(fileName) {
    if (rootPath) {
      fileName = fileName.substr(rootPath.length);
    }
    return fileName;
  }

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

  // 创建集合元素
  function createMarkWrapper(fileName, viewColumn) {
    let imgSrc = document.getElementsByClassName("img-info")[0].innerText;
    let wrapper = document.createElement("div");
    let shortFileName = calculateFileName(fileName);
    wrapper.className = "file-wrapper";
    wrapper.setAttribute(elementAttributeName.attributeFileName, fileName);
    wrapper.setAttribute(elementAttributeName.attributeViewColumn, viewColumn);
    wrapper.innerHTML = `<div class='wrapper-header'>
    <h3 class="file-name">${shortFileName}</h3>
    <img class='file-delete' src="${imgSrc}" alt="删除">
    </div>`;
    // <div class='file-delete'>删除</div>
    return wrapper;
  }

  // 创建单项元素
  function createMarkItem(data, i) {
    let item = document.createElement("div");
    let rangeStr = data.range.join(",");
    item.setAttribute(elementAttributeName.markItemRange, rangeStr);
    item.setAttribute(
      elementAttributeName.decorationTypeKey,
      data.attributeDecorationTypeKey
    );
    item.setAttribute(elementAttributeName.markItemOrder, data.range[0]);
    item.className = "mark-item";
    item.innerHTML = `<div class='file-mark-text'>
      <span class='serial-number'>${i}、</span>
      <pre class='file-mark-text-pre'>${encodeHtml(data.fileMarkText)}</pre>
    </div>
    <div class='mark-footer'>
      <p class='mark-record'>${data.record ? data.record : ""}</p>
      <div class='delete-button'>删除</div>
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
     *    attributeDecorationTypeKey: string}[]
     * } data : 全部修改的数据集合
     */
    changeAllMark: (data) => {
      if (data) {
        markList.innerHTML = "";
        if (data.rootPath) {
          rootPath = data.rootPath;
        }
        let fragment = document.createDocumentFragment();
        for (let fileName in data) {
          if (fileName === "rootPath") {
            continue;
          }
          let listWrapper = createMarkWrapper(
            fileName,
            data[fileName].viewColumn
          );
          data[fileName].markDetails.forEach((e, i) => {
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
     *    attributeDecorationTypeKey: string
     * } data : 新增的数据行
     */
    addMarkItem: (data) => {
      let { fileName, range, viewColumn } = data;
      let wrapper = document.querySelectorAll(".file-wrapper");
      let target = [...wrapper].find((e) => {
        return (
          e.getAttribute(elementAttributeName.attributeFileName) === fileName
        );
      });
      if (target) {
        let allMarkItem = target.getElementsByClassName("mark-item");
        let firstRangeNum = range[0];
        let index = 1;
        let objective = null;
        [...allMarkItem].forEach((e, i) => {
          let order = e.getAttribute(elementAttributeName.markItemOrder);
          if (order > firstRangeNum) {
            if (!objective) {
              index = i + 1;
              objective = e;
            }
            e.setAttribute(
              elementAttributeName.markItemOrder,
              Number(order) + 1
            );
            let serialNumber = e.querySelector(".serial-number");
            if (serialNumber) {
              serialNumber.innerText = i + 2;
            }
          }
        });
        if (objective) {
          const item = createMarkItem(data, index);
          target.insertBefore(item, objective);
        } else {
          const item = createMarkItem(data, allMarkItem.length + 1);
          target.appendChild(item);
        }
      } else {
        let listWrapper = createMarkWrapper(fileName, viewColumn);
        const item = createMarkItem(data, 1);
        listWrapper.appendChild(item);
        markList.appendChild(listWrapper);
      }
    },
    /**
     * @description: 删除标记
     * @author: depp.chen
     * @param {
     *    {fileName: string,
     *    attributeDecorationTypeKey: string(textEditorDecorationType唯一标识)
     * } data
     */
    deleteMarkItem: (data) => {
      let { fileName, attributeDecorationTypeKey } = data;
      let allList = document.querySelectorAll(".file-wrapper");
      let target = [...allList].find((e) => {
        return (
          e.getAttribute(elementAttributeName.attributeFileName) === fileName
        );
      });
      if (!target) {
        return;
      }
      let allMarkItem = target.getElementsByClassName("mark-item");
      let index = [...allMarkItem].findIndex((e) => {
        return (
          e.getAttribute(elementAttributeName.decorationTypeKey) ===
          attributeDecorationTypeKey
        );
      });
      if (index > -1) {
        allMarkItem[index].parentNode.removeChild(allMarkItem[index]);
        let newAllMarkItem = target.getElementsByClassName("mark-item");
        if (!newAllMarkItem || !newAllMarkItem.length) {
          markList.removeChild(target);
          vscode.postMessage({
            type: "deleteFileAllMark",
            fileName,
          });
        }
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
        return e.getAttribute(elementAttributeName.decorationTypeKey) === key;
      });
      if (target) {
        let recordDom = target.querySelector(".mark-record");
        recordDom.innerText = record;
      }
    },
    /**
     * @description: 修改ViewColumn
     * @author: depp.chen
     * @param { fileName:string, viewColumn: string } data
     * fileName : 文件名
     * viewColumn : 编辑器行号
     */
    changeViewColumn: (data) => {
      let { fileName, viewColumn } = data;
      let allList = document.querySelectorAll(".file-wrapper");
      let target = [...allList].find((e) => {
        return (
          e.getAttribute(elementAttributeName.attributeFileName) === fileName
        );
      });
      if (target) {
        target.setAttribute(
          elementAttributeName.attributeViewColumn,
          viewColumn
        );
      }
    },
    /**
     * @description: 修改ViewColumn
     * @author: depp.chen
     * @param { fileName:string, line: number, enterNum: number } data
     * fileName : 文件名
     * line : 编辑的行号
     * difference : 总行数差别
     */
    changeRange: (data) => {
      let { fileName, line, difference } = data;
      let allList = document.querySelectorAll(".file-wrapper");
      let target = [...allList].find((e) => {
        return (
          e.getAttribute(elementAttributeName.attributeFileName) === fileName
        );
      });
      if (target) {
        let markItemList = target.getElementsByClassName("mark-item");
        [...markItemList].forEach((e) => {
          let range = e.getAttribute(elementAttributeName.markItemRange);
          range = range.split(",").map((e) => Number(e));
          if (range[0] <= line && range[1] >= line) {
            let newEnd = range[1] + difference;
            range[1] = newEnd < range[0] ? range[0] : newEnd;
            e.setAttribute(elementAttributeName.markItemRange, range.join(","));
          } else if (range[0] > line) {
            let newStart = range[0] + difference;
            let newEnd = range[1] + difference;
            range[0] = newStart < 0 ? 0 : newStart;
            range[1] = newEnd < 0 ? 0 : newEnd;
            e.setAttribute(elementAttributeName.markItemRange, range.join(","));
          }
        });
      }
    },
    /**
     * @description: 修改标记文本
     * @author: depp.chen
     * @param { key:string, fileText: string } data
     * key :textEditorDecorationType唯一标识
     * fileText : 标记的文本
     */
    changeMarkText(data) {
      let { key, fileText } = data;
      let allMarkItem = markList.getElementsByClassName("mark-item");
      let target = [...allMarkItem].find((e) => {
        return e.getAttribute(elementAttributeName.decorationTypeKey) === key;
      });
      if (target) {
        let fileTextDom = target.querySelector(".file-mark-text-pre");
        fileTextDom.innerText = fileText;
      }
    },
  };

  // 获取扩展的数据
  window.addEventListener("message", (event) => {
    const data = event.data;
    messageEventType[data.type](data.data);
  });

  function getMarkItem(e) {
    if (e.className === "mark-item") {
      return e;
    } else {
      if (
        e.parentNode &&
        e.parentNode.className &&
        e.parentNode.className !== "mark-list"
      ) {
        return getMarkItem(e.parentNode);
      } else {
        return undefined;
      }
    }
  }

  markList.addEventListener("click", (e) => {
    let target = getMarkItem(e.target);
    if (target) {
      let parentNode = target.parentNode;
      let fileName = parentNode.getAttribute(
        elementAttributeName.attributeFileName
      );
      if (e.target.className === "delete-button") {
        // 删除
        let attributeDecorationTypeKey = target.getAttribute(
          elementAttributeName.decorationTypeKey
        );
        vscode.postMessage({
          type: "deleteMarkItem",
          fileName,
          decorationTypeKey: attributeDecorationTypeKey,
        });
        messageEventType["deleteMarkItem"]({
          fileName,
          attributeDecorationTypeKey,
        });
      } else {
        let parentNode = target.parentNode;
        let fileName = parentNode.getAttribute(
          elementAttributeName.attributeFileName
        );
        let range = target.getAttribute(elementAttributeName.markItemRange);
        let viewColumn = target.parentNode.getAttribute(
          elementAttributeName.attributeViewColumn
        );
        vscode.postMessage({
          type: "rangeJump",
          range: range,
          fileName,
          viewColumn,
        });
      }
    } else {
      if (e.target.className === "file-name") {
        let parentNode = e.target.parentNode.parentNode;
        let fileName = parentNode.getAttribute(
          elementAttributeName.attributeFileName
        );
        let viewColumn = parentNode.getAttribute(
          elementAttributeName.attributeViewColumn
        );
        vscode.postMessage({
          type: "openOrShowFile",
          fileName,
          viewColumn,
        });
      } else if (e.target.className === "file-delete") {
        let parentNode = e.target.parentNode.parentNode;
        let fileName = parentNode.getAttribute(
          elementAttributeName.attributeFileName
        );
        markList.removeChild(parentNode);
        vscode.postMessage({
          type: "deleteFileAllMark",
          fileName,
        });
      }
    }
  });
})();
