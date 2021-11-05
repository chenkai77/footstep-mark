/*
 * @Author: depp.chen
 * @Date: 2021-10-25 11:14:36
 * @LastEditors: depp.chen
 * @LastEditTime: 2021-11-05 16:13:02
 * @Description:
 */
import { window, Range, Position, workspace } from "vscode";
import { FmWebViewPanel } from "../features/webView";
import { state, getter, mutations } from "../store";
import { webViewScriptEnum } from "../enums";
export class FmWindowListen {
  private constructor() {
    this.activeTextEditorChange();
  }

  // FmShortcut类实例
  public static currentFmWindowListen: FmWindowListen | undefined;
  // 实例化
  public static initFmWindowListen() {
    FmWindowListen.currentFmWindowListen = new FmWindowListen();
  }

  /**
   * @description: 监听编辑器编辑的文件修改时
   * @author: depp.chen
   */
  public activeTextEditorChange() {
    window.onDidChangeActiveTextEditor((textEditor) => {
      let fileName = textEditor?.document.fileName;
      let markData;
      if (fileName) {
        markData = state.markData[fileName]?.markDetails;
      }
      if (markData) {
        if (fileName && textEditor?.viewColumn) {
          mutations.changeViewColumn(fileName, textEditor?.viewColumn);
          FmWebViewPanel.currentPanel?.sendMessage({
            type: webViewScriptEnum.changeViewColumn,
            data: {
              fileName,
              viewColumn: textEditor?.viewColumn,
            },
          });
        }

        markData.forEach((e) => {
          // 计算范围
          let range = new Range(
            new Position(e.range[0], 0),
            new Position(e.range[1], e.range[2])
          );
          textEditor?.setDecorations(e.textEditorDecorationType, [
            {
              range,
              renderOptions: {
                after: {
                  contentText: e.record ? e.record : "",
                  color: "rgba(208,2,27,0.4)",
                  margin: "0 0 0 20px",
                },
              },
            },
          ]);
        });
      }
    });
    workspace.onDidChangeTextDocument((e) => {
      let fileName = e.document.fileName;
      let oldLineCount = getter.getLineCount(fileName);
      if (state.markData[fileName]) {
        let contentChanges = e.contentChanges;
        if (contentChanges && contentChanges.length && oldLineCount) {
          if (e.document.lineCount !== oldLineCount) {
            mutations.changeLineCount(fileName, e.document.lineCount);
            let difference = e.document.lineCount - oldLineCount;
            console.log(difference);
            let startLine = contentChanges[0].range.start.line;
            mutations.changeFileRange(fileName, startLine, difference);
            FmWebViewPanel.currentPanel?.sendMessage({
              type: webViewScriptEnum.changeRange,
              data: {
                fileName,
                line: startLine,
                difference,
              },
            });
          }
        }
      }
    });
  }
}
