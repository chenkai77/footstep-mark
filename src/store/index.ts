import { ExtensionContext, TextEditorDecorationType, window } from "vscode";
export interface IMarkDetails {
  range: [number, number, number];
  record?: string | undefined;
  fileMarkText?: string | undefined;
  textEditorDecorationType: TextEditorDecorationType;
  attributeDecorationTypeKey: string; // 编辑器未激活时 TextEditorDecorationType 获取不到key
}

interface State {
  // 扩展程序激活上下文
  context: ExtensionContext | undefined;
  // 标记的数据集合
  markData: {
    [fileName: string]: {
      viewColumn?: number;
      markDetails: IMarkDetails[];
    };
  };
}

const state: State = {
  context: undefined,
  markData: {},
};

const getter = {
  getActiveMarkData() {
    let fileName = window.activeTextEditor?.document.fileName;
    if (fileName) {
      return state.markData[fileName];
    }
  },
};

const mutations = {
  // 增加标记数据
  addMarkData(
    fileName: string | undefined,
    markData: IMarkDetails,
    viewColumn?: number | undefined
  ) {
    if (!fileName) {
      return;
    }
    if (state.markData[fileName]) {
      if (viewColumn) {
        state.markData[fileName].viewColumn = viewColumn;
      }
      state.markData[fileName].markDetails.push({
        ...markData,
      });
      state.markData[fileName].markDetails.sort(
        (a, b) => a.range[0] - b.range[0]
      );
    } else {
      state.markData[fileName] = {
        markDetails: [markData],
        viewColumn,
      };
    }
  },
  // 删除标记数据
  deleteMarkData(fileName: string, i: number) {
    if (fileName && state.markData[fileName]) {
      state.markData[fileName].markDetails.splice(i, 1);
    }
  },
  // 删除指定文件的标记数据
  deleteFileAllMarkData(fileName: string) {
    if (fileName && state.markData[fileName]) {
      state.markData[fileName].markDetails.forEach(e=>{
        e.textEditorDecorationType?.dispose();
      })
      delete state.markData[fileName];
    }
  },
  // 修改viewColumn
  changeViewColumn(fileName: string, viewColumn: number) {
    if (fileName && state.markData[fileName]) {
      state.markData[fileName].viewColumn = viewColumn;
    }
  },
  // 删除所有标记数据
  clearAll() {
    console.log(state.markData);
    for (let file in state.markData) {
      state.markData[file].markDetails.forEach((e) => {
        e.textEditorDecorationType?.dispose();
      });
    }
    state.markData = {};
  },
};

export { state, mutations, getter };
