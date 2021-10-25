/*
 * @autoAdd: false
 * @Author: depp.chen
 * @Date: 2021-10-14 16:07:35
 * @LastEditors: depp.chen
 * @LastEditTime: 2021-10-25 14:04:36
 * @Description: 快捷键标记操作
 */
import { commands, window, Range, Position, OverviewRulerLane } from "vscode";
import { shortcutMarkEnum } from "../enums";
import { commandIsRegister } from "../utils/index";
import { state, mutations } from "../store";
import { FmWebViewPanel } from "../features/webView";
import { webViewScriptEnum } from "../enums/index";
export class FmShortcut {
  constructor() {
    this.registerLocationMark();
    this.registerMarkRecord();
    this.registerRemoveMark();
  }

  // 快捷标记command
  private static readonly LocationMark = shortcutMarkEnum.locationMark;
  // 弹出输入框command
  private static readonly MarkRecord = shortcutMarkEnum.markRecord;
  // 删除标记
  private static readonly RemoveMark = shortcutMarkEnum.removeMark;

  // FmShortcut类实例
  public static currentFmShortcut: FmShortcut | undefined;

  // 实例化
  public static initFmShortcut() {
    FmShortcut.currentFmShortcut = new FmShortcut();
  }

  async registerLocationMark() {
    let isRegister = await commandIsRegister(FmShortcut.LocationMark);
    // 如果已经注册了command Key则不再进行注册
    if (isRegister) {
      return;
    }
    commands.registerCommand(FmShortcut.LocationMark, () => {
      this.locationMark();
    });
  }

  async registerMarkRecord() {
    let isRegister = await commandIsRegister(FmShortcut.MarkRecord);
    // 如果已经注册了command Key则不再进行注册
    if (isRegister) {
      return;
    }
    commands.registerCommand(FmShortcut.MarkRecord, async () => {
      this.markRecord();
    });
  }

  async registerRemoveMark() {
    let isRegister = await commandIsRegister(FmShortcut.RemoveMark);
    // 如果已经注册了command Key则不再进行注册
    if (isRegister) {
      return;
    }
    commands.registerCommand(FmShortcut.RemoveMark, async () => {
      this.removeMark();
    });
  }

  /**
   * @description: 计算增加样式区间是否已经存在，避免重复渲染样式
   * @author: depp.chen
   * @param { number } startLine: range开始行
   * @param { number } endLine: range结束行
   * @param { string } fileName： 当前文件名
   */  
  private calculateRange(startLine:number, endLine:number, fileName:string){
    let markData = state.markData[fileName];
    if(markData){
      let target = markData.some(e=>{
        return e.range[0] <= startLine && e.range[1] >= endLine;
      });
      return target;
    }else{
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
      if (startLine && endLine && fileName) {
        if(this.calculateRange(startLine, endLine, fileName)){
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
          let textEditorDecorationType = window.createTextEditorDecorationType({
            overviewRulerColor: "rgba(208,2,27,1)",
            backgroundColor: "rgba(208,2,27,0.2)",
            // 右侧光标
            overviewRulerLane: OverviewRulerLane.Full,
          });
          // 样式添加
          activeEditor?.setDecorations(textEditorDecorationType, [{ range }]);
          // 获取选中的文本
          let fileMarkText = activeEditor?.document.getText(range);
          mutations.addMarkData(fileName, {
            range: [startLine, endLine, endPosition],
            fileMarkText,
            textEditorDecorationType,
          });
          // 和webview脚本信息交流
          FmWebViewPanel.currentPanel?.sendMessage({
            type: webViewScriptEnum.addMarkItem,
            fileName,
            data: {
              range: [startLine, endLine, endPosition],
              fileMarkText,
              textEditorDecorationTypeKey: textEditorDecorationType.key,
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
   * @description: 快速删除标记
   * @author: depp.chen
   */
  private removeMark() {
    // 当前激活的文档
    const activeEditor = window.activeTextEditor;
    try {
      let startLine = activeEditor?.selection.start.line;
      let endLine = activeEditor?.selection.end.line;
      let fileName = activeEditor?.document.fileName;
      let index = -1;
      if (startLine && endLine && fileName) {
        let activeMarkData = state.markData[fileName];
        if (activeMarkData) {
          let target = activeMarkData.find(
            (e,i) =>{ 
            if(e.range[0] === startLine && e.range[1] === endLine){
              index = i;
              return true;
            }
          }
          );
          if (target) {
            target.textEditorDecorationType?.dispose();
            mutations.deleteMarkData(fileName, index);
            // 和webview脚本信息交流
            FmWebViewPanel.currentPanel?.sendMessage({
              type: webViewScriptEnum.deleteMarkItem,
              data: target.textEditorDecorationType?.key,
            });
          }
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
        let markData = state.markData[fileName];
        if (markData) {
          let target = markData.find((e) => {
            let start = e.range[0];
            let end = e.range[1];
            return startLine && endLine && start <= startLine && end >= endLine;
          });
          if (target && target.textEditorDecorationType) {
            let record = await window.showInputBox();
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
