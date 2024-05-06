/*
 * @autoAdd: false
 * @Author: depp.chen
 * @Date: 2021-10-14 16:07:35
 * @LastEditors: depp.chen
 * @LastEditTime: 2024-04-25 09:46:18
 * @Description: 快捷键标记操作
 */
import {
  commands,
  window,
  Range,
  Position,
  OverviewRulerLane,
  Disposable,
  Uri,
  ExtensionContext,
} from "vscode";
import { shortcutMarkEnum } from "../enums";
import { commandIsRegister } from "../utils/index";
import { state, mutations } from "../store";
import { FmWebViewPanel } from "../features/webView";
import { webViewScriptEnum } from "../enums/index";
import { removeBlankSpace } from "../utils";
export class FmShortcut {
  constructor() {
    this.registerLocationMark();
    this.registerMarkRecord();
  }

  public LocationMarkDisposable: Disposable | undefined;
  public MarkRecordDisposable: Disposable | undefined;

  // 快捷标记command
  private static readonly LocationMark = shortcutMarkEnum.locationMark;
  // 弹出输入框command
  private static readonly MarkRecord = shortcutMarkEnum.markRecord;

  // FmShortcut类实例
  public static currentFmShortcut: FmShortcut | undefined;

  // 实例化
  public static initFmShortcut() {
    FmShortcut.currentFmShortcut = new FmShortcut();
  }

  // 销毁
  public static disposeShortcutMark() {
    FmShortcut.currentFmShortcut?.LocationMarkDisposable?.dispose();
    FmShortcut.currentFmShortcut?.MarkRecordDisposable?.dispose();
  }

  async registerLocationMark() {
    let isRegister = await commandIsRegister(FmShortcut.LocationMark);
    // 如果已经注册了command Key则不再进行注册
    if (isRegister) {
      return;
    }
    this.LocationMarkDisposable = commands.registerCommand(
      FmShortcut.LocationMark,
      () => {
        this.locationMark();
      }
    );
    state.context?.subscriptions.push(this.LocationMarkDisposable);
  }

  async registerMarkRecord() {
    let isRegister = await commandIsRegister(FmShortcut.MarkRecord);
    // 如果已经注册了command Key则不再进行注册
    if (isRegister) {
      return;
    }
    this.MarkRecordDisposable = commands.registerCommand(
      FmShortcut.MarkRecord,
      async () => {
        this.markRecord();
      }
    );
    state.context?.subscriptions.push(this.MarkRecordDisposable);
  }

  /**
   * @description: 计算增加样式区间是否已经存在，避免重复渲染样式
   * @author: depp.chen
   * @param { number } startLine: range开始行
   * @param { number } endLine: range结束行
   * @param { string } fileName： 当前文件名
   */
  private calculateRange(startLine: number, endLine: number, fileName: string) {
    let activeMarkData = state.markData[fileName]?.markDetails;
    if (activeMarkData) {
      let index = -1;
      if (activeMarkData) {
        let target = activeMarkData.find((e, i) => {
          if (e.range[0] <= startLine && e.range[1] >= endLine) {
            index = i;
            return true;
          }
        });
        if (target) {
          target.textEditorDecorationType?.dispose();
          mutations.deleteMarkData(fileName, index);
          // 和webview脚本信息交流
          FmWebViewPanel.currentPanel?.sendMessage({
            type: webViewScriptEnum.deleteMarkItem,
            data: {
              fileName,
              attributeDecorationTypeKey: target.textEditorDecorationType?.key,
            },
          });
        } else {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * @description: 快速标记
   * @author: depp.chen
   */
  private async locationMark() {
    // 当前激活的文档
    const activeEditor = window.activeTextEditor;
    try {
      let startLine = activeEditor?.selection.start.line;
      let endLine = activeEditor?.selection.end.line;
      let fileName = activeEditor?.document.fileName;
      if (startLine !== undefined && endLine !== undefined && fileName) {
        if (this.calculateRange(startLine, endLine, fileName)) {
          return;
        }
        // 获取最后的文本宽度
        let endPosition = activeEditor?.document.lineAt(endLine).text.length;
        if (endPosition) {
          // 计算范围
          let range = new Range(
            new Position(startLine, 0),
            new Position(endLine, endPosition)
          );
          // const deleteImgPath = Uri.joinPath(
          //   (state.context as ExtensionContext).extensionUri,
          //   "media",
          //   "icon.svg"
          // );
          let textEditorDecorationType = window.createTextEditorDecorationType({
            overviewRulerColor: "rgba(208,2,27,1)",
            backgroundColor: "rgba(208,2,27,0.1)",
            // 右侧光标
            isWholeLine: true,
            overviewRulerLane: OverviewRulerLane.Full,
            // gutterIconPath: deleteImgPath,
            gutterIconSize: "contain",
          });
          // 样式添加
          activeEditor?.setDecorations(textEditorDecorationType, [{ range }]);
          // 获取选中的文本
          let fileMarkText = activeEditor?.document.getText(range);

          fileMarkText = removeBlankSpace(fileMarkText);

          let attributeDecorationTypeKey = textEditorDecorationType.key;
          mutations.addMarkData(
            fileName,
            {
              range: [startLine, endLine, endPosition],
              fileMarkText,
              textEditorDecorationType,
              attributeDecorationTypeKey,
            },
            activeEditor?.viewColumn,
            activeEditor?.document.lineCount
          );
          // 和webview脚本信息交流
          FmWebViewPanel.currentPanel?.sendMessage({
            type: webViewScriptEnum.addMarkItem,
            data: {
              fileName,
              range: [startLine, endLine, endPosition],
              fileMarkText,
              viewColumn: activeEditor?.viewColumn,
              lineCount: activeEditor?.document.lineCount,
              attributeDecorationTypeKey,
            },
          });
        }
      }
    } catch (error: any) {
      const message = error.message ?? error;
      window.showErrorMessage(message);
    }
  }

  /**
   * @description: 注册标记增加标记文本
   * @author: depp.chen
   */
  async markRecord() {
    // 当前激活的文档
    const activeEditor = window.activeTextEditor;
    try {
      let startLine = activeEditor?.selection.start.line;
      let endLine = activeEditor?.selection.end.line;
      let fileName = activeEditor?.document.fileName;
      if (startLine && endLine && fileName) {
        let markData = state.markData[fileName].markDetails;
        if (markData) {
          let target = markData.find((e) => {
            let start = e.range[0];
            let end = e.range[1];
            return startLine && endLine && start <= startLine && end >= endLine;
          });
          if (target && target.textEditorDecorationType) {
            let record = await window.showInputBox({
              placeHolder: "请输入标记备注",
            });
            target.record = record;
            let range = new Range(
              new Position(target.range[0], 0),
              new Position(target.range[1], target.range[2])
            );
            activeEditor?.setDecorations(target.textEditorDecorationType, [
              {
                range,
                renderOptions: {
                  after: {
                    contentText: record,
                    color: "rgba(208,2,27,0.4)",
                    margin: "0 0 0 20px",
                  },
                },
              },
            ]);
            // 和webview脚本信息交流
            FmWebViewPanel.currentPanel?.sendMessage({
              type: webViewScriptEnum.addMarkRecord,
              data: {
                key: target.textEditorDecorationType?.key,
                record,
              },
            });
          }
        }
      }
    } catch (error: any) {
      const message = error.message ?? error;
      window.showErrorMessage(message);
    }
  }
}
