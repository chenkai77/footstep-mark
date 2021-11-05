import { ExtensionContext, TextEditorDecorationType, window, Range, Position } from "vscode";
import { FmWebViewPanel } from "../features/webView";
import { webViewScriptEnum } from "../enums";
import { removeBlankSpace } from "../utils";
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
      lineCount?: number; // 文档总行数
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

  // 获取lineCount
  getLineCount(fileName: string) {
    if (fileName && state.markData[fileName]) {
      return state.markData[fileName].lineCount;
    }
  },
};

const mutations = {
  // 增加标记数据
  addMarkData(
    fileName: string | undefined,
    markData: IMarkDetails,
    viewColumn?: number | undefined,
    lineCount?: number | undefined
  ) {
    if (!fileName) {
      return;
    }
    if (state.markData[fileName]) {
      if (viewColumn) {
        state.markData[fileName].viewColumn = viewColumn;
      }
      if (lineCount) {
        state.markData[fileName].lineCount = lineCount;
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
        lineCount,
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
      });
      delete state.markData[fileName];
    }
  },
  // 修改viewColumn
  changeViewColumn(fileName: string, viewColumn: number) {
    if (fileName && state.markData[fileName]) {
      state.markData[fileName].viewColumn = viewColumn;
    }
  },
  // 修改lineCount
  changeLineCount(fileName: string, lineCount: number) {
    if (fileName && state.markData[fileName]) {
      state.markData[fileName].lineCount = lineCount;
    }
  },
  // 删除所有标记数据
  clearAll() {
    for (let file in state.markData) {
      state.markData[file].markDetails.forEach((e) => {
        e.textEditorDecorationType?.dispose();
      });
    }
    state.markData = {};
  },
  // 修改文件内所有标记数据的范围
  changeFileRange(fileName: string, line: number, difference: number) {
    state.markData[fileName].markDetails.forEach(e => {
      if (e.range[0] <= line && e.range[1] >= line) {
        let newEnd = Number(e.range[1]) + difference;
        e.range[1] = newEnd < e.range[0] ? e.range[0] : newEnd;
        const activeEditor = window.activeTextEditor;
        let range = new Range(
          new Position(e.range[0], 0),
          new Position(e.range[1], e.range[2])
        );
        let fileMarkText = activeEditor?.document.getText(range);
        fileMarkText = removeBlankSpace(fileMarkText);
        e.fileMarkText = fileMarkText;
        FmWebViewPanel.currentPanel?.sendMessage({
          type: webViewScriptEnum.changeMarkText,
          data: {
            key: e.attributeDecorationTypeKey,
            fileText: fileMarkText
          },
        });
      } else if (e.range[0] > line) {
        let newStart = Number(e.range[0]) + difference;
        let newEnd = Number(e.range[1]) + difference;
        e.range[0] = newStart<0?0:newStart;
        e.range[1] = newEnd<0?0:newEnd;
      }
    });
  },
};

export { state, mutations, getter };
